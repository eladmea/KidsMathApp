import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/theme';

const STATE_STYLES = {
  default: { backgroundColor: colors.white, borderColor: colors.primary, textColor: colors.textDark },
  correct: { backgroundColor: colors.green, borderColor: colors.greenDark, textColor: colors.white },
  wrong: { backgroundColor: colors.red, borderColor: colors.redDark, textColor: colors.white },
  disabled: { backgroundColor: colors.white, borderColor: colors.gray, textColor: colors.gray },
};

export default function AnswerButton({ value, onPress, state = 'default', disabled = false }) {
  const style = STATE_STYLES[state] || STATE_STYLES.default;
  const icon = state === 'correct' ? ' ✓' : state === 'wrong' ? ' ✗' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        shadow,
      ]}
    >
      <Text style={[styles.label, { color: style.textColor }]}>
        {value}
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '46%',
    paddingVertical: 22,
    marginVertical: 8,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 28,
    fontWeight: '800',
  },
});
