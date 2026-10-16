import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { STEP_INFO, currentStep, estimatedMinutes, isFinished, stepRoute, stepTitle, subjectsForDay } from '../utils/adventure';
import { stickersEarnedOn } from '../utils/stickers';
import { getSubject } from '../curriculum/subjects';
import { getSkill } from '../curriculum/skills';
import { colors, shadow } from '../utils/theme';

// Breaks (mini-game, cool-down) count as done once the child comes back.
const BREAK_KINDS = ['minigame', 'cooldown'];

// Today's Adventure: the guided daily session, one step after another.
export default function AdventureScreen({ navigation }) {
  const { activeProfile, adventure, startAdventure, completeAdventureStep, isTimeUp } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const [earned, setEarned] = useState([]);
  const pendingBreakRef = useRef(null);

  useEffect(() => {
    if (activeProfile && !adventure) startAdventure();
  }, [activeProfile, adventure, startAdventure]);

  const step = currentStep(adventure);
  const finished = isFinished(adventure);

  useFocusEffect(
    useCallback(() => {
      if (pendingBreakRef.current) {
        const stepId = pendingBreakRef.current;
        pendingBreakRef.current = null;
        completeAdventureStep(stepId).then((result) => {
          if (result.earned.length) setEarned(result.earned);
        });
        return;
      }
      if (isTimeUp && !finished) navigation.reset({ index: 0, routes: [{ name: 'TimeUp' }] });
    }, [completeAdventureStep, isTimeUp, finished, navigation])
  );

  const stepKey = step?.id;
  useEffect(() => {
    if (finished) say(`Adventure complete! Great job, ${activeProfile?.name}. See you tomorrow!`);
    else if (step) {
      const skill = step.kind === 'new' || step.kind === 'second' ? getSkill(step.skillIds[0]) : null;
      say(`Next: ${STEP_INFO[step.kind].title}${skill ? `. ${skill.title}` : ''}.`);
    }
    // Speak when the step changes, not on every render.
  }, [stepKey, finished]);

  if (!activeProfile) return null;
  if (!adventure) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  function go() {
    if (!step) return;
    if (BREAK_KINDS.includes(step.kind)) pendingBreakRef.current = step.id;
    navigation.navigate(...stepRoute(step));
  }

  const subjects = subjectsForDay(adventure.day);
  const todayStickers = stickersEarnedOn(activeProfile.stickers, adventure.day);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Map</Text>
        </Pressable>
        <Text style={styles.title}>🗺️ Today's Adventure</Text>
        <Text style={styles.subtitle}>
          About {estimatedMinutes(adventure.steps)} min · {getSubject(subjects.main).emoji} {getSubject(subjects.main).label} +{' '}
          {getSubject(subjects.second).emoji} {getSubject(subjects.second).label}
        </Text>

        <View style={styles.path}>
          {adventure.steps.map((s, i) => {
            const isDone = adventure.done.includes(s.id);
            const isCurrent = step && s.id === step.id;
            return (
              <View key={s.id} style={styles.stepRow}>
                <View style={styles.rail}>
                  <View style={[styles.dot, isDone && styles.dotDone, isCurrent && styles.dotCurrent]}>
                    <Text style={styles.dotText}>{isDone ? '✓' : i + 1}</Text>
                  </View>
                  {i < adventure.steps.length - 1 && <View style={[styles.line, isDone && styles.lineDone]} />}
                </View>
                <View style={[styles.stepCard, isCurrent && [styles.stepCurrent, shadow], !isDone && !isCurrent && styles.stepLater]}>
                  <Text style={styles.stepKind}>{STEP_INFO[s.kind].title}</Text>
                  <Text style={styles.stepTitle}>{stepTitle(s)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {finished ? (
          <View style={[styles.finale, shadow]}>
            <Text style={styles.finaleEmoji}>🎉</Text>
            <Text style={styles.finaleTitle}>Adventure complete!</Text>
            {earned.length > 0 && <Text style={styles.finaleSticker}>New sticker: {earned.map((e) => e.emoji).join(' ')}</Text>}
            {todayStickers.length > 0 && (
              <Text style={styles.finaleStickers}>Today's stickers: {todayStickers.map((e) => e.emoji).join(' ')}</Text>
            )}
            <Text style={styles.finaleNote}>See you tomorrow for a new adventure! 👋</Text>
            <BigButton label="🗺️ Map" color={colors.primary} onPress={() => navigation.goBack()} style={styles.goButton} />
          </View>
        ) : (
          step && (
            <BigButton
              label={`▶ ${adventure.done.length ? 'Next' : 'Start'}: ${STEP_INFO[step.kind].title}`}
              color={colors.green}
              onPress={go}
              style={styles.goButton}
            />
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF4FF',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  backLink: {
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gray,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  path: {
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
  },
  rail: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D9D3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.greenDark,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
  },
  dotText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
  },
  line: {
    width: 4,
    flex: 1,
    minHeight: 18,
    backgroundColor: '#D9D3E8',
  },
  lineDone: {
    backgroundColor: colors.greenDark,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  stepCurrent: {
    borderColor: colors.primary,
  },
  stepLater: {
    opacity: 0.6,
  },
  stepKind: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.gray,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 2,
  },
  goButton: {
    marginTop: 8,
    width: '100%',
  },
  finale: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  finaleEmoji: {
    fontSize: 60,
  },
  finaleTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
  },
  finaleSticker: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.purple,
    marginTop: 8,
  },
  finaleStickers: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 6,
    textAlign: 'center',
  },
  finaleNote: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 10,
    textAlign: 'center',
  },
});
