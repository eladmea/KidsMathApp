import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { SHOTS, SHOT_FEEDBACK, judgeShot, makeZone, powerForHold, rollDistance } from '../utils/pushRoll';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const BALL_SIZE = 44;
const ROLL_MS = 900;
const NEXT_SHOT_MS = 1500;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// Hold to push: the longer you hold, the harder the push, the farther the ball rolls.
export default function PushRollScreen({ route, navigation }) {
  const { skillId } = route.params;
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const { playCorrect, playWrong } = useSoundEffects();
  const [trackWidth, setTrackWidth] = useState(0);
  const [zone, setZone] = useState(() => makeZone());
  const [shot, setShot] = useState(0);
  const [hits, setHits] = useState(0);
  const [power, setPower] = useState(0);
  const [phase, setPhase] = useState('aim');
  const [feedback, setFeedback] = useState(null);
  const ballX = useRef(new Animated.Value(0)).current;
  const holdStart = useRef(null);
  const meterTimer = useRef(null);
  const nextTimer = useRef(null);
  const hitsRef = useRef(0);

  const travel = Math.max(0, trackWidth - BALL_SIZE);

  useEffect(() => {
    say('Hold the button to push the ball. A harder push makes it roll farther. Stop it on the target!');
  }, [say]);

  useEffect(
    () => () => {
      clearInterval(meterTimer.current);
      clearTimeout(nextTimer.current);
    },
    []
  );

  function startPush() {
    if (phase !== 'aim') return;
    holdStart.current = Date.now();
    setPhase('charging');
    meterTimer.current = setInterval(() => setPower(powerForHold(Date.now() - holdStart.current)), 30);
  }

  function releasePush() {
    if (phase !== 'charging') return;
    clearInterval(meterTimer.current);
    const pushed = powerForHold(Date.now() - holdStart.current);
    setPower(pushed);
    setPhase('rolling');
    const position = rollDistance(pushed);
    Animated.timing(ballX, {
      toValue: position * travel,
      duration: ROLL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      const result = judgeShot(position, zone);
      if (result === 'hit') {
        hitsRef.current += 1;
        setHits(hitsRef.current);
        playCorrect();
      } else {
        playWrong();
      }
      setFeedback(result);
      say(SHOT_FEEDBACK[result].replace(' 🎯', ''));
      nextTimer.current = setTimeout(nextShot, NEXT_SHOT_MS);
    });
  }

  function nextShot() {
    const next = shot + 1;
    if (next >= SHOTS) {
      finishSkillRound(navigation, skillId, hitsRef.current, SHOTS, route.params.adventureStep);
      return;
    }
    ballX.setValue(0);
    setShot(next);
    setZone(makeZone());
    setPower(0);
    setFeedback(null);
    setPhase('aim');
  }

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="⚽ Push & Roll"
        left={`🎯 ${hits}`}
        right={`${shot + 1} / ${SHOTS}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.instructions}>Hold to push. Stop the ball on the 🎯!</Text>

        <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
          {trackWidth > 0 && (
            <View
              accessibilityLabel="Target zone"
              style={[
                styles.zone,
                { left: BALL_SIZE / 2 + zone.start * travel, width: zone.width * travel },
              ]}
            >
              <Text style={styles.zoneText}>🎯</Text>
            </View>
          )}
          <Animated.View
            accessibilityLabel="Ball"
            style={[styles.ball, { transform: [{ translateX: ballX }] }]}
          >
            <Text style={styles.ballText}>⚽</Text>
          </Animated.View>
        </View>

        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${Math.round(power * 100)}%` }]} />
        </View>
        <Text style={styles.meterLabel}>{power < 0.34 ? 'soft' : power < 0.67 ? 'medium' : 'HARD'} push</Text>

        <Text style={[styles.feedback, feedback && feedback !== 'hit' && styles.feedbackBad]}>
          {feedback ? SHOT_FEEDBACK[feedback] : ' '}
        </Text>

        <Pressable
          onPressIn={startPush}
          onPressOut={releasePush}
          accessibilityLabel="Hold to push"
          style={[styles.pushButton, shadow, phase === 'charging' && styles.pushButtonActive, (phase === 'rolling') && styles.pushButtonDisabled]}
        >
          <Text style={styles.pushText}>{phase === 'charging' ? '💪 Pushing…' : '👐 Hold to push'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F6FF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  instructions: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 24,
  },
  track: {
    width: '100%',
    maxWidth: 520,
    height: 90,
    backgroundColor: '#8BD17C',
    borderRadius: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 210, 63, 0.75)',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  zoneText: {
    fontSize: 18,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballText: {
    fontSize: 36,
  },
  meter: {
    width: '100%',
    maxWidth: 520,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    marginTop: 24,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: colors.orange,
  },
  meterLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray,
    marginTop: 6,
  },
  feedback: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.greenDark,
    marginTop: 18,
    minHeight: 30,
  },
  feedbackBad: {
    color: colors.redDark,
  },
  pushButton: {
    marginTop: 24,
    width: '100%',
    maxWidth: 360,
    paddingVertical: 26,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  pushButtonActive: {
    backgroundColor: colors.orange,
  },
  pushButtonDisabled: {
    opacity: 0.5,
  },
  pushText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
  },
});
