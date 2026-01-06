// Mock external dependencies before requiring gameManager
jest.mock('../services/redis', () => ({
  getRedisClient: jest.fn(() => null),
  initializeRedis: jest.fn()
}));

jest.mock('../services/firebase', () => ({
  saveGameToFirestore: jest.fn(() => Promise.resolve()),
  getGameFromFirestore: jest.fn(() => Promise.resolve(null)),
  initializeFirebase: jest.fn()
}));

jest.mock('../services/videoService', () => ({
  getRandomVideo: jest.fn(() => Promise.resolve({
    id: 'test_video_1',
    filename: 'test.mp4',
    duration: 10,
    url: 'https://example.com/test.mp4'
  }))
}));

const gameManager = require('./gameManager');
const { generateCaptions } = require('./captionGenerator');

describe('GameManager - Core Logic (No External Dependencies)', () => {
  beforeEach(() => {
    // Reset the game manager state before each test
    gameManager.games.clear();
    gameManager.playerToRoom.clear();
  });

  describe('generateRoomCode', () => {
    test('should generate a 6 character room code', () => {
      const code = gameManager.generateRoomCode();
      
      expect(typeof code).toBe('string');
      expect(code.length).toBe(6);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    test('should generate unique room codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(gameManager.generateRoomCode());
      }
      
      // With random generation, we expect most codes to be unique
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('createRoom', () => {
    test('should create a new room with valid structure', async () => {
      const hostId = 'player_123';
      const playerName = 'TestPlayer';
      
      const room = await gameManager.createRoom(hostId, playerName);
      
      expect(room).toHaveProperty('code');
      expect(room).toHaveProperty('host', hostId);
      expect(room).toHaveProperty('players');
      expect(room).toHaveProperty('state', 'lobby');
      expect(room.players).toHaveLength(1);
      expect(room.players[0]).toMatchObject({
        id: hostId,
        name: playerName,
        score: 0,
        cards: []
      });
    });

    test('should track player to room mapping', async () => {
      const hostId = 'player_456';
      const playerName = 'Host';
      
      const room = await gameManager.createRoom(hostId, playerName);
      
      expect(gameManager.playerToRoom.get(hostId)).toBe(room.code);
    });
  });

  describe('joinRoom', () => {
    test('should allow player to join existing room', async () => {
      const hostId = 'host_1';
      const playerId = 'player_2';
      const room = await gameManager.createRoom(hostId, 'Host');
      
      const updatedRoom = await gameManager.joinRoom(room.code, playerId, 'Player2');
      
      expect(updatedRoom.players).toHaveLength(2);
      expect(updatedRoom.players[1]).toMatchObject({
        id: playerId,
        name: 'Player2',
        score: 0,
        cards: []
      });
    });

    test('should throw error for non-existent room', async () => {
      await expect(
        gameManager.joinRoom('NONEXISTENT', 'player_1', 'Player')
      ).rejects.toThrow('Room not found');
    });

    test('should prevent player from joining same room twice', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      
      await expect(
        gameManager.joinRoom(room.code, hostId, 'Host')
      ).rejects.toThrow('Already in room');
    });

    test('should prevent joining when room is full (8 players)', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      
      // Add 7 more players to reach max
      for (let i = 2; i <= 8; i++) {
        await gameManager.joinRoom(room.code, `player_${i}`, `Player${i}`);
      }
      
      // Try to add 9th player
      await expect(
        gameManager.joinRoom(room.code, 'player_9', 'Player9')
      ).rejects.toThrow('Room is full');
    });

    test('should prevent joining game in progress', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      
      // Add minimum players and start game
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      await gameManager.startGame(room.code, hostId);
      
      // Try to join after game started
      await expect(
        gameManager.joinRoom(room.code, 'player_4', 'Player4')
      ).rejects.toThrow('Game already in progress');
    });
  });

  describe('startGame', () => {
    test('should start game with minimum players', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      
      const startedRoom = await gameManager.startGame(room.code, hostId);
      
      expect(startedRoom.state).toBe('playing');
      expect(startedRoom.currentRound).toBe(0);
      expect(startedRoom.currentCycle).toBe(0);
      expect(startedRoom.currentJudge).toBe(0);
      expect(startedRoom.currentVideo).toBeDefined();
    });

    test('should deal cards to all players', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      
      await gameManager.startGame(room.code, hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      gameState.players.forEach(player => {
        expect(player.cards).toHaveLength(7); // CARDS_PER_PLAYER default is 7
      });
    });

    test('should throw error if not host', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      
      await expect(
        gameManager.startGame(room.code, 'player_2')
      ).rejects.toThrow('Only host can start the game');
    });

    test('should throw error with insufficient players', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      
      await expect(
        gameManager.startGame(room.code, hostId)
      ).rejects.toThrow('Need at least 3 players to start');
    });
  });

  describe('submitCaption', () => {
    test('should accept valid caption submission', async () => {
      const hostId = 'host_1';
      const playerId = 'player_2';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, playerId, 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      await gameManager.startGame(room.code, hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      const judgeId = gameState.players[gameState.currentJudge].id;
      const submitter = gameState.players.find(p => p.id !== judgeId);
      const captionId = submitter.cards[0].id;
      
      const result = await gameManager.submitCaption(room.code, submitter.id, captionId);
      
      expect(result.submissions).toHaveLength(1);
      expect(result.submissions[0]).toMatchObject({
        playerId: submitter.id,
        captionId: captionId
      });
    });

    test('should prevent judge from submitting', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      await gameManager.startGame(room.code, hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      const judgeId = gameState.players[gameState.currentJudge].id;
      const judge = gameState.players.find(p => p.id === judgeId);
      
      await expect(
        gameManager.submitCaption(room.code, judgeId, 'any_caption')
      ).rejects.toThrow('Judge cannot submit a caption');
    });

    test('should prevent duplicate submissions', async () => {
      const hostId = 'host_1';
      const playerId = 'player_2';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, playerId, 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      await gameManager.startGame(room.code, hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      const judgeId = gameState.players[gameState.currentJudge].id;
      const submitter = gameState.players.find(p => p.id !== judgeId);
      const captionId = submitter.cards[0].id;
      
      await gameManager.submitCaption(room.code, submitter.id, captionId);
      
      await expect(
        gameManager.submitCaption(room.code, submitter.id, captionId)
      ).rejects.toThrow('Already submitted for this round');
    });
  });

  describe('getGameState', () => {
    test('should return null for non-existent room', async () => {
      const state = await gameManager.getGameState('NONEXISTENT');
      expect(state).toBeNull();
    });

    test('should track submission status', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, 'player_2', 'Player2');
      await gameManager.joinRoom(room.code, 'player_3', 'Player3');
      await gameManager.startGame(room.code, hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      
      expect(gameState).toHaveProperty('allSubmitted');
      expect(gameState.allSubmitted).toBe(false);
    });
  });

  describe('handleDisconnect', () => {
    test('should remove player from room', async () => {
      const hostId = 'host_1';
      const playerId = 'player_2';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, playerId, 'Player2');
      
      await gameManager.handleDisconnect(playerId);
      
      const gameState = await gameManager.getGameState(room.code);
      expect(gameState.players).toHaveLength(1);
      expect(gameState.players[0].id).toBe(hostId);
    });

    test('should assign new host if host leaves', async () => {
      const hostId = 'host_1';
      const playerId = 'player_2';
      const room = await gameManager.createRoom(hostId, 'Host');
      await gameManager.joinRoom(room.code, playerId, 'Player2');
      
      await gameManager.handleDisconnect(hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      expect(gameState.host).toBe(playerId);
    });

    test('should clean up empty room', async () => {
      const hostId = 'host_1';
      const room = await gameManager.createRoom(hostId, 'Host');
      
      await gameManager.handleDisconnect(hostId);
      
      const gameState = await gameManager.getGameState(room.code);
      expect(gameState).toBeNull();
    });
  });
});
