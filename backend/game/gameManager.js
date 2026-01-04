const { getRedisClient } = require('../services/redis');
const { saveGameToFirestore, getGameFromFirestore } = require('../services/firebase');
const { getRandomVideo } = require('../services/videoService');
const { generateCaptions } = require('./captionGenerator');

const ROUND_DURATION = parseInt(process.env.ROUND_DURATION) || 45000;
const CARDS_PER_PLAYER = parseInt(process.env.CARDS_PER_PLAYER) || 7;
const GAME_CYCLES = parseInt(process.env.GAME_CYCLES) || 2;
const MIN_PLAYERS = parseInt(process.env.MIN_PLAYERS) || 3;
const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS) || 8;

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerToRoom = new Map();
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createRoom(hostId, playerName) {
    const code = this.generateRoomCode();
    
    const room = {
      code,
      host: hostId,
      players: [{
        id: hostId,
        name: playerName,
        score: 0,
        cards: []
      }],
      state: 'lobby',
      currentRound: 0,
      currentCycle: 0,
      currentJudge: 0,
      currentVideo: null,
      submissions: [],
      createdAt: Date.now()
    };

    this.games.set(code, room);
    this.playerToRoom.set(hostId, code);
    
    // Cache in Redis
    const redis = getRedisClient();
    if (redis) {
      await redis.set(`room:${code}`, JSON.stringify(room), { EX: 3600 });
    }

    return room;
  }

  async joinRoom(roomCode, playerId, playerName) {
    let room = this.games.get(roomCode);
    
    if (!room) {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(`room:${roomCode}`);
        if (cached) {
          room = JSON.parse(cached);
          this.games.set(roomCode, room);
        }
      }
    }

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.state !== 'lobby') {
      throw new Error('Game already in progress');
    }

    if (room.players.length >= MAX_PLAYERS) {
      throw new Error('Room is full');
    }

    if (room.players.some(p => p.id === playerId)) {
      throw new Error('Already in room');
    }

    room.players.push({
      id: playerId,
      name: playerName,
      score: 0,
      cards: []
    });

    this.playerToRoom.set(playerId, roomCode);
    
    // Update cache
    const redis = getRedisClient();
    if (redis) {
      await redis.set(`room:${roomCode}`, JSON.stringify(room), { EX: 3600 });
    }

    return room;
  }

  async startGame(roomCode, requesterId) {
    const room = this.games.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.host !== requesterId) {
      throw new Error('Only host can start the game');
    }

    if (room.players.length < MIN_PLAYERS) {
      throw new Error(`Need at least ${MIN_PLAYERS} players to start`);
    }

    room.state = 'playing';
    room.currentRound = 0;
    room.currentCycle = 0;
    room.currentJudge = 0;

    // Deal cards to all players
    const allCaptions = generateCaptions(room.players.length * CARDS_PER_PLAYER * 2);
    let captionIndex = 0;
    
    for (let player of room.players) {
      player.cards = allCaptions.slice(captionIndex, captionIndex + CARDS_PER_PLAYER);
      captionIndex += CARDS_PER_PLAYER;
      player.score = 0;
    }

    // Get first video
    room.currentVideo = await getRandomVideo();
    room.submissions = [];
    room.roundStartTime = Date.now();

    // Save to Firestore
    await saveGameToFirestore(roomCode, room);

    return room;
  }

  async submitCaption(roomCode, playerId, captionId) {
    const room = this.games.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.state !== 'playing') {
      throw new Error('Game not in progress');
    }

    const judgeId = room.players[room.currentJudge].id;
    if (playerId === judgeId) {
      throw new Error('Judge cannot submit a caption');
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not in game');
    }

    const caption = player.cards.find(c => c.id === captionId);
    if (!caption) {
      throw new Error('Invalid caption');
    }

    // Check if already submitted
    if (room.submissions.some(s => s.playerId === playerId)) {
      throw new Error('Already submitted for this round');
    }

    room.submissions.push({
      playerId,
      captionId,
      caption: caption.text
    });

    return room;
  }

  async judgeCaption(roomCode, judgeId, winnerId) {
    const room = this.games.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    const expectedJudgeId = room.players[room.currentJudge].id;
    if (judgeId !== expectedJudgeId) {
      throw new Error('Not the current judge');
    }

    const winningSubmission = room.submissions.find(s => s.playerId === winnerId);
    if (!winningSubmission) {
      throw new Error('Invalid winner selection');
    }

    // Award point to winner
    const winner = room.players.find(p => p.id === winnerId);
    winner.score += 1;

    // Remove used cards
    for (let submission of room.submissions) {
      const player = room.players.find(p => p.id === submission.playerId);
      player.cards = player.cards.filter(c => c.id !== submission.captionId);
    }

    // Prepare result
    const result = {
      winner: winnerId,
      winnerName: winner.name,
      winningCaption: winningSubmission.caption,
      scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      gameComplete: false
    };

    // Check if game is complete
    const totalRounds = room.players.length * GAME_CYCLES;
    room.currentRound += 1;

    if (room.currentRound >= totalRounds) {
      room.state = 'complete';
      result.gameComplete = true;
      result.finalWinner = room.players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );
      
      // Save final state to Firestore
      await saveGameToFirestore(roomCode, room);
    }

    return result;
  }

  async startNextRound(roomCode) {
    const room = this.games.get(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    // Rotate judge
    room.currentJudge = (room.currentJudge + 1) % room.players.length;

    // Deal new cards to players who need them
    const allNewCaptions = generateCaptions(room.players.length * 3);
    let captionIndex = 0;
    
    for (let player of room.players) {
      if (player.cards.length < CARDS_PER_PLAYER) {
        const needed = CARDS_PER_PLAYER - player.cards.length;
        player.cards.push(...allNewCaptions.slice(captionIndex, captionIndex + needed));
        captionIndex += needed;
      }
    }

    // Get new video
    room.currentVideo = await getRandomVideo();
    room.submissions = [];
    room.roundStartTime = Date.now();

    return room;
  }

  async getGameState(roomCode) {
    let room = this.games.get(roomCode);
    
    if (!room) {
      const redis = getRedisClient();
      if (redis) {
        const cached = await redis.get(`room:${roomCode}`);
        if (cached) {
          room = JSON.parse(cached);
          this.games.set(roomCode, room);
        }
      }
    }

    if (!room) {
      return null;
    }

    // Check if all non-judge players have submitted
    const judgeId = room.players[room.currentJudge]?.id;
    const nonJudgePlayers = room.players.filter(p => p.id !== judgeId);
    room.allSubmitted = nonJudgePlayers.length === room.submissions.length;

    return room;
  }

  async handleDisconnect(playerId) {
    const roomCode = this.playerToRoom.get(playerId);
    
    if (!roomCode) {
      return null;
    }

    const room = this.games.get(roomCode);
    if (!room) {
      return null;
    }

    // Remove player
    room.players = room.players.filter(p => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    // If host left, assign new host
    if (room.host === playerId && room.players.length > 0) {
      room.host = room.players[0].id;
    }

    // If not enough players, end game
    if (room.players.length < MIN_PLAYERS && room.state === 'playing') {
      room.state = 'ended';
    }

    // If no players left, clean up room
    if (room.players.length === 0) {
      this.games.delete(roomCode);
      const redis = getRedisClient();
      if (redis) {
        await redis.del(`room:${roomCode}`);
      }
    }

    return roomCode;
  }
}

module.exports = new GameManager();
