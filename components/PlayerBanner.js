import { View, Text, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/theme';

export default function PlayerBanner({ players, activePlayer, isBuddy = false }) {
  const player = players[activePlayer];

  return (
    <View style={[styles.banner, { backgroundColor: player.main }, shadow]}>
      <Text style={styles.icon}>{player.icon}</Text>
      <Text style={styles.text}>{isBuddy ? `${player.name} is playing…` : `${player.name}'s turn!`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 12,
    marginBottom: 12,
    width: '100%',
  },
  icon: {
    fontSize: 28,
    marginRight: 8,
  },
  text: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
  },
});
