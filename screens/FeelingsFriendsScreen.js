import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import AnswerButton from '../components/AnswerButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { FEELINGS } from '../curriculum/selGenerators';
import { makeRound, roundTotal } from '../utils/feelingsFriends';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const FEEDBACK_MS = { correct: 1800, wrong: 2800 };

// Feelings Friends: name how a friend feels, then choose what would help.
export default function FeelingsFriendsScreen({ route, navigation }) {
  const { skillId } = route.params;
  const { activeProfile } = useProfiles();
  const { say, stop } = useNarrator(activeProfile?.narration);
  const { playCorrect, playWrong } = useSoundEffects();
  const turns = useMemo(() => makeRound(), []);
  const total = roundTotal(turns);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState('feeling');
  const [picked, setPicked] = useState(null);
  const [message, setMessage] = useState(null);
  const [correct, setCorrect] = useState(0);
  const correctRef = useRef(0);
  const timerRef = useRef(null);

  const turn = turns[index];
  const { friend } = turn;
  const feeling = FEELINGS[friend.feeling];
  const question = step === 'feeling' ? `How does ${friend.name} feel?` : `What could help ${friend.name}?`;
  const speech = step === 'feeling' ? `${friend.name} says: ${friend.story} ${question}` : question;

  useEffect(() => {
    say(speech);
  }, [speech, say]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function answer(choice, isRight, text) {
    if (picked !== null) return;
    setPicked(choice);
    setMessage(text);
    if (isRight) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
    }
    setTimeout(() => {
      stop();
      if (isRight) playCorrect();
      else playWrong();
      say(text);
    }, 30);
    timerRef.current = setTimeout(() => {
      setPicked(null);
      setMessage(null);
      if (step === 'feeling') {
        setStep('help');
      } else if (index + 1 >= turns.length) {
        finishSkillRound(navigation, skillId, correctRef.current, total);
      } else {
        setIndex(index + 1);
        setStep('feeling');
      }
    }, FEEDBACK_MS[isRight ? 'correct' : 'wrong']);
  }

  function pickFeeling(feelingId) {
    const isRight = feelingId === friend.feeling;
    answer(
      feelingId,
      isRight,
      isRight
        ? `Yes! ${friend.name} feels ${feeling.word}.`
        : `${friend.name} feels ${feeling.word}. Look at the story again: ${friend.story}`
    );
  }

  function pickHelp(option) {
    const helpful = turn.helpChoices.find((o) => o.helpful);
    answer(
      option.label,
      option.helpful,
      option.helpful
        ? `That would help! Thank you for being kind.`
        : `Hmm, that wouldn't help ${friend.name}. "${helpful.label}" would help.`
    );
  }

  function feelingState(feelingId) {
    if (picked === null) return 'default';
    if (feelingId === friend.feeling) return 'correct';
    if (feelingId === picked) return 'wrong';
    return 'disabled';
  }

  function helpStyle(option) {
    if (picked === null) return null;
    if (option.helpful) return styles.helpRight;
    if (option.label === picked) return styles.helpWrong;
    return styles.helpDisabled;
  }

  // After the helper is picked the friend cheers up.
  const friendMood = step === 'help' && picked !== null ? '💛' : step === 'help' ? feeling.emoji : '';

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🐻 Feelings Friends"
        left={`💛 ${correct}`}
        right={`${index + 1} / ${turns.length}`}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.friendRow}>
          <Text style={styles.friend}>{friend.emoji}</Text>
          {friendMood ? <Text style={styles.mood}>{friendMood}</Text> : null}
        </View>
        <Pressable onPress={() => say(speech, { force: true })} style={[styles.bubble, shadow]} accessibilityLabel="Say it again">
          <Text style={styles.bubbleName}>{friend.name} says 🔊</Text>
          <Text style={styles.bubbleText}>{friend.story}</Text>
        </Pressable>

        <Text style={styles.question}>{question}</Text>

        {step === 'feeling' ? (
          <>
            <View style={styles.choices}>
              {turn.feelingChoices.map((feelingId) => (
                <AnswerButton
                  key={feelingId}
                  value={FEELINGS[feelingId].emoji}
                  variant="picture"
                  state={feelingState(feelingId)}
                  disabled={picked !== null}
                  onPress={() => pickFeeling(feelingId)}
                />
              ))}
            </View>
            <View style={styles.choices}>
              {turn.feelingChoices.map((feelingId) => (
                <Text key={feelingId} style={styles.feelingWord}>
                  {FEELINGS[feelingId].word}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.helps}>
            {turn.helpChoices.map((option) => (
              <Pressable
                key={option.label}
                disabled={picked !== null}
                onPress={() => pickHelp(option)}
                accessibilityLabel={option.label}
                style={({ pressed }) => [styles.help, shadow, pressed && styles.helpPressed, helpStyle(option)]}
              >
                <Text style={styles.helpEmoji}>{option.emoji}</Text>
                <Text style={styles.helpLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.message}>{message || ' '}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DA',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  friend: {
    fontSize: 96,
  },
  mood: {
    fontSize: 40,
    marginLeft: -12,
  },
  bubble: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    width: '100%',
    borderWidth: 3,
    borderColor: '#C9A100',
    marginTop: 8,
  },
  bubbleName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#9C7C00',
  },
  bubbleText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 4,
  },
  question: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  feelingWord: {
    width: '30%',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: colors.gray,
  },
  helps: {
    width: '100%',
    gap: 12,
  },
  help: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
    padding: 14,
  },
  helpPressed: {
    backgroundColor: '#E3EAFF',
    transform: [{ scale: 0.97 }],
  },
  helpRight: {
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
  },
  helpWrong: {
    backgroundColor: colors.red,
    borderColor: colors.redDark,
  },
  helpDisabled: {
    borderColor: colors.gray,
    opacity: 0.6,
  },
  helpEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  helpLabel: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: colors.textDark,
  },
  message: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 16,
  },
});
