import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { profileBand } from '../utils/profiles';
import { BUDDY } from '../utils/players';
import { getLearningGame, recommendedOption } from '../curriculum/games';
import { colors, shadow } from '../utils/theme';

// Pick a version of a learning game and who to play with.
export default function GameSetupScreen({ route, navigation }) {
  const game = getLearningGame(route.params.gameId);
  const { activeProfile } = useProfiles();
  const bandId = activeProfile ? profileBand(activeProfile).id : undefined;
  const [optionId, setOptionId] = useState(() => recommendedOption(game, bandId).id);
  const [mode, setMode] = useState('solo');

  function start() {
    navigation.navigate(game.route, { variant: optionId, board: Number(optionId), mode });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description}</Text>

        <Text style={styles.label}>Choose a game</Text>
        {game.options.map((option) => {
          const isSelected = option.id === optionId;
          const isJustRight = option.bands.includes(bandId);
          return (
            <Pressable
              key={option.id}
              onPress={() => setOptionId(option.id)}
              style={[styles.option, isSelected && [styles.optionSelected, shadow]]}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionBody}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionNote}>{option.note}</Text>
              </View>
              {isJustRight && <Text style={styles.justRight}>⭐ Just right</Text>}
            </Pressable>
          );
        })}

        <Text style={styles.label}>Play with</Text>
        <View style={styles.modeRow}>
          {[
            { id: 'solo', label: `${BUDDY.icon} ${BUDDY.name}` },
            { id: 'duo', label: '👫 A friend' },
          ].map((choice) => {
            const isSelected = choice.id === mode;
            return (
              <Pressable
                key={choice.id}
                onPress={() => setMode(choice.id)}
                style={[styles.mode, isSelected && [styles.modeSelected, shadow]]}
              >
                <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>{choice.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <BigButton label="Start ▶" color={colors.green} onPress={start} style={styles.startButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 4,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
    marginTop: 22,
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E5E0D8',
    padding: 12,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: colors.purple,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  optionBody: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  optionNote: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '700',
  },
  justRight: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.orange,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  mode: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E5E0D8',
    paddingVertical: 16,
  },
  modeSelected: {
    borderColor: colors.purple,
    backgroundColor: '#F1E9FF',
  },
  modeText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray,
  },
  modeTextSelected: {
    color: colors.purple,
  },
  startButton: {
    marginTop: 28,
    minWidth: 240,
  },
});
