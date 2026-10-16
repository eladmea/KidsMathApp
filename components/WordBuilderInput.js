import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { colors, shadow } from '../utils/theme';

// Spell a word with letter tiles. Each tile tap plays its sound; tapping a
// filled slot sends the tile back. Checks automatically when the word is full.
export default function WordBuilderInput({ question, submitted, isCorrect, onSubmit, onTileSound }) {
  const slotCount = question.parts.length;
  const [placed, setPlaced] = useState([]);

  function placeTile(tile) {
    if (submitted || placed.length >= slotCount || placed.some((t) => t.id === tile.id)) return;
    onTileSound(tile.text);
    const next = [...placed, tile];
    setPlaced(next);
    if (next.length === slotCount) onSubmit(next.map((t) => t.text));
  }

  function removeFrom(index) {
    if (submitted) return;
    setPlaced(placed.slice(0, index));
  }

  const slotColor = submitted ? (isCorrect ? colors.green : colors.red) : colors.primary;

  return (
    <View style={styles.wrapper}>
      <View style={styles.slots}>
        {Array.from({ length: slotCount }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => removeFrom(i)}
            accessibilityLabel={`Slot ${i + 1}`}
            style={[styles.slot, { borderColor: slotColor }, placed[i] && styles.slotFilled]}
          >
            <Text style={styles.slotText}>{placed[i]?.text ?? ''}</Text>
          </Pressable>
        ))}
      </View>

      {submitted && !isCorrect && (
        <Text style={styles.correction}>
          It's spelled <Text style={styles.correctionWord}>{question.parts.join(' · ')}</Text>
        </Text>
      )}
      {submitted && isCorrect && <Text style={styles.success}>{question.word}! 🎉</Text>}

      <View style={styles.tiles}>
        {question.tiles.map((tile) => {
          const isUsed = placed.some((t) => t.id === tile.id);
          return (
            <Pressable
              key={tile.id}
              onPress={() => placeTile(tile)}
              disabled={submitted || isUsed}
              accessibilityLabel={`Tile ${tile.text}`}
              style={[styles.tile, shadow, isUsed && styles.tileUsed]}
            >
              <Text style={[styles.tileText, isUsed && styles.tileTextUsed]}>{tile.text}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted && placed.length > 0 && (
        <BigButton label="↩ Undo" color={colors.gray} onPress={() => removeFrom(placed.length - 1)} style={styles.undo} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  slots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  slot: {
    width: 70,
    height: 76,
    borderRadius: 16,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  slotFilled: {
    borderStyle: 'solid',
  },
  slotText: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.textDark,
  },
  correction: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.redDark,
    marginBottom: 8,
  },
  correctionWord: {
    fontWeight: '900',
  },
  success: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.greenDark,
    marginBottom: 8,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  tile: {
    minWidth: 64,
    height: 64,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileUsed: {
    backgroundColor: '#F4F1EC',
    borderColor: '#E5E0D8',
  },
  tileText: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textDark,
  },
  tileTextUsed: {
    color: '#E5E0D8',
  },
  undo: {
    marginTop: 16,
    paddingVertical: 10,
  },
});
