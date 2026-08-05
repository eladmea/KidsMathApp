import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function StarRating({ stars }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3].map((position) => (
        <Text key={position} style={[styles.star, position > stars && styles.starEmpty]}>
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  star: {
    fontSize: 72,
    color: colors.yellow,
    marginHorizontal: 6,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  starEmpty: {
    color: '#E5E0D8',
  },
});
