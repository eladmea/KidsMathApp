import { Modal, View, Text, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { playerColors, colors, shadow } from '../utils/theme';

export default function MemoryResultsModal({ visible, scores, onPlayAgain, onBackHome }) {
  const winner = scores[1] === scores[2] ? null : scores[1] > scores[2] ? 1 : 2;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, shadow]}>
          <Text style={styles.trophy}>{winner ? '🏆' : '🤝'}</Text>
          <Text style={styles.headline}>
            {winner
              ? `${playerColors[winner].icon} ${playerColors[winner].name} wins!`
              : "It's a tie!"}
          </Text>
          <Text style={styles.scoreLine}>
            {playerColors[1].icon} {playerColors[1].name}: {scores[1]} pairs
          </Text>
          <Text style={styles.scoreLine}>
            {playerColors[2].icon} {playerColors[2].name}: {scores[2]} pairs
          </Text>

          <View style={styles.buttons}>
            <BigButton label="Play Again" color={colors.primary} onPress={onPlayAgain} style={styles.button} />
            <BigButton label="Back to Home" color={colors.gray} onPress={onBackHome} style={styles.button} />
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
