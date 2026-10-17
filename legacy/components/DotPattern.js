import { View, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

// Dice layouts (row, col in a 3x3 grid) — familiar patterns make subitizing easier.
const DICE = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]],
};

function DiceDots({ count, size, color }) {
  const cell = size / 3;
  const dot = cell * 0.7;
  const filled = new Set((DICE[count] || []).map(([r, c]) => `${r}-${c}`));
  return (
    <View style={{ width: size, height: size }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.row}>
          {[0, 1, 2].map((col) => (
            <View key={col} style={[styles.cell, { width: cell, height: cell }]}>
              {filled.has(`${row}-${col}`) && (
                <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// Ten frame: 2 rows of 5, filled left to right, top row first.
function TenFrame({ count, size, color }) {
  const cell = size / 5;
  const dot = cell * 0.7;
  return (
    <View style={[styles.frame, { width: size + 4 }]}>
      {[0, 1].map((row) => (
        <View key={row} style={styles.row}>
          {[0, 1, 2, 3, 4].map((col) => (
            <View key={col} style={[styles.cell, styles.frameCell, { width: cell, height: cell }]}>
              {row * 5 + col < count && (
                <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function DotPattern({ count, layout = 'dice', size = 120, color = colors.primary }) {
  if (layout === 'tenFrame') return <TenFrame count={count} size={size} color={color} />;
  return <DiceDots count={count} size={size} color={color} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    borderWidth: 2,
    borderColor: colors.textDark,
    borderRadius: 6,
  },
  frameCell: {
    borderWidth: 1,
    borderColor: colors.gray,
  },
});
