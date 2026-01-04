import React, { createContext, useContext, useReducer, useEffect } from 'react';
import SocketService from '../services/SocketService';

const GameContext = createContext();

const initialState = {
  connected: false,
  roomCode: null,
  players: [],
  currentPlayer: null,
  gameState: 'lobby',
  currentVideo: null,
  cards: [],
  currentJudge: null,
  submissions: [],
  scores: [],
  timer: 45,
  isHost: false
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_ROOM':
      return { 
        ...state, 
        roomCode: action.payload.code,
        players: action.payload.players,
        isHost: action.payload.isHost
      };
    case 'UPDATE_GAME_STATE':
      return { ...state, ...action.payload };
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'UPDATE_TIMER':
      return { ...state, timer: action.payload };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    const socket = SocketService.connect();

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });

    socket.on('playerJoined', (room) => {
      dispatch({ 
        type: 'SET_ROOM', 
        payload: { ...room, isHost: state.isHost } 
      });
    });

    socket.on('gameStarted', (gameState) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    });

    socket.on('captionSubmitted', (data) => {
      dispatch({ 
        type: 'UPDATE_GAME_STATE', 
        payload: { submissions: data.submissions } 
      });
    });

    socket.on('roundComplete', (result) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: result });
    });

    socket.on('nextRound', (gameState) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    });

    socket.on('gameComplete', (result) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: { ...result, gameState: 'complete' } });
    });

    socket.on('playerLeft', (gameState) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    });

    return () => {
      SocketService.disconnect();
    };
  }, []);

  const createRoom = (playerName) => {
    return new Promise((resolve, reject) => {
      SocketService.emit('createRoom', { playerName }, (response) => {
        if (response.success) {
          dispatch({ 
            type: 'SET_ROOM', 
            payload: { ...response.room, isHost: true } 
          });
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const joinRoom = (roomCode, playerName) => {
    return new Promise((resolve, reject) => {
      SocketService.emit('joinRoom', { roomCode, playerName }, (response) => {
        if (response.success) {
          dispatch({ 
            type: 'SET_ROOM', 
            payload: { ...response.room, isHost: false } 
          });
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const startGame = (roomCode) => {
    return new Promise((resolve, reject) => {
      SocketService.emit('startGame', { roomCode }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const submitCaption = (roomCode, captionId) => {
    return new Promise((resolve, reject) => {
      SocketService.emit('submitCaption', { roomCode, captionId }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const judgeCaption = (roomCode, winnerId) => {
    return new Promise((resolve, reject) => {
      SocketService.emit('judgeCaption', { roomCode, winnerId }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  return (
    <GameContext.Provider 
      value={{ 
        state, 
        dispatch,
        createRoom,
        joinRoom,
        startGame,
        submitCaption,
        judgeCaption
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
