import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { getSkill } from '../curriculum/skills';
import {
  BOX,
  COUNT_EMOJI,
  DIGIT_WORDS,
  MAX_RESTARTS_FOR_POINT,
  advance,
  digitCheckpoints,
  isStrokeDone,
  makeRound,
  startsAtDot,
} from '../utils/tracing';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const DEMO_STEP_MS = 30;
const CELEBRATE_MS = 2200;
const MAX_TRAIL = 500;
const DOT = 10;

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
  const scale = canvasWidth / BOX.width;
  const canvasHeight = BOX.height * scale;

  const [index, setIndex] = useState(0);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [trail, setTrail] = useState([]);
  const [demoAt, setDemoAt] = useState(null);
  const [message, setMessage] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [points, setPoints] = useState(0);

  const digit = digits[index];
  const strokes = useMemo(() => digitCheckpoints(digit), [digit]);
  const checkpoints = strokes[strokeIndex];

  // Refs mirror state for the gesture handlers.
  const live = useRef({});
  live.current = { checkpoints, strokeIndex, strokes, celebrating, demoAt, index };
  const originRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const draggingRef = useRef({ active: false, reached: 0, moved: 0 });
  const restartsRef = useRef(0);
  const pointsRef = useRef(0);
  const timersRef = useRef([]);

  const later = (fn, ms) => timersRef.current.push(setTimeout(fn, ms));
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Watch-me demo: a pencil runs along every stroke, then "your turn".
  function showMe() {
    const path = strokes.flat();
    let i = 0;
    setDemoAt(0);
    const timer = setInterval(() => {
      i += 1;
      if (i >= path.length) {
        clearInterval(timer);
        setDemoAt(null);
        return;
      }
      setDemoAt(i);
    }, DEMO_STEP_MS);
    timersRef.current.push(timer);
  }

  useEffect(() => {
    restartsRef.current = 0;
    setStrokeIndex(0);
    setReached(0);
    setTrail([]);
    setMessage(null);
    say(`Let's write ${DIGIT_WORDS[digit]}! Watch me, then start at the green dot.`);
    showMe();
  }, [digit]);

  function toBox(event) {
    const { pageX, pageY } = event.nativeEvent;
    return [(pageX - originRef.current.x) / scale, (pageY - originRef.current.y) / scale];
  }

  function measure() {
    canvasRef.current?.measureInWindow((x, y) => {
      originRef.current = { x, y };
    });
  }

  function finishStroke() {
    const { strokeIndex: current, strokes: all } = live.current;
    if (current + 1 < all.length) {
      setStrokeIndex(current + 1);
      setReached(0);
      setMessage('👍 Now the next line, from the green dot!');
      say('Now the next line!');
      return;
    }
    // The digit is done.
    const earned = restartsRef.current <= MAX_RESTARTS_FOR_POINT;
    if (earned) {
      pointsRef.current += 1;
      setPoints(pointsRef.current);
    }
    setCelebrating(true);
    playCorrect();
    const word = DIGIT_WORDS[digit];
    say(`${word.charAt(0).toUpperCase() + word.slice(1)}! You wrote ${word}!`);
    later(() => {
      setCelebrating(false);
      if (live.current.index + 1 >= digits.length) {
        finishSkillRound(navigation, skillId, pointsRef.current, digits.length, adventureStep);
      } else {
        setIndex(live.current.index + 1);
      }
    }, CELEBRATE_MS);
  }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        // Keep the gesture for the whole stroke (the page shouldn't take it).
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (live.current.celebrating) return;
          measure();
          const point = toBox(event);
          const cps = live.current.checkpoints;
          if (!startsAtDot(cps, point)) {
            draggingRef.current = { active: false, reached: 0, moved: 0 };
            setMessage('🟢 Start at the green dot!');
            say('Start at the green dot!');
            return;
          }
          setDemoAt(null);
          draggingRef.current = { active: true, reached: advance(cps, 0, point), moved: 0 };
          setReached(draggingRef.current.reached);
          setTrail([point]);
          setMessage(null);
        },
        onPanResponderMove: (event) => {
          const drag = draggingRef.current;
          if (!drag.active) return;
          const point = toBox(event);
          drag.reached = advance(live.current.checkpoints, drag.reached, point);
          drag.moved += 1;
          setReached(drag.reached);
          setTrail((current) => (current.length >= MAX_TRAIL ? current : [...current, point]));
        },
        onPanResponderTerminate: () => endDrag(),
        onPanResponderRelease: () => endDrag(),
      }),
    [scale, digit]
  );

  // Lifting the finger (or losing the touch) ends the stroke attempt.
  function endDrag() {
    const drag = draggingRef.current;
    if (!drag.active) return;
    drag.active = false;
    if (isStrokeDone(live.current.checkpoints, drag.reached)) {
      finishStroke();
      return;
    }
    restartsRef.current += 1;
    setReached(0);
    setTrail([]);
    setMessage('✏️ Almost! Follow the dots all the way to the end.');
    say('Almost! Follow the dots all the way.');
    playWrong();
  }

  const allPath = strokes.flat();
  const demoPoint = demoAt !== null ? allPath[demoAt] : null;
  const toPx = ([x, y]) => ({ left: x * scale - DOT / 2, top: y * scale - DOT / 2 });

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

        <View
          ref={canvasRef}
          onLayout={measure}
          style={[styles.canvas, shadow, { width: canvasWidth, height: canvasHeight }]}
          accessibilityLabel={`Tracing area for ${digit}`}
          {...responder.panHandlers}
        >
          {strokes.map((stroke, s) =>
            stroke.map((point, i) => {
              const isDone = s < strokeIndex || (s === strokeIndex && i < reached) || celebrating;
              const isCurrent = s === strokeIndex;
              if (!isDone && i % 2 === 1) return null;
              return (
                <View
                  key={`${s}-${i}`}
                  pointerEvents="none"
                  style={[
                    styles.guide,
                    toPx(point),
                    isCurrent && styles.guideCurrent,
                    isDone && styles.guideDone,
                  ]}
                />
              );
            })
          )}
          {trail.map((point, i) => (
            <View key={`t${i}`} pointerEvents="none" style={[styles.trail, toPx(point)]} />
          ))}
          {!celebrating && (
            <View pointerEvents="none" style={[styles.start, { left: checkpoints[0][0] * scale - 14, top: checkpoints[0][1] * scale - 14 }]}>
              <Text style={styles.startText}>{strokeIndex + 1}</Text>
            </View>
          )}
          {demoPoint && (
            <Text pointerEvents="none" style={[styles.pencil, { left: demoPoint[0] * scale - 4, top: demoPoint[1] * scale - 30 }]}>
              ✏️
            </Text>
          )}
        </View>

        {celebrating ? (
          <Text style={styles.celebrate}>
            {digit === 0 ? '0 — nothing at all! 🫙' : `${digit}! ${COUNT_EMOJI[digit].repeat(digit)}`}
          </Text>
        ) : (
          <Text style={styles.message}>{message || (demoPoint ? '👀 Watch me…' : '👆 Your turn! Start at the green dot.')}</Text>
        )}

        <Pressable onPress={showMe} style={[styles.showButton, shadow]} accessibilityLabel="Show me again">
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
  canvas: {
    backgroundColor: colors.white,
    borderRadius: 26,
    overflow: 'visible',
  },
  guide: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: '#DCD6EA',
  },
  guideCurrent: {
    backgroundColor: '#B9C8F5',
  },
  guideDone: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.6 }],
  },
  trail: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: 'rgba(255, 154, 61, 0.55)',
  },
  start: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },
  pencil: {
    position: 'absolute',
    fontSize: 28,
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
