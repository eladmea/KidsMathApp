import { Pressable, Text, StyleSheet } from 'react-native';
import CardFace from './CardFace';
import { colors, shadow } from '../utils/theme';

export default function MemoryCard({ face, status, size, onPress, disabled }) {
  const isFaceUp = status === 'flipped' || status === 'matched';
  const isMatched = status === 'matched';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isFaceUp}
      style={({ pressed }) => [
        styles.card,
        { width: size, height: size },
        isFaceUp ? styles.cardFaceUp : styles.cardFaceDown,
        isMatched && styles.cardMatched,
        pressed && !isFaceUp && !disabled && styles.cardPressed,
        shadow,
      ]}
    >
      {isFaceUp ? (
        <CardFace face={face} size={size} color={isMatched ? colors.white : colors.textDark} />
      ) : (
        <Text style={[styles.backText, { fontSize: size * 0.4 }]}>?</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    padding: 4,
  },
  cardFaceDown: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  cardFaceUp: {
    backgroundColor: colors.white,
    borderColor: colors.yellow,
  },
  cardMatched: {
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
  },
  cardPressed: {
    opacity: 0.8,
  },
  backText: {
    fontWeight: '900',
    color: colors.white,
  },
});
