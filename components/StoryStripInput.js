import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, shadow } from '../utils/theme';

// Tap story panels in the order they happen (1, 2, 3, 4). Tapping a numbered
// panel takes back that step and the ones after it.
export default function StoryStripInput({ question, submitted, isCorrect, onSubmit, onReadCaption }) {
  const [order, setOrder] = useState([]);

  function handlePress(item) {
    if (submitted) return;
    const position = order.indexOf(item.id);
    if (position >= 0) {
      setOrder(order.slice(0, position));
      return;
    }
    onReadCaption(item.caption);
    const next = [...order, item.id];
    setOrder(next);
    if (next.length === question.items.length) onSubmit(next);
  }

  return (
    <View style={styles.grid}>
      {question.items.map((item) => {
        const position = order.indexOf(item.id);
        const correctPosition = question.answer.indexOf(item.id);
        const isRightSpot = submitted && position === correctPosition;
        const badgeColor = !submitted ? colors.purple : isRightSpot ? colors.green : colors.red;
        return (
          <Pressable
            key={item.id}
            onPress={() => handlePress(item)}
            accessibilityLabel={item.caption}
            style={[styles.card, shadow, position >= 0 && { borderColor: badgeColor }]}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.caption}>{item.caption}</Text>
            {position >= 0 && (
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{position + 1}</Text>
              </View>
            )}
            {submitted && !isCorrect && !isRightSpot && (
              <Text style={styles.fix}>should be {correctPosition + 1}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 12,
  },
  card: {
    width: '48%',
    minHeight: 150,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E5E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  emoji: {
    fontSize: 48,
  },
  caption: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 6,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 18,
  },
  fix: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.redDark,
    marginTop: 4,
  },
});
