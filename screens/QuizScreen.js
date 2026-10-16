import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '../components/ProgressBar';
import ScoreCounter from '../components/ScoreCounter';
import AnswerButton from '../components/AnswerButton';
import QuestionVisual from '../components/QuestionVisual';
import NumberLineInput from '../components/NumberLineInput';
import { useProfiles } from '../context/ProfileContext';
import { useSoundEffects } from '../utils/useSoundEffects';
import { useNarrator } from '../utils/useNarrator';
import { buildSession, tallyBySkill } from '../utils/session';
import { getSkill } from '../curriculum/skills';
import { colors, shadow } from '../utils/theme';

const ADVANCE_DELAY_MS = 900;
// Number-line feedback needs longer to look at.
const NUMBER_LINE_DELAY_MS = 1800;

function isCorrectAnswer(question, choice) {
  if (question.type === 'numberLine') {
    return Math.abs(choice - question.answer) <= question.tolerance;
  }
  return choice === question.answer;
}

// Generic skill-driven round: works for a single skill (practice) or several
// interleaved skills (review).
export default function QuizScreen({ route, navigation }) {
  const { skillIds, mode = 'practice' } = route.params;
  const { activeProfile } = useProfiles();
  const questions = useMemo(() => buildSession(skillIds), [skillIds]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const { playCorrect, playWrong } = useSoundEffects();
  const { say, stop } = useNarrator(activeProfile?.narration);
  const timeoutRef = useRef(null);

  const currentQuestion = questions[questionIndex];
  const isAnswerLocked = selectedChoice !== null;
  const score = results.filter(Boolean).length;
  const title = mode === 'review' ? '⭐ Daily Review' : `${getSkill(skillIds[0])?.emoji ?? ''} ${getSkill(skillIds[0])?.title ?? ''}`;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentQuestion) say(currentQuestion.speech);
  }, [currentQuestion, say]);

  if (!currentQuestion) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>This game isn't ready yet.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.exitLink}>
          <Text style={styles.exitLinkText}>← Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  function handleChoicePress(choice) {
    if (isAnswerLocked) return;

    const isCorrect = isCorrectAnswer(currentQuestion, choice);
    const nextResults = [...results, isCorrect];
    setSelectedChoice(choice);
    setResults(nextResults);
    stop();

    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }

    timeoutRef.current = setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= questions.length) {
        navigation.replace('Results', {
          skillIds,
          mode,
          score: nextResults.filter(Boolean).length,
          total: questions.length,
          tallies: tallyBySkill(questions, nextResults),
        });
      } else {
        setQuestionIndex(nextIndex);
        setSelectedChoice(null);
      }
    }, currentQuestion.type === 'numberLine' ? NUMBER_LINE_DELAY_MS : ADVANCE_DELAY_MS);
  }

  function getButtonState(choice) {
    if (!isAnswerLocked) return 'default';
    if (choice === currentQuestion.answer) return 'correct';
    if (choice === selectedChoice) return 'wrong';
    return 'disabled';
  }

  const isLongPrompt = currentQuestion.prompt.length > 12;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.roundButton, shadow]} accessibilityLabel="Quit">
            <Text style={styles.roundButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={() => say(currentQuestion.speech, { force: true })}
            style={[styles.roundButton, shadow]}
            accessibilityLabel="Say it again"
          >
            <Text style={styles.roundButtonText}>🔊</Text>
          </Pressable>
        </View>

        <ProgressBar current={questionIndex + 1} total={questions.length} />
        <ScoreCounter score={score} />

        <View style={styles.questionBox}>
          <Text style={[styles.questionText, isLongPrompt && styles.questionTextLong]}>{currentQuestion.prompt}</Text>
          <QuestionVisual key={currentQuestion.id} visual={currentQuestion.visual} />
        </View>

        {currentQuestion.type === 'numberLine' ? (
          <NumberLineInput
            key={currentQuestion.id}
            min={currentQuestion.min}
            max={currentQuestion.max}
            guess={selectedChoice}
            answer={currentQuestion.answer}
            isCorrect={isAnswerLocked && isCorrectAnswer(currentQuestion, selectedChoice)}
            disabled={isAnswerLocked}
            onGuess={handleChoicePress}
          />
        ) : (
          <View style={styles.choicesGrid}>
            {currentQuestion.choices.map((choice) => (
              <AnswerButton
                key={String(choice)}
                value={choice}
                state={getButtonState(choice)}
                disabled={isAnswerLocked}
                onPress={() => handleChoicePress(choice)}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    gap: 10,
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  questionBox: {
    marginVertical: 22,
    alignItems: 'center',
    width: '100%',
  },
  questionText: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
  },
  questionTextLong: {
    fontSize: 32,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  exitLink: {
    marginTop: 16,
    padding: 10,
  },
  exitLinkText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
});
