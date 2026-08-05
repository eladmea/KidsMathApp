import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import StarRating from '../components/StarRating';
import BigButton from '../components/BigButton';
import { saveHighScoreIfBetter } from '../utils/storage';
import { calculateStars } from '../utils/scoring';
import { colors, difficultyColors } from '../utils/theme';

const MESSAGES = {
  3: 'Amazing job! 🎉',
  2: 'Great work! 👏',
  1: 'Nice try! Keep practicing! 💪',
};

export default function ResultsScreen({ route, navigation }) {
  const { score, total, difficulty } = route.params;
  const stars = calculateStars(score, total);
  const [highScore, setHighScore] = useState(score);

  useEffect(() => {
    saveHighScoreIfBetter(difficulty, score).then(setHighScore);
  }, [difficulty, score]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{MESSAGES[stars]}</Text>
        <StarRating stars={stars} />
        <Text style={styles.scoreText}>
          You scored {score} out of {total}
        </Text>
        <Text style={styles.highScoreText}>🏆 Best score: {highScore} / {total}</Text>

        <View style={styles.buttons}>
          <BigButton
            label="Play Again"
            color={difficultyColors[difficulty]}
            onPress={() => navigation.replace('Quiz', { difficulty })}
            style={styles.button}
          />
          <BigButton
            label="Back to Home"
            color={colors.primary}
            onPress={() => navigation.popToTop()}
            style={styles.button}
          />
        </View>
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
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 12,
  },
  highScoreText: {
    fontSize: 16,
    color: colors.textDark,
    marginTop: 8,
    marginBottom: 32,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: '80%',
  },
});
