import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import BigButton from '../components/BigButton';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { OWL, SWITCH_AT, TRIALS, isCorrectResponse, isTarget, makeTrials } from '../utils/freezeZoo';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const SHOW_MS = 1500;
const GAP_MS = 450;

const RULES = {
  1: { title: 'Tap the animals!', detail: `But when you see the owl ${OWL}, FREEZE!`, speech: 'Tap the animals! But when you see the owl, freeze!' },
  2: { title: 'Switch!', detail: `Now tap ONLY the owl ${OWL}. Freeze for everyone else!`, speech: 'Switch! Now tap only the owl. Freeze for everyone else!' },
};

export default function FreezeZooScreen({ route, navigation }) {
  const { skillId } = route.params;
  // The rules must be heard, so they are always spoken.
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const trials = useMemo(() => makeTrials(), []);
  const [index, setIndex] = useState(0);
  const [showingRules, setShowingRules] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [correct, setCorrect] = useState(0);
  const tappedRef = useRef(false);
  const correctRef = useRef(0);

  const trial = trials[index];

  useEffect(() => {
    if (showingRules) say(RULES[showingRules].speech);
  }, [showingRules, say]);

  // Show each animal briefly, then score the response.
  useEffect(() => {
    if (showingRules || !trial) return undefined;
    tappedRef.current = false;
    setFeedback(null);
    setIsVisible(true);
    const hide = setTimeout(() => {
      setIsVisible(false);
      const ok = isCorrectResponse(trial, tappedRef.current);
      if (ok) {
        correctRef.current += 1;
        setCorrect(correctRef.current);
      }
      if (!tappedRef.current) setFeedback(ok ? 'freeze-ok' : 'missed');
    }, SHOW_MS);
    const next = setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= trials.length) {
        finishSkillRound(navigation, skillId, correctRef.current, TRIALS, route.params.adventureStep);
      } else {
        if (nextIndex === SWITCH_AT) setShowingRules(2);
        setIndex(nextIndex);
      }
    }, SHOW_MS + GAP_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(next);
    };
  }, [index, showingRules, trial, trials.length, navigation, skillId]);

  function handleTap() {
    if (!isVisible || tappedRef.current) return;
    tappedRef.current = true;
    if (isTarget(trial)) {
      setFeedback('hit');
      playCorrect();
    } else {
      setFeedback('oops');
      playWrong();
    }
  }

  const feedbackText = {
    hit: '✓ Nice tap!',
    'freeze-ok': '🧊 Great freezing!',
    oops: '✋ Freeze for that one!',
    missed: '👆 That one needed a tap!',
  }[feedback];

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🦒 Freeze Zoo"
        left={`✓ ${correct}`}
        right={`${Math.min(index + 1, TRIALS)} / ${TRIALS}`}
        onBack={() => navigation.goBack()}
      />

      {showingRules ? (
        <View style={styles.center}>
          <View style={[styles.rulesCard, shadow]}>
            <Text style={styles.rulesTitle}>{RULES[showingRules].title}</Text>
            <Text style={styles.rulesOwl}>{OWL}</Text>
            <Text style={styles.rulesDetail}>{RULES[showingRules].detail}</Text>
            <BigButton label="Go! ▶" color={colors.green} onPress={() => setShowingRules(0)} style={styles.goButton} />
          </View>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.ruleReminder}>
            {trial?.phase === 1 ? `Tap animals · freeze for ${OWL}` : `Tap only ${OWL}`}
          </Text>
          <Pressable
            onPress={handleTap}
            accessibilityLabel={isVisible && trial ? `Animal ${trial.animal}` : 'Waiting'}
            style={[styles.stage, shadow]}
          >
            <Text style={styles.animal}>{isVisible && trial ? trial.animal : ''}</Text>
          </Pressable>
          <Text style={[styles.feedback, (feedback === 'oops' || feedback === 'missed') && styles.feedbackBad]}>
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
    backgroundColor: '#EAF7E4',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  rulesOwl: {
    fontSize: 80,
    marginVertical: 8,
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
  ruleReminder: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.greenDark,
    marginBottom: 16,
  },
  stage: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animal: {
    fontSize: 140,
  },
  feedback: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.greenDark,
    marginTop: 20,
  },
  feedbackBad: {
    color: colors.redDark,
  },
});
