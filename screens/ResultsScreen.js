import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StarRating from '../components/StarRating';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { calculateStars } from '../utils/scoring';
import { getSkill, skillRoute } from '../curriculum/skills';
import { colors } from '../utils/theme';

const MESSAGES = {
  3: 'Amazing job! 🎉',
  2: 'Great work! 👏',
  1: 'Nice try! Keep practicing! 💪',
};

const SPOKEN = {
  3: 'Amazing job!',
  2: 'Great work!',
  1: 'Nice try! Keep practicing!',
};

export default function ResultsScreen({ route, navigation }) {
  const { skillIds, mode, score, total, tallies } = route.params;
  const stars = calculateStars(score, total);
  const { activeProfile, recordSession, isTimeUp } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const [celebration, setCelebration] = useState({
    newlyMastered: [],
    newlyUnlocked: [],
    earnedTicket: false,
    earnedStickers: [],
  });
  const hasRecorded = useRef(false);

  useEffect(() => {
    if (hasRecorded.current) return;
    hasRecorded.current = true;
    recordSession(tallies).then((result) => {
      setCelebration(result);
      const mastered = result.newlyMastered.map((id) => getSkill(id).title);
      say(
        [
          SPOKEN[stars],
          mastered.length ? `You mastered ${mastered.join(' and ')}!` : '',
          result.earnedStickers.length ? 'You got a new sticker!' : '',
          result.earnedTicket ? 'You earned a Fun Break!' : '',
        ].join(' ')
      );
    });
  }, [recordSession, tallies, say, stars]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{MESSAGES[stars]}</Text>
        <StarRating stars={stars} />
        <Text style={styles.scoreText}>
          You got {score} out of {total}
        </Text>

        {celebration.newlyMastered.map((id) => (
          <Text key={id} style={styles.mastered}>
            🏅 Mastered: {getSkill(id).title}
          </Text>
        ))}
        {celebration.newlyUnlocked.map((id) => (
          <Text key={id} style={styles.unlocked}>
            🔓 New: {getSkill(id).emoji} {getSkill(id).title}
          </Text>
        ))}

        {celebration.earnedStickers.length > 0 && (
          <Text style={styles.sticker}>
            🌟 New sticker{celebration.earnedStickers.length > 1 ? 's' : ''}:{' '}
            {celebration.earnedStickers.map((sticker) => sticker.emoji).join(' ')}
          </Text>
        )}
        {celebration.earnedTicket && <Text style={styles.ticket}>🎟️ You earned a Fun Break!</Text>}

        <View style={styles.buttons}>
          {isTimeUp && (
            <BigButton
              label="👋 Time for a break"
              color={colors.purple}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'TimeUp' }] })}
              style={styles.button}
            />
          )}
          {celebration.earnedTicket && !isTimeUp && (
            <BigButton
              label="🎈 Fun Break"
              color={colors.orange}
              onPress={() => navigation.replace('MiniGames')}
              style={styles.button}
            />
          )}
          {!isTimeUp && (
            <BigButton
              label="Play Again"
              color={colors.green}
              onPress={() =>
                mode === 'review'
                  ? navigation.replace('Quiz', { skillIds, mode })
                  : navigation.replace(...skillRoute(getSkill(skillIds[0])))
              }
              style={styles.button}
            />
          )}
          {!isTimeUp && (
            <BigButton label="🗺️ Map" color={colors.primary} onPress={() => navigation.popToTop()} style={styles.button} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 12,
    marginBottom: 12,
  },
  mastered: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.greenDark,
    marginTop: 4,
  },
  unlocked: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.purple,
    marginTop: 4,
  },
  sticker: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.purple,
    marginTop: 8,
  },
  ticket: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.orange,
    marginTop: 8,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 28,
  },
  button: {
    width: '80%',
    maxWidth: 360,
  },
});
