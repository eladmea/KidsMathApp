import { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

const LINE_HEIGHT = 90;
const TICKS = 10;
const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Super tapping!'];

// What the child sees after tapping: praise when it's right (a "bullseye" for
// an exact hit), and a kind nudge showing where the number lives when it isn't.
export function numberLineFeedback(guess, answer, isCorrect) {
  if (isCorrect && guess === answer) return `Bullseye! ${answer} is right there! 🎯`;
  if (isCorrect) return `${PRAISE[Math.abs(answer) % PRAISE.length]} ${answer} lives right there! 🎉`;
  return `Good try! You tapped ${guess}. ${answer} lives here. 🎯`;
}

// An empty number line the child taps to place a number. After a guess it
// shows where they tapped (🪂) and where the number really lives (🎯).
export default function NumberLineInput({ min, max, guess, answer, isCorrect, disabled, onGuess }) {
  const [width, setWidth] = useState(0);
  const touchRef = useRef(null);
  const span = max - min;
  const toX = (value) => ((value - min) / span) * width;
  const hasGuessed = guess !== null && guess !== undefined;

  function place(x) {
    const clamped = Math.min(width, Math.max(0, x));
    onGuess(Math.round(min + (clamped / width) * span));
  }

  function handlePress(event) {
    if (disabled || !width) return;
    const { locationX, pageX } = event.nativeEvent;
    if (Number.isFinite(locationX)) {
      place(locationX);
    } else {
      // react-native-web press events have no locationX; measure instead.
      touchRef.current?.measureInWindow((left) => place(pageX - left));
    }
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        ref={touchRef}
        onPress={handlePress}
        disabled={disabled}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={styles.touchArea}
        accessibilityLabel={`Number line from ${min} to ${max}`}
      >
        <View pointerEvents="none" style={styles.line} />
        {width > 0 &&
          Array.from({ length: TICKS + 1 }, (_, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.tick, i % 5 === 0 && styles.tickMajor, { left: (i / TICKS) * width - 1.5 }]}
            />
          ))}
        {hasGuessed && width > 0 && (
          <>
            <Text pointerEvents="none" style={[styles.marker, { left: toX(guess) - 16, top: 0 }]}>
              🪂
            </Text>
            <View
              pointerEvents="none"
              style={[styles.answerFlag, { left: toX(answer) - 22, borderColor: isCorrect ? colors.greenDark : colors.redDark }]}
            >
              <Text style={[styles.answerText, { color: isCorrect ? colors.greenDark : colors.redDark }]}>{answer}</Text>
            </View>
          </>
        )}
      </Pressable>
      <View style={styles.labels}>
        <Text style={styles.endLabel}>{min}</Text>
        <Text style={styles.endLabel}>{max}</Text>
      </View>
      {hasGuessed && (
        <Text style={[styles.feedback, { color: isCorrect ? colors.greenDark : colors.redDark }]}>
          {numberLineFeedback(guess, answer, isCorrect)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 8,
  },
  touchArea: {
    height: LINE_HEIGHT,
    justifyContent: 'center',
  },
  line: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textDark,
  },
  tick: {
    position: 'absolute',
    top: LINE_HEIGHT / 2 - 9,
    width: 3,
    height: 18,
    backgroundColor: colors.textDark,
  },
  tickMajor: {
    top: LINE_HEIGHT / 2 - 14,
    height: 28,
  },
  marker: {
    position: 'absolute',
    fontSize: 30,
  },
  answerFlag: {
    position: 'absolute',
    bottom: -6,
    width: 44,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '900',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  endLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  feedback: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
  },
});
