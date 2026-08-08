import { View, Text, StyleSheet } from 'react-native';
import { playerColors, colors, shadow } from '../utils/theme';

function PlayerCard({ player, score, chips, isActive }) {
  const info = playerColors[player];
  return (
    <View
      style={[
        styles.card,
        { borderColor: info.main, backgroundColor: isActive ? info.light : colors.white },
        isActive && shadow,
      ]}
    >
      <Text style={styles.name}>
        {info.icon} {info.name}
      </Text>
      <Text style={[styles.stat, { color: info.dark }]}>⭐ Pairs: {score}</Text>
      <Text style={[styles.stat, { color: info.dark }]}>🪙 Chips: {chips}</Text>
    </View>
  );
}

export default function PlayerStatsRow({ scores, chips, activePlayer }) {
  return (
    <View style={styles.row}>
      <PlayerCard player={1} score={scores[1]} chips={chips[1]} isActive={activePlayer === 1} />
      <PlayerCard player={2} score={scores[2]} chips={chips[2]} isActive={activePlayer === 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 4,
  },
  stat: {
    fontSize: 14,
    fontWeight: '700',
  },
});
