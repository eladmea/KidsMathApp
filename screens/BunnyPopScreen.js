import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import BigButton from '../components/BigButton';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { GAP_MS, HOLES, POPS, SHOW_MS, TARGET, isCorrectResponse, isTarget, makePops } from '../utils/bunnyPop';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const ANIMAL_NAMES = { '🐸': 'frog', '🐷': 'pig', '🐱': 'cat', '🐶': 'dog', '🐵': 'monkey', '🦊': 'fox', '🐼': 'panda', '🐔': 'chicken' };

// Bunny Pop: animals pop out of holes; boop only the bunny.
export default function BunnyPopScreen({ route, navigation }) {
  const { skillId, adventureStep } = route.params;
  // Pre-readers need to hear the rule.
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const pops = useMemo(() => makePops(), []);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [isUp, setIsUp] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(0);
  const tappedRef = useRef(false);
  const correctRef = useRef(0);
  const popScale = useRef(new Animated.Value(0)).current;

  const pop = pops[index];

  useEffect(() => {
    say(`Boop the bunny! Tap the bunny when it pops up. Leave the other animals alone.`);
  }, [say]);

  // Each animal pops up, stays a moment, then hides and is scored.
  useEffect(() => {
    if (!started || !pop) return undefined;
    tappedRef.current = false;
    setFeedback(null);
    setIsUp(true);
    popScale.setValue(0.2);
    Animated.spring(popScale, { toValue: 1, friction: 5, useNativeDriver: false }).start();
    const hide = setTimeout(() => {
      setIsUp(false);
      const ok = isCorrectResponse(pop, tappedRef.current);
      if (ok) {
        correctRef.current += 1;
        setCorrect(correctRef.current);
      }
      if (!tappedRef.current) setFeedback(isTarget(pop) ? 'missed' : 'left-alone');
    }, SHOW_MS);
    const next = setTimeout(() => {
      if (index + 1 >= pops.length) finishSkillRound(navigation, skillId, correctRef.current, POPS, adventureStep);
      else setIndex(index + 1);
    }, SHOW_MS + GAP_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(next);
    };
  }, [started, index]);

  function tapHole(hole) {
    if (!isUp || !pop || hole !== pop.hole || tappedRef.current) return;
    tappedRef.current = true;
    if (isTarget(pop)) {
      setFeedback('boop');
      playCorrect();
    } else {
      setFeedback('oops');
      playWrong();
      say(`That's the ${ANIMAL_NAMES[pop.animal] || 'other animal'}. Only boop the bunny!`);
    }
  }

  const feedbackText = {
    boop: '⭐ Boop! You got the bunny!',
    'left-alone': '👍 Good, you left it alone!',
    oops: `Oops! Only boop the bunny ${TARGET}`,
    missed: `The bunny hid! Catch the next one ${TARGET}`,
  }[feedback];

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🐰 Bunny Pop"
        left={`⭐ ${correct}`}
        right={`${Math.min(index + 1, POPS)} / ${POPS}`}
        onBack={() => navigation.goBack()}
      />

      {!started ? (
        <View style={styles.center}>
          <View style={[styles.rulesCard, shadow]}>
            <Text style={styles.rulesTitle}>Boop the bunny!</Text>
            <Text style={styles.rulesBunny}>{TARGET}</Text>
            <Text style={styles.rulesDetail}>Tap the bunny when it pops up.</Text>
            <Text style={styles.rulesOthers}>🐸 🐷 🐱 🐶 ✋</Text>
            <Text style={styles.rulesDetail}>Leave the other animals alone!</Text>
            <BigButton label="Go! ▶" color={colors.green} onPress={() => setStarted(true)} style={styles.goButton} />
          </View>
        </View>
      ) : (
        <View style={styles.center}>
          <View style={styles.findChip}>
            <Text style={styles.findText}>Find {TARGET}</Text>
          </View>
          <View style={styles.field}>
            {Array.from({ length: HOLES }, (_, hole) => {
              const showing = isUp && pop && pop.hole === hole;
              const wasOops = showing && feedback === 'oops';
              return (
                <Pressable
                  key={hole}
                  onPress={() => tapHole(hole)}
                  style={styles.cell}
                  accessibilityLabel={showing ? `Hole with ${pop.animal === TARGET ? 'bunny' : ANIMAL_NAMES[pop.animal]}` : `Empty hole ${hole + 1}`}
                >
                  <View style={styles.animalSlot}>
                    {showing && (
                      <Animated.Text style={[styles.animal, { transform: [{ scale: popScale }] }]}>
                        {feedback === 'boop' ? '⭐' : pop.animal}
                      </Animated.Text>
                    )}
                    {wasOops && <Text style={styles.oopsMark}>✋</Text>}
                  </View>
                  <View style={styles.hole} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.feedback, (feedback === 'oops' || feedback === 'missed') && styles.feedbackSoft]}>
            {feedbackText || ' '}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E4F5D8',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  rulesCard: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  rulesTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textDark,
  },
  rulesBunny: {
    fontSize: 90,
    marginVertical: 4,
  },
  rulesOthers: {
    fontSize: 34,
    marginTop: 14,
  },
  rulesDetail: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  goButton: {
    marginTop: 20,
    minWidth: 200,
  },
  findChip: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  findText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.greenDark,
  },
  field: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    rowGap: 10,
  },
  cell: {
    width: '48%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  animalSlot: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -18,
    zIndex: 1,
  },
  animal: {
    fontSize: 78,
  },
  oopsMark: {
    position: 'absolute',
    right: -24,
    top: 0,
    fontSize: 32,
  },
  hole: {
    width: 130,
    height: 44,
    borderRadius: 65,
    backgroundColor: '#7A5230',
    borderBottomWidth: 6,
    borderBottomColor: '#5B3B20',
  },
  feedback: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.greenDark,
    marginTop: 16,
    textAlign: 'center',
    minHeight: 30,
  },
  feedbackSoft: {
    color: colors.orange,
  },
});
