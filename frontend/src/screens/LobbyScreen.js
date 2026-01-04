import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert
} from 'react-native';
import { useGame } from '../contexts/GameContext';

export default function LobbyScreen({ navigation, route }) {
  const { roomCode } = route.params;
  const { state, startGame } = useGame();

  useEffect(() => {
    const socket = require('../services/SocketService').default.getSocket();
    
    const handleGameStarted = () => {
      navigation.navigate('Game');
    };

    socket?.on('gameStarted', handleGameStarted);

    return () => {
      socket?.off('gameStarted', handleGameStarted);
    };
  }, [navigation]);

  const handleStartGame = async () => {
    if (state.players.length < 3) {
      Alert.alert('Not Enough Players', 'Need at least 3 players to start');
      return;
    }

    try {
      await startGame(roomCode);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderPlayer = ({ item, index }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerAvatar}>
        <Text style={styles.playerAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.playerName}>{item.name}</Text>
      {item.id === state.players[0]?.id && (
        <View style={styles.hostBadge}>
          <Text style={styles.hostBadgeText}>HOST</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Game Lobby</Text>
          <View style={styles.roomCodeContainer}>
            <Text style={styles.roomCodeLabel}>Room Code:</Text>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </View>
          <Text style={styles.subtitle}>
            {state.players.length}/8 players
          </Text>
        </View>

        <View style={styles.playersList}>
          <Text style={styles.playersTitle}>Players</Text>
          <FlatList
            data={state.players}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.playersContent}
          />
        </View>

        {state.isHost ? (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[
                styles.startButton,
                state.players.length < 3 && styles.startButtonDisabled
              ]}
              onPress={handleStartGame}
              disabled={state.players.length < 3}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
            {state.players.length < 3 && (
              <Text style={styles.warningText}>
                Waiting for at least 3 players...
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.waitingText}>
              Waiting for host to start the game...
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.infoText}>• 45 second rounds</Text>
          <Text style={styles.infoText}>• Rotating judge</Text>
          <Text style={styles.infoText}>• 2 cycles</Text>
          <Text style={styles.infoText}>• 7 cards per player</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 15,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  roomCodeLabel: {
    color: '#999',
    fontSize: 16,
    marginRight: 10,
  },
  roomCode: {
    color: '#f39c12',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  playersList: {
    flex: 1,
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  playersContent: {
    paddingBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  playerAvatarText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  hostBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#666',
  },
  startButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  waiting: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  waitingText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  info: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
  },
  infoText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
});
