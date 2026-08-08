import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DifficultySelector from '../components/DifficultySelector';
import BigButton from '../components/BigButton';
import { getHighScore } from '../utils/storage';
import { colors, difficultyColors } from '../utils/theme';
import { QUESTIONS_PER_QUIZ } from '../utils/constants';

export default function HomeScreen({ navigation }) {
  const [difficulty, setDifficulty] = useState('Easy');
  const [highScore, setHighScore] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getHighScore(difficulty).then((value) => {
        if (isActive) setHighScore(value);
      });
      return () => {
        isActive = false;
      };
    }, [difficulty])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧮 MathPlay</Text>
        <Text style={styles.subtitle}>Practice makes perfect!</Text>

        <Text style={styles.sectionLabel}>Choose your level</Text>
        <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

        <Text style={styles.highScore}>
          🏆 Best score ({difficulty}): {highScore} / {QUESTIONS_PER_QUIZ}
        </Text>

        <BigButton
          label="Start ▶"
          color={difficultyColors[difficulty]}
          onPress={() => navigation.navigate('Quiz', { difficulty })}
          style={styles.startButton}
        />

        <BigButton
          label="🦁 🐸 2-Player Memory Game"
          color={colors.purple}
          onPress={() => navigation.navigate('Memory')}
          style={styles.memoryButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 14,
  },
  highScore: {
    fontSize: 16,
    color: colors.textDark,
    marginTop: 28,
    marginBottom: 28,
    fontWeight: '600',
  },
  startButton: {
    minWidth: 220,
  },
  memoryButton: {
    marginTop: 16,
    minWidth: 220,
    maxWidth: '90%',
  },
});
