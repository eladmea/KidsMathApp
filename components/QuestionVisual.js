import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DotPattern from './DotPattern';
import { colors } from '../utils/theme';

const DOTS_SIZE = { dice: 130, tenFrame: 240 };

// Dots that disappear after `flashMs`, so children subitize instead of counting.
function FlashDots({ count, layout, flashMs }) {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), flashMs);
    return () => clearTimeout(timer);
  }, [flashMs]);

  const size = DOTS_SIZE[layout] || DOTS_SIZE.dice;
  const height = layout === 'tenFrame' ? (size / 5) * 2 + 4 : size;
  return (
    <View style={[styles.box, { minWidth: size + 32 }]}>
      {isVisible ? (
        <DotPattern count={count} layout={layout} size={size} />
      ) : (
        <View style={[styles.hidden, { height }]}>
          <Text style={styles.hiddenText}>👀 ?</Text>
        </View>
      )}
    </View>
  );
}

function EmojiGroup({ emoji, count, fadedFrom = count, size }) {
  if (count === 0) {
    return <View style={[styles.emptyGroup, { width: size * 1.4, height: size * 1.4 }]} />;
  }
  return (
    <View style={styles.group}>
      {Array.from({ length: count }, (_, i) => (
        <Text key={i} style={[{ fontSize: size }, i >= fadedFrom && styles.faded]}>
          {emoji}
        </Text>
      ))}
    </View>
  );
}

// Pictures that let pre-readers count instead of reading numbers.
export default function QuestionVisual({ visual }) {
  if (!visual) return null;

  if (visual.type === 'dots') {
    return <FlashDots count={visual.count} layout={visual.layout} flashMs={visual.flashMs} />;
  }

  if (visual.type === 'objects') {
    const size = visual.count <= 5 ? 52 : 38;
    return (
      <View style={styles.box}>
        <EmojiGroup emoji={visual.emoji} count={visual.count} size={size} />
      </View>
    );
  }

  if (visual.type === 'sum') {
    return (
      <View style={[styles.box, styles.row]}>
        <EmojiGroup emoji={visual.emoji} count={visual.a} size={28} />
        <Text style={styles.operator}>+</Text>
        <EmojiGroup emoji={visual.emoji} count={visual.b} size={28} />
      </View>
    );
  }

  if (visual.type === 'takeAway') {
    // The last `b` objects are faded out: "take away" made visible.
    return (
      <View style={styles.box}>
        <EmojiGroup emoji={visual.emoji} count={visual.a} fadedFrom={visual.a - visual.b} size={30} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
    maxWidth: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 300,
    gap: 4,
  },
  emptyGroup: {
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.gray,
    borderRadius: 12,
  },
  hidden: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenText: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.gray,
  },
  faded: {
    opacity: 0.2,
  },
  operator: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textDark,
    marginHorizontal: 10,
  },
});
