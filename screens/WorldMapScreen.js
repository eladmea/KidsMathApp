import { useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { profileBand } from '../utils/profiles';
import { SUBJECTS } from '../curriculum/subjects';
import { LEARNING_GAMES } from '../curriculum/games';
import { skillsFor, isPlayable } from '../curriculum/skills';
import { getDueReviews, getRecord, isMastered, recommendNextSkill, toDayKey } from '../utils/progress';
import { colors, shadow } from '../utils/theme';

export default function WorldMapScreen({ navigation }) {
  const { activeProfile, progress, updateProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const name = activeProfile?.name;

  useEffect(() => {
    if (!activeProfile) {
      navigation.reset({ index: 0, routes: [{ name: 'Profiles' }] });
    }
  }, [activeProfile, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (name) say(`Hi ${name}! Pick an island to play.`);
    }, [name, say])
  );

  if (!activeProfile) return null;

  const band = profileBand(activeProfile);
  const bandSkills = skillsFor({ band: band.id });
  // One "next" suggestion per subject, so reading and math both move forward.
  const nextSkills = SUBJECTS.map((subject) => ({
    subject,
    skill: recommendNextSkill(bandSkills.filter((skill) => skill.subject === subject.id), progress),
  })).filter(({ skill }) => skill);
  const dueReviews = getDueReviews(progress, toDayKey());

  function startSkill(skill) {
    navigation.navigate('Quiz', { skillIds: [skill.id], mode: 'practice' });
  }

  // Turning narration on re-runs the focus effect below, which greets aloud.
  function toggleNarration() {
    updateProfile(activeProfile.id, { narration: !activeProfile.narration });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.avatar}>{activeProfile.avatar}</Text>
        <View style={styles.headerText}>
          <Text style={styles.greeting} numberOfLines={1}>
            Hi, {activeProfile.name}!
          </Text>
          <Text style={[styles.bandLabel, { color: band.color }]}>
            {band.emoji} {band.label}
          </Text>
        </View>
        <Pressable onPress={toggleNarration} style={[styles.iconButton, shadow]} accessibilityLabel="Toggle read aloud">
          <Text style={styles.iconText}>{activeProfile.narration ? '🔊' : '🔇'}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Profiles' }] })}
          style={[styles.iconButton, shadow]}
          accessibilityLabel="Switch player"
        >
          <Text style={styles.iconText}>👥</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {nextSkills.map(({ subject, skill }, index) => (
          <BigButton
            key={skill.id}
            label={`▶  ${skill.emoji} ${skill.title}`}
            color={subject.color}
            onPress={() => startSkill(skill)}
            style={[styles.wideButton, index > 0 && styles.reviewButton]}
          />
        ))}

        {dueReviews.length > 0 && (
          <BigButton
            label="⭐ Daily Review"
            color={colors.yellow}
            textColor={colors.textDark}
            onPress={() => navigation.navigate('Quiz', { skillIds: dueReviews, mode: 'review' })}
            style={[styles.wideButton, styles.reviewButton]}
          />
        )}

        <Text style={styles.sectionLabel}>🗺️ Islands</Text>
        <View style={styles.islandGrid}>
          {SUBJECTS.map((subject) => {
            const skills = bandSkills.filter((skill) => skill.subject === subject.id);
            const playable = skills.filter(isPlayable);
            const mastered = playable.filter((skill) => isMastered(getRecord(progress, skill.id))).length;
            const isOpen = playable.length > 0;
            return (
              <Pressable
                key={subject.id}
                onPress={() => {
                  say(subject.label);
                  navigation.navigate('SkillList', { subjectId: subject.id });
                }}
                style={({ pressed }) => [
                  styles.island,
                  shadow,
                  { backgroundColor: subject.light, borderColor: subject.color, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.islandEmoji}>{subject.emoji}</Text>
                <Text style={[styles.islandTitle, { color: subject.color }]}>{subject.label}</Text>
                <Text style={styles.islandNote}>
                  {isOpen ? `⭐ ${mastered} / ${playable.length}` : '🚧 Coming soon'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>🎲 Games</Text>
        {LEARNING_GAMES.map((game) => (
          <Pressable
            key={game.id}
            onPress={() => navigation.navigate('GameSetup', { gameId: game.id })}
            style={({ pressed }) => [styles.gameCard, shadow, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.gameEmoji}>{game.emoji}</Text>
            <View style={styles.gameBody}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameNote}>{game.description}</Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={() => navigation.navigate('MiniGames')}
          style={({ pressed }) => [styles.gameCard, styles.funCard, shadow, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.gameEmoji}>🎈</Text>
          <View style={styles.gameBody}>
            <Text style={styles.gameTitle}>Fun Break</Text>
            <Text style={styles.gameNote}>🎟️ × {activeProfile.funTickets || 0} · earn tickets by playing rounds</Text>
          </View>
        </Pressable>
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
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  avatar: {
    fontSize: 46,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
  },
  bandLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  wideButton: {
    width: '100%',
    maxWidth: 480,
  },
  reviewButton: {
    marginTop: 12,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 24,
    marginBottom: 12,
    maxWidth: 480,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.purple,
    padding: 14,
    marginBottom: 12,
  },
  funCard: {
    borderColor: colors.orange,
    backgroundColor: '#FFF1DC',
  },
  gameEmoji: {
    fontSize: 38,
    marginRight: 14,
  },
  gameBody: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.textDark,
  },
  gameNote: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray,
  },
  islandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 480,
  },
  island: {
    width: '47%',
    minWidth: 140,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 3,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  islandEmoji: {
    fontSize: 44,
  },
  islandTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  islandNote: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 4,
  },
});
