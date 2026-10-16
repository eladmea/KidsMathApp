import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import CardFace from './CardFace';
import { colors, shadow } from '../utils/theme';

const NUMBER_STATE_STYLES = {
  default: { backgroundColor: colors.white, borderColor: colors.primary, textColor: colors.textDark },
  correct: { backgroundColor: colors.green, borderColor: colors.greenDark, textColor: colors.white },
  wrong: { backgroundColor: colors.red, borderColor: colors.redDark, textColor: colors.white },
  disabled: { backgroundColor: colors.white, borderColor: colors.gray, textColor: colors.gray },
};

const MINI_CARD = 74;

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

function MiniCard({ face }) {
  return (
    <View style={[styles.miniCard, shadow]}>
      <CardFace face={face} size={MINI_CARD} />
    </View>
  );
}

// Pick a number of chips from 1..chipsAvailable.
function NumberPicker({ mismatch, selectedGuess, disabled, onSelect }) {
  const hasAnswered = selectedGuess !== null;
  function getChoiceState(choice) {
    if (!hasAnswered) return 'default';
    if (choice === mismatch.cost) return 'correct';
    if (choice === selectedGuess) return 'wrong';
    return 'disabled';
  }
  return (
    <ScrollView style={styles.numberScroll} contentContainerStyle={styles.numberGrid}>
      {Array.from({ length: mismatch.chipsAvailable }, (_, i) => i + 1).map((choice) => (
        <NumberChip
          key={choice}
          value={choice}
          state={getChoiceState(choice)}
          disabled={disabled || hasAnswered}
          onPress={() => onSelect(choice)}
        />
      ))}
    </ScrollView>
  );
}

// For pre-readers: tap chips one at a time into the "pay" pile, then confirm.
function ChipCounter({ mismatch, selectedGuess, disabled, onSelect, onCount }) {
  const [count, setCount] = useState(0);
  const hasAnswered = selectedGuess !== null;
  const shown = hasAnswered ? selectedGuess : count;

  function addChip() {
    if (disabled || hasAnswered || count >= mismatch.chipsAvailable) return;
    setCount(count + 1);
    onCount?.(count + 1);
  }

  return (
    <View style={styles.counter}>
      <Text style={styles.counterLabel}>Tap a chip for each step:</Text>
      <View style={styles.chipRow}>
        {Array.from({ length: mismatch.chipsAvailable }, (_, i) => (
          <Pressable
            key={i}
            onPress={addChip}
            disabled={disabled || hasAnswered}
            style={[styles.coin, i < shown && styles.coinPicked]}
            accessibilityLabel={`Chip ${i + 1}`}
          >
            <Text style={styles.coinText}>🪙</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.countText}>{shown}</Text>
      {!hasAnswered && !disabled && (
        <View style={styles.counterButtons}>
          <BigButton
            label="↩"
            color={colors.gray}
            onPress={() => setCount(Math.max(0, count - 1))}
            style={styles.smallButton}
          />
          <BigButton
            label={`Pay ${count} ✔`}
            color={count > 0 ? colors.green : colors.gray}
            onPress={() => count > 0 && onSelect(count)}
            style={styles.payButton}
          />
        </View>
      )}
    </View>
  );
}

export default function ChipGuessModal({
  visible,
  mismatch,
  players,
  activePlayer,
  variant,
  isBuddyTurn,
  selectedGuess,
  onSelectGuess,
  onSkip,
  onCountChip,
}) {
  if (!mismatch) return null;

  const player = players[activePlayer];
  const opponent = players[mismatch.opponent];
  const canAttempt = mismatch.chipsAvailable >= mismatch.cost;
  const hasAnswered = selectedGuess !== null;
  const isCorrect = selectedGuess === mismatch.cost;
  const Picker = variant.guessStyle === 'chips' ? ChipCounter : NumberPicker;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, { borderColor: player.main }, shadow]}>
          <Text style={styles.headline}>Not a pair!</Text>
          <View style={styles.cardsRow}>
            <MiniCard face={mismatch.lowFace} />
            <Text style={styles.arrow}>➜</Text>
            <MiniCard face={mismatch.highFace} />
          </View>

          {canAttempt ? (
            <>
              <Text style={styles.detail}>
                🤔 {player.icon} {player.name}, how many chips does it take to turn {mismatch.lowFace.label} into{' '}
                {mismatch.highFace.label}?
              </Text>
              {variant.unitNote && <Text style={styles.unitNote}>{variant.unitNote}</Text>}

              {isBuddyTurn && !hasAnswered && <Text style={styles.thinking}>{player.icon} is thinking…</Text>}

              {!hasAnswered && !isBuddyTurn && (
                <BigButton label="⏭ Skip" color={colors.gray} onPress={onSkip} style={styles.skipButton} />
              )}

              <Picker
                key={mismatch.id}
                mismatch={mismatch}
                selectedGuess={selectedGuess}
                disabled={isBuddyTurn}
                onSelect={onSelectGuess}
                onCount={onCountChip}
              />

              {hasAnswered && (
                <Text style={[styles.feedback, { color: isCorrect ? colors.greenDark : colors.redDark }]}>
                  {isCorrect
                    ? `Correct! 🎉 ${mismatch.cost} chips go to ${opponent.icon} ${opponent.name}.`
                    : `Not quite! It was ${mismatch.cost}. ${player.name} loses ${mismatch.cost} chips and the pair goes back.`}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.detail}>
                It takes 🪙 {mismatch.cost} chips, but {player.name} only has {mismatch.chipsAvailable}.
              </Text>
              {!isBuddyTurn && <BigButton label="⏭ OK" color={player.main} onPress={onSkip} style={styles.okButton} />}
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
    padding: 20,
  },
  box: {
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 4,
    padding: 20,
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
  },
  headline: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  miniCard: {
    width: MINI_CARD,
    height: MINI_CARD,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.yellow,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  arrow: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textDark,
  },
  detail: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  unitNote: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: 8,
  },
  thinking: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray,
    marginBottom: 8,
  },
  skipButton: {
    width: '100%',
    paddingVertical: 12,
    marginBottom: 12,
  },
  numberScroll: {
    maxHeight: 200,
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
  counter: {
    alignItems: 'center',
    width: '100%',
  },
  counterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  coin: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  coinPicked: {
    borderColor: colors.orange,
    backgroundColor: colors.yellow,
  },
  coinText: {
    fontSize: 28,
  },
  countText: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 6,
  },
  counterButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  smallButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  payButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
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
