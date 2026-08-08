import { Modal, View, Text, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { playerColors, colors, shadow } from '../utils/theme';

export default function ChipOfferModal({ visible, mismatch, activePlayer, onUseChips, onDecline }) {
  if (!mismatch) return null;

  const player = playerColors[activePlayer];
  const opponent = playerColors[mismatch.opponent];
  const canAfford = mismatch.chipsAvailable >= mismatch.cost;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, { borderColor: player.main }, shadow]}>
          <Text style={styles.headline}>
            {mismatch.lowValue} and {mismatch.highValue} don't match!
          </Text>

          {canAfford ? (
            <>
              <Text style={styles.detail}>
                Use 🪙 {mismatch.cost} bonus chips to turn the {mismatch.lowValue} into a{' '}
                {mismatch.highValue}?
              </Text>
              <Text style={styles.note}>
                {opponent.icon} {opponent.name} will get those {mismatch.cost} chips to spend later!
              </Text>
              <View style={styles.buttonRow}>
                <BigButton
                  label={`Use ${mismatch.cost} 🪙`}
                  color={player.main}
                  onPress={onUseChips}
                  style={styles.button}
                />
                <BigButton
                  label="No thanks"
                  color={colors.gray}
                  onPress={onDecline}
                  style={styles.button}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.detail}>
                You'd need 🪙 {mismatch.cost} chips, but you only have {mismatch.chipsAvailable}.
              </Text>
              <BigButton label="Okay" color={player.main} onPress={onDecline} style={styles.button} />
            </>
          )}
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
    borderWidth: 4,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  detail: {
    fontSize: 17,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
