import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/theme';

export default function MiniGameHeader({ title, left, right, onBack }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={[styles.back, shadow]} accessibilityLabel="Back">
        <Text style={styles.backText}>✕</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.stats}>
        {left ? <Text style={styles.stat}>{left}</Text> : null}
        {right ? <Text style={styles.stat}>{right}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: colors.textDark,
  },
  stats: {
    alignItems: 'flex-end',
  },
  stat: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
  },
});
