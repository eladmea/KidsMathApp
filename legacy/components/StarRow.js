import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

// Small inline star meter (0-3) for skill progress.
export default function StarRow({ stars, size = 18 }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((position) => (
        <Text key={position} style={{ fontSize: size, color: position <= stars ? colors.yellow : '#E5E0D8' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
