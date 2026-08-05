import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import ScoreCounter from '../components/ScoreCounter';
import AnswerButton from '../components/AnswerButton';
import { generateQuestion } from '../utils/questionGenerator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { colors } from '../utils/theme';
import { QUESTIONS_PER_QUIZ } from '../utils/constants';

const ADVANCE_DELAY_MS = 900;

export default function QuizScreen({ route, navigation }) {
  const { difficulty } = route.params;
  const questions = useMemo(
    () => Array.from({ length: QUESTIONS_PER_QUIZ }, () => generateQuestion(difficulty)),
    [difficulty]
  );

  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const { playCorrect, playWrong } = useSoundEffects();
  const timeoutRef = useRef(null);

  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChoicePress(choice) {
    if (isAnswerLocked) return;

    const isCorrect = choice === currentQuestion.answer;
    setSelectedChoice(choice);
    setIsAnswerLocked(true);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      playCorrect();
    } else {
      playWrong();
    }

    timeoutRef.current = setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= QUESTIONS_PER_QUIZ) {
        navigation.replace('Results', {
          score: score + (isCorrect ? 1 : 0),
          total: QUESTIONS_PER_QUIZ,
          difficulty,
        });
      } else {
        setQuestionIndex(nextIndex);
        setSelectedChoice(null);
        setIsAnswerLocked(false);
      }
    }, ADVANCE_DELAY_MS);
  }

  function getButtonState(choice) {
    if (!isAnswerLocked) return 'default';
    if (choice === currentQuestion.answer) return 'correct';
    if (choice === selectedChoice) return 'wrong';
    return 'disabled';
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ProgressBar current={questionIndex + 1} total={QUESTIONS_PER_QUIZ} />
        <ScoreCounter score={score} />

        <View style={styles.questionBox}>
          <Text style={styles.questionText}>{currentQuestion.text} = ?</Text>
        </View>

        <View style={styles.choicesGrid}>
          {currentQuestion.choices.map((choice) => (
            <AnswerButton
              key={choice}
              value={choice}
              state={getButtonState(choice)}
              disabled={isAnswerLocked}
              onPress={() => handleChoicePress(choice)}
            />
          ))}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  questionBox: {
    marginVertical: 28,
  },
  questionText: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textDark,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
});
