import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { loadGarden, saveGarden } from '../utils/storage';
import { toDayKey } from '../utils/progress';
import { FLOWER_STAGE, NEEDS, SILLY_CHOICES, STAGES, applyCare, canGrowToday, needForDay, newGarden } from '../utils/garden';
import { colors, shadow } from '../utils/theme';

// Garden Days: one good deed per day helps the plant grow a stage.
export default function GardenScreen({ navigation }) {
  const { activeProfile, earnStickers } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const { playCorrect, playWrong } = useSoundEffects();
  const [garden, setGarden] = useState(null);
  const [message, setMessage] = useState(null);
  const today = toDayKey();
  const seed = activeProfile?.id || '';
  const need = needForDay(today, seed);

  // Today's options: the three real needs plus one silly one, rotated daily so
  // the right answer isn't always in the same spot.
  const options = useMemo(() => {
    const dayNumber = Number(today.slice(-2));
    const silly = Object.keys(SILLY_CHOICES)[dayNumber % 2];
    const all = [...Object.keys(NEEDS), silly];
    const shift = dayNumber % all.length;
    return [...all.slice(shift), ...all.slice(0, shift)];
  }, [today]);

  const profileId = activeProfile?.id;
  useEffect(() => {
    if (!profileId) return;
    loadGarden(profileId).then((stored) => setGarden(stored || newGarden()));
  }, [profileId]);

  useEffect(() => {
    if (!garden) return;
    if (garden.stage === FLOWER_STAGE) say('Your flower bloomed! Plant a new seed when you are ready.');
    else if (canGrowToday(garden, today)) say(`Look at your plant. ${NEEDS[need].clue} What does it need?`);
    else say('Your plant is resting. Come back tomorrow!');
    // Only greet once the garden has loaded, not after every change.
  }, [garden === null]);

  async function care(choice) {
    const { garden: next, result } = applyCare(garden, choice, today, seed);
    setGarden(next);
    await saveGarden(activeProfile.id, next);
    const choiceInfo = NEEDS[choice] || SILLY_CHOICES[choice];
    let text;
    if (result === 'grew') {
      text = `Yes! ${choiceInfo.reason} It grew into a ${STAGES[next.stage].name}! Come back tomorrow to help it grow more. 🌙`;
      playCorrect();
    } else if (result === 'bloomed') {
      text = `🌻 It bloomed! You have grown ${next.flowers} flower${next.flowers === 1 ? '' : 's'}!`;
      playCorrect();
      const earned = await earnStickers([{ kind: 'bloomed', ref: next.flowers }]);
      if (earned.length) text += ` You earned a sticker: ${earned[0].emoji}`;
    } else if (result === 'wrong') {
      text = `Hmm, not that. ${choiceInfo.reason} Read the clue again!`;
      playWrong();
    } else if (result === 'replanted') {
      text = 'You planted a new seed! 🌰';
    } else {
      text = 'Your plant is resting today. Come back tomorrow!';
    }
    setMessage(text);
    say(text.replace(/[🌙🌻🌰]/gu, ''));
  }

  if (!garden) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.greenDark} />
      </SafeAreaView>
    );
  }

  const isFlower = garden.stage === FLOWER_STAGE;
  const canGrow = canGrowToday(garden, today) && !isFlower;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.flowers}>🌻 × {garden.flowers}</Text>
        </View>
        <Text style={styles.title}>🌻 Garden Days</Text>

        <View style={styles.stages}>
          {STAGES.map((stage, i) => (
            <Text key={stage.name} style={[styles.stageDot, i <= garden.stage ? styles.stageDone : styles.stageTodo]}>
              {stage.emoji}
            </Text>
          ))}
        </View>

        <View style={[styles.pot, shadow]}>
          <Text style={[styles.plant, garden.droopy && styles.droopy]} accessibilityLabel={`Plant: ${STAGES[garden.stage].name}`}>
            {STAGES[garden.stage].emoji}
          </Text>
          <Text style={styles.stageName}>
            {STAGES[garden.stage].name}
            {garden.droopy ? ' (droopy)' : ''}
          </Text>
        </View>

        {canGrow && (
          <>
            <View style={styles.clueBox}>
              <Text style={styles.clueLabel}>🔍 Clue</Text>
              <Text style={styles.clue}>{NEEDS[need].clue}</Text>
            </View>
            <View style={styles.options}>
              {options.map((id) => {
                const info = NEEDS[id] || SILLY_CHOICES[id];
                return (
                  <Pressable key={id} onPress={() => care(id)} style={[styles.option, shadow]} accessibilityLabel={info.label}>
                    <Text style={styles.optionEmoji}>{info.emoji}</Text>
                    <Text style={styles.optionLabel}>{info.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {!canGrow && !isFlower && !message && (
          <Text style={styles.resting}>😴 Your plant is resting. Come back tomorrow to help it grow!</Text>
        )}

        {message && <Text style={styles.message}>{message}</Text>}

        {isFlower && (
          <BigButton label="🌰 Plant a new seed" color={colors.greenDark} onPress={() => care('replant')} style={styles.replant} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFFAEA',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backLink: {
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  flowers: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.greenDark,
    marginTop: 4,
  },
  stages: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  stageDot: {
    fontSize: 26,
  },
  stageDone: {
    opacity: 1,
  },
  stageTodo: {
    opacity: 0.25,
  },
  pot: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plant: {
    fontSize: 110,
  },
  droopy: {
    opacity: 0.55,
    transform: [{ rotate: '12deg' }],
  },
  stageName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray,
  },
  clueBox: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    width: '100%',
    borderWidth: 2,
    borderColor: colors.green,
  },
  clueLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.greenDark,
  },
  clue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 4,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    rowGap: 12,
  },
  option: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 14,
  },
  optionEmoji: {
    fontSize: 40,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 4,
  },
  resting: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 20,
  },
  replant: {
    marginTop: 20,
    minWidth: 240,
  },
});
