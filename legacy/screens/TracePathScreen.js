import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import TraceCanvas from '../components/TraceCanvas';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { getSkill } from '../curriculum/skills';
import { getRecord, hasPassed } from '../utils/progress';
import {
  DIGIT_WORDS,
  MAX_RESTARTS_FOR_POINT,
  PREWRITING_PATHS,
  digitCheckpoints,
  numberPool,
  pathCheckpoints,
  pickDistinct,
} from '../utils/tracing';
import { ROADS_PER_ROUND, VEHICLES } from '../utils/writingGames';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const CELEBRATE_MS = 2000;
const BEE_PATHS_PER_ROUND = 5;

// Two tracing games on one screen:
// - Race Track: each digit is a road; drive a vehicle from 🚦 to 🏁.
// - Bee Paths: pre-writing strokes (down, across, rainbow, circle, cross);
//   fly the bee from its hive to the flower.
const MODES = {
  race: {
    background: '#DDF3D0',
    card: '#B7DFA2',
    look: (item) => ({
      dot: 24,
      guide: '#9C9C9C',
      guideCurrent: '#8A8A8A',
      done: '#5E5E5E',
      doneScale: 1.1,
      follower: item.vehicle,
    }),
    startMarker: '🚦',
    endMarker: '🏁',
    items: ({ bigNumbers }) =>
      pickDistinct(numberPool({ bigNumbers, allowZero: true }), ROADS_PER_ROUND).map((digit, i) => ({
        key: `d${digit}`,
        strokes: digitCheckpoints(digit),
        vehicle: VEHICLES[(digit + i) % VEHICLES.length],
        title: `Drive the ${digit}!`,
        intro: `Let's drive the number ${DIGIT_WORDS[digit]}! Start at the traffic light.`,
        praise: `Vroom! You drove a ${DIGIT_WORDS[digit]}!`,
        label: `Road for ${digit}`,
      })),
  },
  bee: {
    background: '#E3F3FF',
    card: '#FFFFFF',
    look: () => ({
      dot: 12,
      guide: '#F6DE8D',
      guideCurrent: '#F2CF5B',
      done: '#E8A800',
      doneScale: 1.5,
      follower: '🐝',
    }),
    startMarker: '🍯',
    endMarker: '🌸',
    items: () =>
      PREWRITING_PATHS.slice(0, BEE_PATHS_PER_ROUND).map((path) => ({
        key: path.id,
        strokes: pathCheckpoints(path),
        title: `Fly ${path.name}!`,
        intro: `Help the bee fly ${path.name} to the flower. Start at the honey pot.`,
        praise: 'Buzz buzz! The bee found the flower!',
        label: `Bee path ${path.id}`,
      })),
  },
};

export default function TracePathScreen({ route, navigation }) {
  const { skillId, adventureStep } = route.params;
  const skill = getSkill(skillId);
  const mode = MODES[skill.traceGame];
  const { progress } = useProfiles();
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const { width } = useWindowDimensions();
  const canvasWidth = Math.min(width - 64, 270);
  const items = useMemo(() => mode.items({ bigNumbers: hasPassed(getRecord(progress, 'math-write-1-5')) }), []);

  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [points, setPoints] = useState(0);
  const [demoToken, setDemoToken] = useState(0);
  const pointsRef = useRef(0);
  const timerRef = useRef(null);
  const item = items[index];

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setMessage(null);
    say(item.intro);
  }, [index]);

  function hint(kind) {
    if (kind === 'start') {
      setMessage(`Start at the ${mode.startMarker}!`);
      say(skill.traceGame === 'bee' ? 'Start at the honey pot!' : 'Start at the traffic light!');
    } else if (kind === 'next') {
      setMessage('👍 Now the next line!');
      say('Now the next line!');
    } else {
      setMessage('Almost! Keep going all the way to the end.');
      say('Almost! Keep going all the way to the end.');
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
    setMessage(item.praise);
    say(item.praise);
    timerRef.current = setTimeout(() => {
      setCelebrating(false);
      if (index + 1 >= items.length) finishSkillRound(navigation, skillId, pointsRef.current, items.length, adventureStep);
      else setIndex(index + 1);
    }, CELEBRATE_MS);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: mode.background }]}>
      <MiniGameHeader
        title={`${skill.emoji} ${skill.title}`}
        left={`⭐ ${points}`}
        right={`${index + 1} / ${items.length}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.center}>
        <Text style={styles.prompt}>{item.title}</Text>
        <View style={[styles.card, shadow, { backgroundColor: mode.card }]}>
          <TraceCanvas
            key={item.key}
            strokes={item.strokes}
            width={canvasWidth}
            look={mode.look(item)}
            startMarker={mode.startMarker}
            endMarker={mode.endMarker}
            demoToken={demoToken}
            finished={celebrating}
            onHint={hint}
            onComplete={complete}
            label={item.label}
          />
        </View>
        <Text style={[styles.message, celebrating && styles.praise]}>
          {message || `👆 Watch first, then start at the ${mode.startMarker}`}
        </Text>
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
  card: {
    borderRadius: 26,
    padding: 10,
  },
  message: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 16,
    textAlign: 'center',
    minHeight: 48,
  },
  praise: {
    color: colors.greenDark,
    fontSize: 22,
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
