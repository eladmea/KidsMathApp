import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DIFFICULTIES } from '../utils/constants';
import { colors, difficultyColors, shadow } from '../utils/theme';

export default function DifficultySelector({ selected, onSelect }) {
  return (
    <View style={styles.row}>
      {DIFFICULTIES.map((level) => {
        const isSelected = level === selected;
        const levelColor = difficultyColors[level];
        return (
          <Pressable
            key={level}
            onPress={() => onSelect(level)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? levelColor : colors.white,
                borderColor: levelColor,
              },
              isSelected && shadow,
            ]}
          >
            <Text style={[styles.label, { color: isSelected ? colors.white : levelColor }]}>
              {level}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 3,
    minWidth: 96,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
});
