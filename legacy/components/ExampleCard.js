import { View, Text, StyleSheet } from 'react-native';
import AnswerButton from './AnswerButton';
import BigButton from './BigButton';
import NumberLineInput from './NumberLineInput';
import QuestionVisual from './QuestionVisual';
import { colors, shadow } from '../utils/theme';

// The text shown as "the answer" for any question type.
export function answerLabel(question) {
  if (question.type === 'build') return question.parts.join(' · ');
  if (question.type === 'order') return question.answer.map((id) => question.items.find((i) => i.id === id).emoji).join(' → ');
  return String(question.answer);
}

export function exampleSpeech(howTo, question) {
  return [howTo, question.speech, question.explain || `The answer is ${answerLabel(question).replace(/ · /g, ', ')}.`]
    .filter(Boolean)
    .join(' ');
}

function Solution({ question }) {
  switch (question.type) {
    case 'numberLine':
      return (
        <NumberLineInput
          min={question.min}
          max={question.max}
          guess={question.answer}
          answer={question.answer}
          isCorrect
          disabled
          onGuess={() => {}}
        />
      );
    case 'build':
      return (
        <View style={styles.tilesRow}>
          {question.parts.map((part, i) => (
            <View key={i} style={styles.tile}>
              <Text style={styles.tileText}>{part}</Text>
            </View>
          ))}
        </View>
      );
    case 'order':
      return (
        <View style={styles.orderRow}>
          {question.answer.map((id, i) => {
            const item = question.items.find((it) => it.id === id);
            return (
              <View key={id} style={styles.orderItem}>
                <Text style={styles.orderNumber}>{i + 1}</Text>
                <Text style={styles.orderEmoji}>{item.emoji}</Text>
                <Text style={styles.orderCaption}>{item.caption}</Text>
              </View>
            );
          })}
        </View>
      );
    default:
      return (
        <View style={styles.choices}>
          {question.choices.map((choice) => (
            <AnswerButton
              key={String(choice)}
              value={choice}
              variant={question.choiceStyle}
              state={choice === question.answer ? 'correct' : 'disabled'}
              disabled
              onPress={() => {}}
            />
          ))}
        </View>
      );
  }
}

// A worked example shown before a round: how to play, a question with the
// answer filled in, and why it's right. It isn't scored.
export default function ExampleCard({ question, howTo, onDone }) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.banner, shadow]}>
        <Text style={styles.bannerTitle}>👀 Let's try one together!</Text>
        {howTo ? <Text style={styles.howTo}>{howTo}</Text> : null}
      </View>

      <Text style={styles.prompt}>{question.prompt}</Text>
      <QuestionVisual visual={question.visual} result="correct" reveal={question.answer} showSteps />
      <View style={styles.solution}>
        <Solution question={question} />
      </View>

      <View style={styles.explainBox}>
        <Text style={styles.explainLabel}>💡 Why?</Text>
        <Text style={styles.explain}>{question.explain || `The answer is ${answerLabel(question)}.`}</Text>
      </View>

      <BigButton label="Got it! Let's play ▶" color={colors.green} onPress={onDone} style={styles.doneButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    backgroundColor: '#FFF4C2',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.yellow,
    padding: 14,
    marginTop: 12,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
  },
  howTo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 6,
  },
  prompt: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 16,
  },
  solution: {
    width: '100%',
    marginTop: 14,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  tile: {
    minWidth: 60,
    height: 64,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.green,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textDark,
  },
  orderRow: {
    width: '100%',
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.green,
    padding: 8,
    gap: 10,
  },
  orderNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '900',
    overflow: 'hidden',
  },
  orderEmoji: {
    fontSize: 28,
  },
  orderCaption: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  explainBox: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.purple,
    padding: 12,
    marginTop: 16,
  },
  explainLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.purple,
  },
  explain: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 4,
  },
  doneButton: {
    marginTop: 20,
    minWidth: 260,
  },
});
