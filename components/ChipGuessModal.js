import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { playerColors, colors, shadow } from '../utils/theme';

const NUMBER_STATE_STYLES = {
  default: { backgroundColor: colors.white, borderColor: colors.primary, textColor: colors.textDark },
  correct: { backgroundColor: colors.green, borderColor: colors.greenDark, textColor: colors.white },
  wrong: { backgroundColor: colors.red, borderColor: colors.redDark, textColor: colors.white },
  disabled: { backgroundColor: colors.white, borderColor: colors.gray, textColor: colors.gray },
};

function NumberChip({ value, state, disabled, onPress }) {
  const style = NUMBER_STATE_STYLES[state] || NUMBER_STATE_STYLES.default;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.numberChip,
        {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.numberChipText, { color: style.textColor }]}>{value}</Text>
    </Pressable>
  );
}

export default function ChipGuessModal({
  visible,
  mismatch,
  activePlayer,
  selectedGuess,
  onSelectGuess,
  onSkip,
}) {
  if (!mismatch) return null;

  const player = playerColors[activePlayer];
  const opponent = playerColors[mismatch.opponent];
  const canAttempt = mismatch.chipsAvailable >= mismatch.cost;
  const hasAnswered = selectedGuess !== null;
  const isCorrect = selectedGuess === mismatch.cost;
  const numberOptions = Array.from({ length: mismatch.chipsAvailable }, (_, i) => i + 1);

  function getChoiceState(choice) {
    if (!hasAnswered) return 'default';
    if (choice === mismatch.cost) return 'correct';
    if (choice === selectedGuess) return 'wrong';
    return 'disabled';
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, { borderColor: player.main }, shadow]}>
          <Text style={styles.headline}>
            {mismatch.lowValue} and {mismatch.highValue} don't match!
          </Text>

          {canAttempt ? (
            <>
              <Text style={styles.detail}>
                🤔 {player.icon} {player.name}, how many chips does it take to turn {mismatch.lowValue}{' '}
                into {mismatch.highValue}?
              </Text>

              {!hasAnswered && (
                <BigButton label="⏭ Skip" color={colors.gray} onPress={onSkip} style={styles.skipButton} />
              )}

              <Text style={styles.orLabel}>{hasAnswered ? 'Your guess:' : 'or pick a number of chips'}</Text>

              <ScrollView style={styles.numberScroll} contentContainerStyle={styles.numberGrid}>
                {numberOptions.map((choice) => (
                  <NumberChip
                    key={choice}
                    value={choice}
                    state={getChoiceState(choice)}
                    disabled={hasAnswered}
                    onPress={() => onSelectGuess(choice)}
                  />
                ))}
              </ScrollView>

              {hasAnswered && (
                <Text style={[styles.feedback, { color: isCorrect ? colors.greenDark : colors.redDark }]}>
                  {isCorrect
                    ? `Correct! 🎉 ${mismatch.cost} chips go to ${opponent.icon} ${opponent.name}.`
                    : `Not quite! You lose ${mismatch.cost} chips and the pair goes back into the game.`}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.detail}>
                You'd need at least 🪙 {mismatch.cost} chips, but only have {mismatch.chipsAvailable}.
              </Text>
              <BigButton label="⏭ Skip" color={player.main} onPress={onSkip} style={styles.okButton} />
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
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  detail: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 14,
  },
  skipButton: {
    width: '100%',
    paddingVertical: 14,
    marginBottom: 14,
  },
  orLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray,
    marginBottom: 10,
  },
  numberScroll: {
    maxHeight: 220,
    width: '100%',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 4,
  },
  numberChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberChipText: {
    fontSize: 20,
    fontWeight: '800',
  },
  feedback: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  okButton: {
    width: '60%',
  },
});
