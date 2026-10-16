import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import MiniGameEnd from '../components/MiniGameEnd';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { BREATHS, IN_MS, MIN_SCALE, OUT_MS, balloonScale, countdown, judgeBreath } from '../utils/balloonBreath';
import { colors, shadow } from '../utils/theme';

const FRAME_MS = 50;
const BALLOON_SIZE = 220;

// Balloon Breath: hold to breathe in and fill the balloon, let go to breathe
// out. Free to play: it's a calm-down, not a reward.
export default function BalloonBreathScreen({ route, navigation }) {
  const coolDown = Boolean(route.params?.coolDown);
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  // ready -> in (holding) -> out (breathing out) -> ready ... -> done
  const [phase, setPhase] = useState('ready');
  const [holdMs, setHoldMs] = useState(0);
  const [outMs, setOutMs] = useState(0);
  const [breaths, setBreaths] = useState(0);
  const [hint, setHint] = useState(null);
  const startRef = useRef(0);
  const releaseScaleRef = useRef(MIN_SCALE);

  useEffect(() => {
    say('Let\'s fill the balloon with slow breaths. Hold the button and breathe in. Let go and breathe out.');
  }, [say]);

  useEffect(() => {
    if (phase !== 'in') return undefined;
    const timer = setInterval(() => setHoldMs(Date.now() - startRef.current), FRAME_MS);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'out') return undefined;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setOutMs(elapsed);
      if (elapsed >= OUT_MS) {
        clearInterval(timer);
        setPhase(breaths >= BREATHS ? 'done' : 'ready');
      }
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [phase, breaths]);

  useEffect(() => {
    if (phase === 'done') say('Well done. You took five slow breaths. You can do this any time you need to feel calm.');
  }, [phase, say]);

  function breatheIn() {
    if (phase !== 'ready') return;
    startRef.current = Date.now();
    setHoldMs(0);
    setHint(null);
    setPhase('in');
    say('Breathe in…');
  }

  function breatheOut() {
    if (phase !== 'in') return;
    const held = Date.now() - startRef.current;
    releaseScaleRef.current = balloonScale(held);
    setOutMs(0);
    if (judgeBreath(held) === 'good') {
      setBreaths((count) => count + 1);
      setHint('🌬️ Now breathe out slowly…');
      say('And breathe out slowly…');
    } else {
      setHint('🐢 Try a slower breath in. Hold until the balloon is big!');
      say('Try a slower breath in.');
    }
    setPhase('out');
  }

  let scale = MIN_SCALE;
  if (phase === 'in') scale = balloonScale(holdMs);
  if (phase === 'out') {
    const shrink = Math.min(1, outMs / OUT_MS);
    scale = releaseScaleRef.current - (releaseScaleRef.current - MIN_SCALE) * shrink;
  }

  const label = {
    ready: 'Hold to breathe in',
    in: holdMs >= IN_MS ? 'Full! Let go…' : `Breathe in… ${countdown(holdMs)}`,
    out: `Breathe out… ${countdown(outMs, OUT_MS)}`,
    done: 'All done',
  }[phase];

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🎈 Balloon Breath"
        right={`🌬️ ${breaths} / ${BREATHS}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.center}>
        <View style={styles.sky}>
          <Text style={[styles.balloon, { transform: [{ scale }] }]} accessibilityLabel="Balloon">
            🎈
          </Text>
        </View>
        <Text style={styles.hint}>{hint || 'Hold the button while you breathe in. Let go to breathe out.'}</Text>
        <Pressable
          onPressIn={breatheIn}
          onPressOut={breatheOut}
          disabled={phase === 'out' || phase === 'done'}
          accessibilityLabel={label}
          style={[styles.breathButton, shadow, phase === 'in' && styles.breathButtonHeld, phase === 'out' && styles.breathButtonWait]}
        >
          <Text style={styles.breathText}>{label}</Text>
        </Pressable>
      </View>

      {phase === 'done' && (
        <MiniGameEnd
          emoji="😌"
          headline="So calm!"
          detail="You took 5 slow breaths. Slow breathing helps when you feel upset, worried or wiggly."
          buttonLabel={coolDown ? 'Done ✓' : 'Back to learning ▶'}
          onDone={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sky: {
    width: BALLOON_SIZE + 40,
    height: BALLOON_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balloon: {
    fontSize: BALLOON_SIZE,
    lineHeight: BALLOON_SIZE * 1.15,
  },
  hint: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginVertical: 20,
    maxWidth: 420,
  },
  breathButton: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 26,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  breathButtonHeld: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  breathButtonWait: {
    backgroundColor: colors.gray,
  },
  breathText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
  },
});
