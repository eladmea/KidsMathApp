import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkillCard from '../components/SkillCard';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { profileBand } from '../utils/profiles';
import { getSubject } from '../curriculum/subjects';
import { AGE_BANDS } from '../curriculum/ageBands';
import { getSkill, isPlayable, skillRoute, skillsFor } from '../curriculum/skills';
import { getRecord, isUnlocked, missingPrereqs, recommendNextSkill, skillStars } from '../utils/progress';
import { colors, shadow } from '../utils/theme';

export default function SkillListScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const subject = getSubject(subjectId);
  const { activeProfile, progress } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  // Children start in their own band but can peek at easier or harder ones.
  const [bandId, setBandId] = useState(() => (activeProfile ? profileBand(activeProfile).id : AGE_BANDS[0].id));

  const skills = skillsFor({ subject: subjectId, band: bandId });
  const recommended = recommendNextSkill(skills, progress);

  function statusOf(skill) {
    if (!isPlayable(skill)) return 'soon';
    return isUnlocked(skill, progress) ? 'ready' : 'locked';
  }

  function handlePress(skill) {
    const status = statusOf(skill);
    if (status === 'ready') {
      navigation.navigate(...skillRoute(skill));
    } else if (status === 'locked') {
      const needed = missingPrereqs(skill, progress).map((id) => getSkill(id).title);
      say(`First, play ${needed.join(' and ')}.`, { force: true });
    } else {
      say(`${skill.title} is coming soon!`, { force: true });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: subject.light }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, shadow]} accessibilityLabel="Back">
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerEmoji}>{subject.emoji}</Text>
        <Text style={[styles.title, { color: subject.color }]}>{subject.label}</Text>
      </View>

      <View style={styles.bandRow}>
        {AGE_BANDS.map((band) => {
          const isSelected = band.id === bandId;
          return (
            <Pressable
              key={band.id}
              onPress={() => setBandId(band.id)}
              style={[
                styles.bandPill,
                { borderColor: band.color, backgroundColor: isSelected ? band.color : colors.white },
              ]}
            >
              <Text style={[styles.bandText, { color: isSelected ? colors.white : band.color }]}>
                {band.emoji} {band.minAge}-{band.maxAge}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {skills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            status={statusOf(skill)}
            stars={skillStars(getRecord(progress, skill.id))}
            color={subject.color}
            isRecommended={recommended?.id === skill.id}
            onPress={() => handlePress(skill)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
  },
  headerEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    flexShrink: 1,
  },
  bandRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  bandPill: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bandText: {
    fontSize: 15,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
});
