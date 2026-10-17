import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import DotPattern from './DotPattern';
import { colors } from '../utils/theme';

const DOTS_SIZE = { dice: 130, tenFrame: 240 };

// Dots that disappear after `flashMs`, so children subitize instead of counting.
function FlashDots({ count, layout, flashMs }) {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    if (!flashMs) return undefined;
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

// The Sound Snack monster: hungry, then yum (right) or yuck (wrong).
function SnackMonster({ sound, result }) {
  const face = result === 'correct' ? '😋' : result === 'wrong' ? '🤢' : '👾';
  const words = result === 'correct' ? 'Yum!' : result === 'wrong' ? 'Yuck!' : `${sound}!`;
  return (
    <View style={styles.monsterRow}>
      <Text style={styles.monster}>{face}</Text>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{words}</Text>
      </View>
    </View>
  );
}

const STAIR_BASE = 58;
const STAIR_RISE = 20;

// Number blocks on a staircase: they climb when the numbers go up and step
// down when they go down, so the direction is visible before any reading.
// `reveal` fills the "?" block (after answering, or in a worked example).
function SequenceStairs({ numbers, direction, step, reveal, showSteps }) {
  const values = [...numbers, reveal ?? '?'];
  const height = (i) => STAIR_BASE + (direction === 'up' ? i : values.length - 1 - i) * STAIR_RISE;
  const longest = Math.max(...values.map((v) => String(v).length));
  const fontSize = longest >= 3 ? 20 : 26;
  const isUp = direction === 'up';
  // The revealed block always shows the right answer, so it is green; a wrong
  // tap is marked red on its answer button instead.
  const mysteryColor = reveal !== null && reveal !== undefined ? colors.green : colors.orange;
  return (
    <View style={[styles.box, styles.stairsBox]}>
      <View style={[styles.directionChip, { backgroundColor: isUp ? '#D9F7E6' : '#FFE9D4' }]}>
        <Text style={[styles.directionText, { color: isUp ? colors.greenDark : colors.orange }]}>
          {isUp ? '⬆️ Going up' : '⬇️ Going down'}
        </Text>
      </View>
      <View style={styles.stairs}>
        {values.map((value, i) => {
          const isMystery = i === values.length - 1;
          return (
            <View key={i} style={styles.stairStep}>
              {i > 0 && (
                <View style={styles.stepArrow}>
                  {showSteps && <Text style={styles.stepAmount}>{isUp ? `+${step}` : `−${step}`}</Text>}
                  <Text style={styles.stepArrowText}>{isUp ? '↗' : '↘'}</Text>
                </View>
              )}
              <View
                style={[
                  styles.stairBlock,
                  { height: height(i) },
                  isMystery && { backgroundColor: mysteryColor, borderColor: mysteryColor },
                ]}
              >
                <Text style={[styles.stairNumber, { fontSize }, isMystery && styles.stairMysteryText]}>{value}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// A pattern laid out as big tiles. `gap` is the tile to find (shown as "?"
// until answered, then filled in); `numbered` adds position numbers.
// Tiles shrink so the whole pattern stays on one line: a pattern broken over
// two lines is much harder for young children to see.
const PATTERN_GAP = 5;
const PATTERN_MAX_WIDTH = 480;
function PatternRow({ items, gap, numbered, reveal }) {
  const { width } = useWindowDimensions();
  const tiles = items.length + (numbered ? 1 : 0);
  const available = Math.min(width, PATTERN_MAX_WIDTH) - 72;
  const tile = Math.max(26, Math.min(58, Math.floor((available - PATTERN_GAP * (tiles - 1)) / tiles)));
  const size = Math.round(tile * 0.72);
  return (
    <View style={[styles.box, styles.patternBox]}>
      <View style={styles.patternRow}>
        {items.map((item, i) => {
          const isGap = i === gap;
          const filled = isGap && reveal !== null && reveal !== undefined;
          return (
            <View key={i} style={styles.patternCell}>
              <View style={[styles.patternTile, { width: tile, height: tile }, isGap && styles.patternGap, filled && styles.patternFilled]}>
                <Text style={[styles.patternItem, { fontSize: size }]}>{isGap ? (filled ? reveal : '?') : item}</Text>
              </View>
              {numbered && <Text style={styles.patternNumber}>{i + 1}</Text>}
            </View>
          );
        })}
        {numbered && (
          <View style={styles.patternCell}>
            <View style={[styles.patternTile, { width: tile, height: tile }]}>
              <Text style={styles.patternMore}>…</Text>
            </View>
            <Text style={styles.patternNumber}> </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Growing pattern: each step is a stack that grows by the same amount.
function GrowingSteps({ steps, emoji, reveal }) {
  const all = [...steps, reveal ?? null];
  // Smaller blocks for taller stacks, so each step stays one column.
  const tallest = Math.max(...all.filter((n) => n !== null));
  const block = tallest <= 6 ? 22 : tallest <= 9 ? 17 : 13;
  return (
    <View style={[styles.box, styles.growingBox]}>
      {all.map((count, i) => (
        <View key={i} style={styles.growingStep}>
          <View style={styles.growingStack}>
            {count === null ? (
              <Text style={styles.growingMystery}>?</Text>
            ) : (
              Array.from({ length: count }, (_, k) => (
                <Text key={k} style={[styles.growingBlock, { fontSize: block, lineHeight: block + 3 }]}>
                  {emoji}
                </Text>
              ))
            )}
          </View>
          <Text style={styles.growingLabel}>Step {i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

// Pictures that let pre-readers count, listen and look instead of reading.
// `result` is 'correct' | 'wrong' | null once the child has answered;
// `reveal` is the answer to show in place of a "?" (if the visual has one).
export default function QuestionVisual({ visual, result = null, reveal = null, showSteps = false }) {
  if (!visual) return null;

  if (visual.type === 'sequence') {
    return (
      <SequenceStairs
        numbers={visual.numbers}
        direction={visual.direction}
        step={visual.step}
        reveal={reveal}
        showSteps={showSteps}
      />
    );
  }

  if (visual.type === 'pattern') {
    return <PatternRow items={visual.items} gap={visual.gap} numbered={visual.numbered} reveal={reveal} />;
  }

  if (visual.type === 'growing') {
    return <GrowingSteps steps={visual.steps} emoji={visual.emoji} reveal={reveal} />;
  }

  if (visual.type === 'picture') {
    return (
      <View style={[styles.box, styles.pictureBox]}>
        <Text style={styles.picture}>{visual.emoji}</Text>
        {visual.caption ? <Text style={styles.caption}>{visual.caption}</Text> : null}
      </View>
    );
  }

  if (visual.type === 'listen') {
    return (
      <View style={[styles.box, styles.pictureBox]}>
        <Text style={styles.picture}>👂</Text>
        <Text style={styles.caption}>Listen!</Text>
      </View>
    );
  }

  if (visual.type === 'snackMonster') {
    return <SnackMonster sound={visual.sound} result={result} />;
  }

  if (visual.type === 'dots') {
    // In a worked example (reveal set) the dots stay up so they can be studied.
    return <FlashDots count={visual.count} layout={visual.layout} flashMs={reveal === null ? visual.flashMs : null} />;
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
  patternBox: {
    width: '100%',
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: PATTERN_GAP,
  },
  patternCell: {
    alignItems: 'center',
  },
  patternTile: {
    borderRadius: 14,
    backgroundColor: '#F6F3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternGap: {
    backgroundColor: '#FFE9D4',
    borderWidth: 3,
    borderColor: colors.orange,
    borderStyle: 'dashed',
  },
  patternFilled: {
    backgroundColor: '#D9F7E6',
    borderColor: colors.green,
    borderStyle: 'solid',
  },
  patternItem: {
    textAlign: 'center',
  },
  patternNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gray,
    marginTop: 2,
  },
  patternMore: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.gray,
  },
  growingBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
  },
  growingStep: {
    alignItems: 'center',
  },
  growingStack: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 40,
  },
  growingBlock: {
    fontSize: 20,
    lineHeight: 24,
  },
  growingMystery: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.orange,
  },
  growingLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gray,
    marginTop: 4,
  },
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
  stairsBox: {
    width: '100%',
    paddingTop: 10,
  },
  directionChip: {
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  directionText: {
    fontSize: 16,
    fontWeight: '900',
  },
  stairs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  stairStep: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  stepArrow: {
    width: 26,
    alignItems: 'center',
    marginBottom: 8,
  },
  stepAmount: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.purple,
  },
  stepArrowText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.gray,
  },
  stairBlock: {
    width: 62,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#DCE6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stairNumber: {
    fontWeight: '900',
    color: colors.textDark,
  },
  stairMysteryText: {
    color: colors.white,
  },
  pictureBox: {
    paddingHorizontal: 28,
  },
  picture: {
    fontSize: 84,
  },
  caption: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 2,
  },
  monsterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  monster: {
    fontSize: 96,
  },
  bubble: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.purple,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bubbleText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.purple,
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
