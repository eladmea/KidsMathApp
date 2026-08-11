import { Modal, View, Text, StyleSheet } from 'react-native';
import AnswerButton from './AnswerButton';
import BigButton from './BigButton';
import { playerColors, colors, shadow } from '../utils/theme';

export default function ChipGuessModal({
  visible,
  mismatch,
  activePlayer,
  selectedGuess,
  onSelectGuess,
  onAcknowledgeCantAfford,
}) {
  if (!mismatch) return null;

  const player = playerColors[activePlayer];
  const opponent = playerColors[mismatch.opponent];
  const canAttempt = mismatch.chipsAvailable >= mismatch.cost;
  const hasAnswered = selectedGuess !== null;
  const isCorrect = selectedGuess === mismatch.cost;

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

              <View style={styles.choices}>
                {mismatch.choices.map((choice) => (
                  <AnswerButton
                    key={choice}
                    value={choice}
                    state={getChoiceState(choice)}
                    disabled={hasAnswered}
                    onPress={() => onSelectGuess(choice)}
                  />
                ))}
              </View>

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
              <BigButton label="Okay" color={player.main} onPress={onAcknowledgeCantAfford} style={styles.okButton} />
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
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  feedback: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  okButton: {
    width: '60%',
  },
});
