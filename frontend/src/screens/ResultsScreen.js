import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useGame } from '../contexts/GameContext';

export default function ResultsScreen({ navigation }) {
  const { state } = useGame();

  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const renderPlayer = ({ item, index }) => (
    <View style={[
      styles.playerItem,
      index === 0 && styles.winnerItem
    ]}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <Text style={styles.playerName}>{item.name}</Text>
      <Text style={styles.playerScore}>{item.score} pts</Text>
    </View>
  );

  const handlePlayAgain = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Game Over!</Text>
          <View style={styles.winnerContainer}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.winnerName}>{winner?.name}</Text>
            <Text style={styles.winnerScore}>{winner?.score} points</Text>
          </View>
        </View>

        <View style={styles.leaderboard}>
          <Text style={styles.leaderboardTitle}>Final Scores</Text>
          <FlatList
            data={sortedPlayers}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.leaderboardList}
          />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handlePlayAgain}
        >
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thanks for playing Comment Clash!
          </Text>
          <Text style={styles.footerSubtext}>
            Share with friends and play more rounds
          </Text>
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
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 30,
  },
  winnerContainer: {
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    borderWidth: 3,
    borderColor: '#f39c12',
  },
  trophy: {
    fontSize: 60,
    marginBottom: 15,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 5,
  },
  winnerScore: {
    fontSize: 18,
    color: '#999',
  },
  leaderboard: {
    flex: 1,
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  leaderboardList: {
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
  winnerItem: {
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    width: 40,
  },
  playerName: {
    flex: 1,
    fontSize: 18,
    color: '#fff',
  },
  playerScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  button: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  footerSubtext: {
    color: '#666',
    fontSize: 14,
  },
});
