import { View, Text, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { colors, shadow } from '../utils/theme';

// Shared "time's up" card for Fun Break mini-games.
export default function MiniGameEnd({ emoji, headline, detail, onDone, buttonLabel = 'Back to learning ▶' }) {
  return (
    <View style={styles.overlay}>
      <View style={[styles.box, shadow]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.headline}>{headline}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        <BigButton label={buttonLabel} color={colors.primary} onPress={onDone} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58, 46, 82, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: colors.white,
    borderRadius: 26,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 60,
  },
  headline: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 6,
  },
  detail: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 22,
    width: '100%',
  },
});
