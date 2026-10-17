import { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

const ARROWS = { down: '👇', up: '👆', left: '👈', right: '👉' };

// A bouncing arrow that points at what to do next, with an optional word
// ("Rub!", "Drag!"). Used as a reminder when a child seems stuck.
export default function HintArrow({ direction = 'down', label = null, size = 40, style }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 380, useNativeDriver: false }),
        Animated.timing(bounce, { toValue: 0, duration: 380, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);
  const distance = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const vertical = direction === 'down' || direction === 'up';
  const sign = direction === 'down' || direction === 'right' ? 1 : -1;
  const transform = [vertical ? { translateY: Animated.multiply(distance, sign) } : { translateX: Animated.multiply(distance, sign) }];
  return (
    <View pointerEvents="none" style={[styles.wrap, vertical ? styles.column : styles.row, style]} accessibilityLabel={`Hint: ${label || direction}`}>
      {label && (direction === 'down' || direction === 'right') ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.Text selectable={false} style={[{ fontSize: size, transform }]}>
        {ARROWS[direction]}
      </Animated.Text>
      {label && (direction === 'up' || direction === 'left') ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  column: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    backgroundColor: colors.purple,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
