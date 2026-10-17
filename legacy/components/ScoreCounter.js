import { View, Text, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/theme';

export default function ScoreCounter({ score }) {
  return (
    <View style={[styles.badge, shadow]}>
      <Text style={styles.text}>⭐ {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.yellow,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
});
