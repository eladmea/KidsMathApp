import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function ProgressBar({ current, total }) {
  const percent = Math.min(100, Math.round((current / total) * 100));
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Question {current} of {total}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  track: {
    height: 14,
    borderRadius: 10,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
});
