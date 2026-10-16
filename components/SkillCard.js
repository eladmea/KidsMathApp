import { Pressable, View, Text, StyleSheet } from 'react-native';
import StarRow from './StarRow';
import { colors, shadow } from '../utils/theme';

// status: 'ready' | 'locked' | 'soon'
export default function SkillCard({ skill, status, stars, color, isRecommended, onPress }) {
  const isReady = status === 'ready';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadow,
        { borderColor: isReady ? color : colors.gray, opacity: pressed ? 0.85 : 1 },
        !isReady && styles.cardDimmed,
      ]}
    >
      <Text style={styles.emoji}>{status === 'locked' ? '🔒' : skill.emoji}</Text>
      <View style={styles.body}>
        <Text style={[styles.title, !isReady && styles.titleDimmed]}>{skill.title}</Text>
        {status === 'soon' ? (
          <Text style={styles.note}>Coming soon</Text>
        ) : (
          <StarRow stars={stars} size={20} />
        )}
      </View>
      {isRecommended && isReady && <Text style={[styles.badge, { backgroundColor: color }]}>Next ▶</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 76,
  },
  cardDimmed: {
    backgroundColor: '#F4F1EC',
  },
  emoji: {
    fontSize: 36,
    marginRight: 14,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  titleDimmed: {
    color: colors.gray,
  },
  note: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray,
  },
  badge: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
