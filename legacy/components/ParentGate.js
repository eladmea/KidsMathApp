import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { checkGate, makeGateQuestion } from '../utils/parentGate';
import { colors, shadow } from '../utils/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
const MAX_DIGITS = 3;

// "Grown-ups only": type the answer to a times fact to continue.
export default function ParentGate({ title = 'Grown-ups only', onPass, onCancel }) {
  const [question, setQuestion] = useState(() => makeGateQuestion());
  const [input, setInput] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  function press(key) {
    setIsWrong(false);
    if (key === '⌫') {
      setInput((value) => value.slice(0, -1));
    } else if (key === '✓') {
      if (checkGate(question, input)) {
        onPass();
      } else {
        setIsWrong(true);
        setInput('');
        setQuestion(makeGateQuestion());
      }
    } else if (input.length < MAX_DIGITS) {
      setInput((value) => value + key);
    }
  }

  return (
    <View style={[styles.box, shadow]}>
      <Text style={styles.title}>🔒 {title}</Text>
      <Text style={styles.note}>Please ask a grown-up to answer:</Text>
      <Text style={styles.question}>{question.text} = ?</Text>
      <View style={[styles.display, isWrong && styles.displayWrong]}>
        <Text style={styles.displayText} accessibilityLabel="Answer">
          {input || ' '}
        </Text>
      </View>
      {isWrong && <Text style={styles.wrong}>Not quite. Here's a new one.</Text>}
      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => press(key)}
            accessibilityLabel={key === '⌫' ? 'Delete' : key === '✓' ? 'Check' : key}
            style={({ pressed }) => [styles.key, key === '✓' && styles.keyOk, pressed && styles.keyPressed]}
          >
            <Text style={[styles.keyText, key === '✓' && styles.keyOkText]}>{key}</Text>
          </Pressable>
        ))}
      </View>
      {onCancel && <BigButton label="Cancel" color={colors.gray} onPress={onCancel} style={styles.cancel} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
  },
  note: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray,
    marginTop: 4,
  },
  question: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 10,
  },
  display: {
    width: 140,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.primary,
    paddingVertical: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  displayWrong: {
    borderColor: colors.red,
  },
  displayText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
  },
  wrong: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.redDark,
    marginTop: 6,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    marginTop: 14,
    rowGap: 10,
  },
  key: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F1EEF8',
    alignItems: 'center',
  },
  keyOk: {
    backgroundColor: colors.green,
  },
  keyPressed: {
    opacity: 0.7,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
  },
  keyOkText: {
    color: colors.white,
  },
  cancel: {
    marginTop: 16,
    paddingVertical: 12,
    width: '100%',
  },
});
