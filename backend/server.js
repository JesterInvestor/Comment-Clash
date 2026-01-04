const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const gameManager = require('./game/gameManager');
const { initializeFirebase } = require('./services/firebase');
const { initializeRedis } = require('./services/redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Initialize services
initializeFirebase();
initializeRedis();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create or join a game room
  socket.on('createRoom', async (data, callback) => {
    try {
      const room = await gameManager.createRoom(socket.id, data.playerName);
      socket.join(room.code);
      callback({ success: true, room });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('joinRoom', async (data, callback) => {
    try {
      const room = await gameManager.joinRoom(data.roomCode, socket.id, data.playerName);
      socket.join(data.roomCode);
      io.to(data.roomCode).emit('playerJoined', room);
      callback({ success: true, room });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('startGame', async (data, callback) => {
    try {
      await gameManager.startGame(data.roomCode, socket.id);
      const gameState = await gameManager.getGameState(data.roomCode);
      io.to(data.roomCode).emit('gameStarted', gameState);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('submitCaption', async (data, callback) => {
    try {
      await gameManager.submitCaption(data.roomCode, socket.id, data.captionId);
      const gameState = await gameManager.getGameState(data.roomCode);
      io.to(data.roomCode).emit('captionSubmitted', { 
        playerId: socket.id, 
        allSubmitted: gameState.allSubmitted 
      });
      
      if (gameState.allSubmitted) {
        io.to(data.roomCode).emit('readyForJudging', gameState);
      }
      
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('judgeCaption', async (data, callback) => {
    try {
      const result = await gameManager.judgeCaption(data.roomCode, socket.id, data.winnerId);
      io.to(data.roomCode).emit('roundComplete', result);
      
      if (result.gameComplete) {
        io.to(data.roomCode).emit('gameComplete', result);
      } else {
        // Start next round
        setTimeout(() => {
          gameManager.startNextRound(data.roomCode).then((nextRoundState) => {
            io.to(data.roomCode).emit('nextRound', nextRoundState);
          });
        }, 5000);
      }
      
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    try {
      const roomCode = await gameManager.handleDisconnect(socket.id);
      if (roomCode) {
        const gameState = await gameManager.getGameState(roomCode);
        io.to(roomCode).emit('playerLeft', gameState);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Comment Clash server running on port ${PORT}`);
});
