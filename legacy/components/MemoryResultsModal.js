import { Modal, View, Text, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { colors, shadow } from '../utils/theme';

export default function MemoryResultsModal({ visible, players, scores, note, onPlayAgain, onBackHome }) {
  const winner = scores[1] === scores[2] ? null : scores[1] > scores[2] ? 1 : 2;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, shadow]}>
          <Text style={styles.trophy}>{winner ? '🏆' : '🤝'}</Text>
          <Text style={styles.headline}>
            {winner
              ? `${players[winner].icon} ${players[winner].name} wins!`
              : "It's a tie!"}
          </Text>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <Text style={styles.scoreLine}>
            {players[1].icon} {players[1].name}: {scores[1]} pairs
          </Text>
          <Text style={styles.scoreLine}>
            {players[2].icon} {players[2].name}: {scores[2]} pairs
          </Text>

          <View style={styles.buttons}>
            <BigButton label="Play Again" color={colors.primary} onPress={onPlayAgain} style={styles.button} />
            <BigButton label="🗺️ Map" color={colors.gray} onPress={onBackHome} style={styles.button} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 46, 82, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  trophy: {
    fontSize: 56,
    marginBottom: 8,
  },
  headline: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  note: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreLine: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  buttons: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  button: {
    width: '85%',
  },
});
