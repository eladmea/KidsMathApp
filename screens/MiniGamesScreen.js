import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { roundsUntilNextTicket } from '../utils/funTickets';
import { MINI_GAMES } from '../curriculum/games';
import { colors, shadow } from '../utils/theme';

// Fun Break hub: each mini-game costs one ticket, earned by learning rounds.
export default function MiniGamesScreen({ navigation }) {
  const { activeProfile, spendTicket } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const tickets = activeProfile?.funTickets || 0;
  const roundsToGo = activeProfile ? roundsUntilNextTicket(activeProfile) : 0;

  async function start(game) {
    if (await spendTicket()) {
      navigation.navigate(game.route);
    } else {
      say(`Play ${roundsToGo} more learning ${roundsToGo === 1 ? 'round' : 'rounds'} to earn a Fun Break!`, { force: true });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>🎈 Fun Break</Text>
        <Text style={styles.tickets}>🎟️ × {tickets}</Text>
        <Text style={styles.note}>
          {tickets > 0
            ? 'Pick a game! Each one uses a ticket.'
            : `Play ${roundsToGo} more learning ${roundsToGo === 1 ? 'round' : 'rounds'} to earn a ticket.`}
        </Text>

        {MINI_GAMES.map((game) => (
          <Pressable
            key={game.id}
            onPress={() => start(game)}
            style={({ pressed }) => [
              styles.card,
              shadow,
              tickets === 0 && styles.cardLocked,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.cardEmoji}>{tickets > 0 ? game.emoji : '🔒'}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{game.title}</Text>
              <Text style={styles.cardNote}>{game.description}</Text>
            </View>
          </Pressable>
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
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.orange,
  },
  tickets: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 6,
  },
  note: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginVertical: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.orange,
    padding: 16,
    marginBottom: 12,
  },
  cardLocked: {
    borderColor: colors.gray,
    backgroundColor: '#F4F1EC',
  },
  cardEmoji: {
    fontSize: 40,
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
  },
  cardNote: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray,
  },
});
