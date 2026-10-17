import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import TraceCanvas from '../components/TraceCanvas';
import DragTray from '../components/DragTray';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { getRecord, hasPassed } from '../utils/progress';
import { DIGIT_WORDS, digitCheckpoints, numberPool, pickDistinct } from '../utils/tracing';
import { CAKES_PER_ROUND, CUSTOMERS, MAX_ON_TRAY_TARGET, checkCount, roundPoint } from '../utils/writingGames';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const PARTY_MS = 2800;

const ICING_LOOK = {
  dot: 14,
  guide: '#F7D2E2',
  guideCurrent: '#F3B5CF',
  done: '#FF4F93',
  doneScale: 1.5,
  trail: 'rgba(255, 79, 147, 0.55)',
  trailSize: 16,
  demo: '🧁',
};

const CANDLE = '🕯️';
const CANDLE_WIDTH = 34;

// Birthday Cake: an animal friend turns N. Write N in icing, put N candles
// on the cake, then blow them out one by one (counting down).
export default function BirthdayCakeScreen({ route, navigation }) {
  const { skillId, adventureStep } = route.params;
  const { progress } = useProfiles();
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const { width } = useWindowDimensions();
  const cakeWidth = Math.min(width - 48, 300);
  const cakeHeight = cakeWidth * 0.95;
  const bigNumbers = hasPassed(getRecord(progress, 'math-write-1-5'));
  const ages = useMemo(() => pickDistinct(numberPool({ bigNumbers }), CAKES_PER_ROUND), []);
  const friends = useMemo(() => pickDistinct(CUSTOMERS, CAKES_PER_ROUND), []);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState('icing');
  const [candles, setCandles] = useState([]);
  const [message, setMessage] = useState(null);
  const [points, setPoints] = useState(0);
  const pointsRef = useRef(0);
  const restartsRef = useRef(0);
  const firstCheckRef = useRef(null);
  const cakeRef = useRef(null);
  const timerRef = useRef(null);

  const age = ages[index];
  const friend = friends[index];
  const strokes = useMemo(() => digitCheckpoints(age), [age]);
  const lit = candles.filter((c) => c.lit).length;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setStep('icing');
    setCandles([]);
    setMessage(null);
    restartsRef.current = 0;
    firstCheckRef.current = null;
    say(`It's ${friend.name}'s birthday! ${friend.name} is ${DIGIT_WORDS[age]} today. Write ${DIGIT_WORDS[age]} on the cake with icing.`);
  }, [index]);

  function icingHint(kind) {
    if (kind === 'start') say('Start at the green dot!');
    else if (kind === 'next') say('Now the next line!');
    else {
      restartsRef.current += 1;
      say('Almost! Follow the dots all the way.');
      playWrong();
    }
  }

  function icingDone() {
    playCorrect();
    setStep('candles');
    say(`Beautiful! Now put ${DIGIT_WORDS[age]} ${age === 1 ? 'candle' : 'candles'} on the cake. Drag them from the tray.`);
  }

  // Candles stand in a row along the top of the cake, wherever they're dropped.
  function drop(x) {
    if (candles.length >= MAX_ON_TRAY_TARGET) return;
    const next = [...candles, { id: Date.now() + Math.random(), x: Math.max(CANDLE_WIDTH / 2, Math.min(cakeWidth - CANDLE_WIDTH / 2, x)), lit: false }];
    setCandles(next);
    setMessage(null);
    say(String(next.length));
  }

  function removeCandle() {
    if (!candles.length) return;
    const next = candles.slice(0, -1);
    setCandles(next);
    say(String(next.length));
  }

  function check() {
    const result = checkCount(candles.length, age);
    if (firstCheckRef.current === null) firstCheckRef.current = result;
    if (result === 'right') {
      playCorrect();
      setMessage(null);
      setCandles(candles.map((c) => ({ ...c, lit: true })));
      setStep('blow');
      say(`${age} candles! Now blow them out. Tap each candle!`);
    } else if (result === 'more') {
      playWrong();
      setMessage(`${friend.name} is ${age}. We have ${candles.length}. Add more!`);
      say(`${friend.name} is ${age}. We have ${candles.length} candles. Add ${age - candles.length} more!`);
    } else {
      playWrong();
      setMessage(`Too many! ${friend.name} is ${age}. Take one off.`);
      say(`Too many! ${friend.name} is ${age}. Take ${candles.length - age} off.`);
    }
  }

  function blow(id) {
    const candle = candles.find((c) => c.id === id);
    if (!candle || !candle.lit) return;
    const next = candles.map((c) => (c.id === id ? { ...c, lit: false } : c));
    setCandles(next);
    const left = next.filter((c) => c.lit).length;
    if (left > 0) {
      say(String(left));
      return;
    }
    const point = roundPoint({ restarts: restartsRef.current, firstCheck: firstCheckRef.current });
    pointsRef.current += point;
    setPoints(pointsRef.current);
    setStep('party');
    playCorrect();
    say(`Zero! Happy birthday, ${friend.name}!`);
    timerRef.current = setTimeout(() => {
      if (index + 1 >= CAKES_PER_ROUND) finishSkillRound(navigation, skillId, pointsRef.current, CAKES_PER_ROUND, adventureStep);
      else setIndex(index + 1);
    }, PARTY_MS);
  }

  const instruction = {
    icing: `${friend.name} is ${age}! Write ${age} in icing`,
    candles: `Put ${age} ${CANDLE} on the cake`,
    blow: `Blow out the candles! ${lit} left`,
    party: `🎉 Happy birthday, ${friend.name}!`,
  }[step];

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🎂 Birthday Cake"
        left={`⭐ ${points}`}
        right={`${index + 1} / ${CAKES_PER_ROUND}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.center}>
        <View style={styles.friendRow}>
          <Text style={styles.friend}>{friend.emoji}</Text>
          <Text style={styles.hat}>🥳</Text>
          <View style={[styles.bubble, shadow]}>
            <Text style={styles.bubbleText}>{instruction}</Text>
          </View>
        </View>

        <View style={[styles.candleRow, { width: cakeWidth }]}>
          {candles.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => blow(c.id)}
              disabled={step !== 'blow'}
              style={[styles.candle, { left: c.x - CANDLE_WIDTH / 2 }]}
              accessibilityLabel={c.lit ? 'Lit candle' : 'Candle'}
            >
              <Text style={styles.flame}>{c.lit ? '🔥' : step === 'blow' || step === 'party' ? '💨' : ' '}</Text>
              <Text style={styles.candleText}>{CANDLE}</Text>
            </Pressable>
          ))}
        </View>

        <View ref={cakeRef} collapsable={false} accessibilityLabel="Cake" style={[styles.cake, { width: cakeWidth, height: cakeHeight }]}>
          <View style={styles.icingTop} />
          <View style={styles.layerLine} />
          {step === 'icing' ? (
            <View style={styles.canvasHolder}>
              <TraceCanvas
                key={index}
                strokes={strokes}
                width={cakeWidth * 0.42}
                look={ICING_LOOK}
                onHint={icingHint}
                onComplete={icingDone}
                label={`Icing tracing for ${age}`}
              />
            </View>
          ) : (
            <Text style={[styles.icingNumber, { fontSize: cakeHeight * 0.55 }]}>{age}</Text>
          )}
        </View>

        {step === 'candles' && (
          <>
            <View style={styles.countRow}>
              <Text style={styles.count}>
                {candles.length} {CANDLE}
              </Text>
              {candles.length > 0 && (
                <Pressable onPress={removeCandle} style={[styles.takeOff, shadow]} accessibilityLabel="Take one off">
                  <Text style={styles.takeOffText}>➖ Take one off</Text>
                </Pressable>
              )}
            </View>
            <DragTray emoji={CANDLE} label="candles" targetRef={cakeRef} onDrop={drop} />
            <BigButton label="Done ✓" color={colors.green} onPress={check} style={styles.done} />
          </>
        )}
        {message && <Text style={styles.message}>{message}</Text>}
        {step === 'party' && <Text style={styles.party}>🎈🎉🎁🎉🎈</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    marginVertical: 8,
  },
  friend: {
    fontSize: 50,
  },
  hat: {
    fontSize: 26,
    marginLeft: -14,
    marginTop: -30,
    marginRight: 6,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
  },
  bubbleText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
  },
  candleRow: {
    height: 74,
  },
  candle: {
    position: 'absolute',
    bottom: -6,
    width: CANDLE_WIDTH,
    alignItems: 'center',
  },
  flame: {
    fontSize: 22,
    height: 28,
  },
  candleText: {
    fontSize: 32,
  },
  cake: {
    userSelect: 'none',
    backgroundColor: '#C98B5A',
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#A8693B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icingTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: '#FFF3F8',
  },
  layerLine: {
    position: 'absolute',
    top: '62%',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#FFD1E3',
  },
  canvasHolder: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    padding: 6,
  },
  icingNumber: {
    fontWeight: '900',
    color: '#FF4F93',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  takeOff: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  takeOffText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.redDark,
  },
  count: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginVertical: 8,
  },
  done: {
    marginTop: 12,
    minWidth: 200,
    paddingVertical: 14,
  },
  message: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.redDark,
    textAlign: 'center',
    marginTop: 8,
  },
  party: {
    fontSize: 40,
    marginTop: 12,
  },
});
