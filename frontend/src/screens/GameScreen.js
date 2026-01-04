import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert
} from 'react-native';
import { Video } from 'expo-av';
import { useGame } from '../contexts/GameContext';

export default function GameScreen({ navigation }) {
  const { state, submitCaption, judgeCaption } = useGame();
  const [selectedCard, setSelectedCard] = useState(null);
  const [timer, setTimer] = useState(45);
  const [phase, setPhase] = useState('playing'); // playing, judging, results

  const isJudge = state.players[state.currentJudge]?.id === require('../services/SocketService').default.getSocket()?.id;

  useEffect(() => {
    const socket = require('../services/SocketService').default.getSocket();

    const handleReadyForJudging = () => {
      setPhase('judging');
    };

    const handleRoundComplete = () => {
      setPhase('results');
      setTimeout(() => {
        setPhase('playing');
        setSelectedCard(null);
        setTimer(45);
      }, 5000);
    };

    const handleGameComplete = () => {
      navigation.navigate('Results');
    };

    socket?.on('readyForJudging', handleReadyForJudging);
    socket?.on('roundComplete', handleRoundComplete);
    socket?.on('gameComplete', handleGameComplete);

    return () => {
      socket?.off('readyForJudging', handleReadyForJudging);
      socket?.off('roundComplete', handleRoundComplete);
      socket?.off('gameComplete', handleGameComplete);
    };
  }, [navigation]);

  useEffect(() => {
    if (phase === 'playing' && !isJudge) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, isJudge]);

  const handleCardSelect = async (card) => {
    if (selectedCard || isJudge) return;

    try {
      setSelectedCard(card.id);
      await submitCaption(state.roomCode, card.id);
    } catch (error) {
      Alert.alert('Error', error.message);
      setSelectedCard(null);
    }
  };

  const handleJudgeSelection = async (submission) => {
    if (!isJudge || phase !== 'judging') return;

    try {
      await judgeCaption(state.roomCode, submission.playerId);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedCard === item.id && styles.cardSelected
      ]}
      onPress={() => handleCardSelect(item)}
      disabled={selectedCard !== null || isJudge}
    >
      <Text style={styles.cardText}>{item.text}</Text>
    </TouchableOpacity>
  );

  const renderSubmission = ({ item }) => (
    <TouchableOpacity
      style={styles.submission}
      onPress={() => handleJudgeSelection(item)}
      disabled={!isJudge}
    >
      <Text style={styles.submissionText}>{item.caption}</Text>
    </TouchableOpacity>
  );

  if (phase === 'judging' && isJudge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>You're the Judge!</Text>
            <Text style={styles.subtitle}>Pick the funniest caption</Text>
          </View>

          {state.currentVideo && (
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: state.currentVideo.url }}
                style={styles.video}
                shouldPlay
                isLooping
                resizeMode="contain"
              />
            </View>
          )}

          <FlatList
            data={state.submissions}
            renderItem={renderSubmission}
            keyExtractor={(item) => item.playerId}
            contentContainerStyle={styles.submissionsList}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'judging' && !isJudge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.waiting}>
            <Text style={styles.waitingTitle}>Judge is deciding...</Text>
            <Text style={styles.waitingText}>
              {state.players[state.currentJudge]?.name} is picking the winner
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{timer}s</Text>
          </View>
          {isJudge ? (
            <Text style={styles.judgeText}>You're the Judge - Wait for players</Text>
          ) : (
            <Text style={styles.subtitle}>Pick your best caption!</Text>
          )}
        </View>

        {state.currentVideo && (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: state.currentVideo.url }}
              style={styles.video}
              shouldPlay
              isLooping
              resizeMode="contain"
            />
          </View>
        )}

        {!isJudge && (
          <View style={styles.cardsContainer}>
            <Text style={styles.cardsTitle}>Your Cards ({state.cards?.length || 0})</Text>
            <FlatList
              data={state.cards}
              renderItem={renderCard}
              keyExtractor={(item) => item.id}
              numColumns={1}
              contentContainerStyle={styles.cardsList}
            />
          </View>
        )}

        <View style={styles.scoreBar}>
          {state.players.map((player, index) => (
            <View key={player.id} style={styles.scoreItem}>
              <Text style={styles.scoreName}>
                {player.name} {index === state.currentJudge && '⚖️'}
              </Text>
              <Text style={styles.scorePoints}>{player.score}</Text>
            </View>
          ))}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  judgeText: {
    fontSize: 16,
    color: '#f39c12',
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: '#e74c3c',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  timer: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  cardsContainer: {
    flex: 1,
    marginBottom: 10,
  },
  cardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  cardsList: {
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  cardSelected: {
    borderColor: '#f39c12',
    backgroundColor: '#2a3a5e',
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  submissionsList: {
    paddingBottom: 20,
  },
  submission: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  submissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  scoreBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: '#16213e',
    padding: 10,
    borderRadius: 12,
  },
  scoreItem: {
    alignItems: 'center',
    margin: 5,
  },
  scoreName: {
    color: '#999',
    fontSize: 12,
  },
  scorePoints: {
    color: '#f39c12',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waiting: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 10,
  },
  waitingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
