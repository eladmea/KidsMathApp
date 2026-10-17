import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import TraceCanvas from '../components/TraceCanvas';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { getSkill } from '../curriculum/skills';
import { COUNT_EMOJI, DIGIT_WORDS, MAX_RESTARTS_FOR_POINT, digitCheckpoints, makeRound } from '../utils/tracing';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const CELEBRATE_MS = 2200;

// Number Tracing: trace each digit with a finger, starting at the green dot.
export default function TraceDigitsScreen({ route, navigation }) {
  const { skillId, adventureStep } = route.params;
  const skill = getSkill(skillId);
  // Pre-readers need to hear every instruction.
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const digits = useMemo(() => makeRound(skill.traceLevel), [skill.traceLevel]);
  const { width } = useWindowDimensions();
  const canvasWidth = Math.min(width - 48, 280);

  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [points, setPoints] = useState(0);
  const [demoToken, setDemoToken] = useState(0);
  const pointsRef = useRef(0);
  const timerRef = useRef(null);

  const digit = digits[index];
  const strokes = useMemo(() => digitCheckpoints(digit), [digit]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setMessage(null);
    say(`Let's write ${DIGIT_WORDS[digit]}! Watch me, then start at the green dot.`);
  }, [digit]);

  function hint(kind) {
    if (kind === 'start') {
      setMessage('🟢 Start at the green dot!');
      say('Start at the green dot!');
    } else if (kind === 'next') {
      setMessage('👍 Now the next line, from the green dot!');
      say('Now the next line!');
    } else {
      setMessage('✏️ Almost! Follow the dots all the way to the end.');
      say('Almost! Follow the dots all the way.');
      playWrong();
    }
  }

  function complete({ restarts }) {
    if (restarts <= MAX_RESTARTS_FOR_POINT) {
      pointsRef.current += 1;
      setPoints(pointsRef.current);
    }
    setCelebrating(true);
    playCorrect();
    const word = DIGIT_WORDS[digit];
    say(`${word.charAt(0).toUpperCase() + word.slice(1)}! You wrote ${word}!`);
    timerRef.current = setTimeout(() => {
      setCelebrating(false);
      if (index + 1 >= digits.length) {
        finishSkillRound(navigation, skillId, pointsRef.current, digits.length, adventureStep);
      } else {
        setIndex(index + 1);
      }
    }, CELEBRATE_MS);
  }

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title={`${skill.emoji} ${skill.title}`}
        left={`⭐ ${points}`}
        right={`${index + 1} / ${digits.length}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.center}>
        <Text style={styles.prompt}>
          Write <Text style={styles.promptDigit}>{digit}</Text>
        </Text>

        <View style={[styles.card, shadow]}>
          <TraceCanvas
            key={index}
            strokes={strokes}
            width={canvasWidth}
            demoToken={demoToken}
            finished={celebrating}
            onHint={hint}
            onComplete={complete}
            label={`Tracing area for ${digit}`}
          />
        </View>

        {celebrating ? (
          <Text style={styles.celebrate}>
            {digit === 0 ? '0 — nothing at all! 🫙' : `${digit}! ${COUNT_EMOJI[digit].repeat(digit)}`}
          </Text>
        ) : (
          <Text style={styles.message}>{message || '👆 Watch the pencil, then start at the green dot.'}</Text>
        )}

        <Pressable onPress={() => setDemoToken((t) => t + 1)} style={[styles.showButton, shadow]} accessibilityLabel="Show me again">
          <Text style={styles.showText}>👀 Show me again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF6FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  prompt: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
    marginBottom: 10,
  },
  promptDigit: {
    color: colors.primary,
    fontSize: 34,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 26,
  },
  celebrate: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.greenDark,
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 16,
    textAlign: 'center',
    minHeight: 48,
  },
  showButton: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  showText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
});
