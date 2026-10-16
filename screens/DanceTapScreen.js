import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import MiniGameEnd from '../components/MiniGameEnd';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { colors, shadow } from '../utils/theme';

const TOTAL_BEATS = 30;
const START_BEAT_MS = 1200;
const FASTEST_BEAT_MS = 600;
const SPEED_UP_MS = 25;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const PADS = [
  { id: 0, emoji: '🐻', color: '#FF6B6B' },
  { id: 1, emoji: '🐰', color: '#4A9DFF' },
  { id: 2, emoji: '🐧', color: '#3DDC84' },
  { id: 3, emoji: '🐸', color: '#FFC93D' },
];

// A pad glows on every beat; tap it before the next beat to keep dancing.
export default function DanceTapScreen({ navigation }) {
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const { playCorrect, playWrong } = useSoundEffects();
  const [beat, setBeat] = useState(0);
  const [litPad, setLitPad] = useState(null);
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [pose, setPose] = useState(0);
  const hitThisBeat = useRef(false);
  const beatMs = useRef(START_BEAT_MS);
  const bounce = useRef(new Animated.Value(1)).current;
  const isOver = beat > TOTAL_BEATS;

  useEffect(() => {
    say('Tap the glowing animal to the beat!');
  }, [say]);

  useEffect(() => {
    if (isOver) {
      setLitPad(null);
      return undefined;
    }
    const timer = setTimeout(
      () => {
        if (beat > 0 && !hitThisBeat.current) setCombo(0);
        hitThisBeat.current = false;
        setLitPad((prev) => {
          const options = PADS.filter((pad) => pad.id !== prev);
          return options[Math.floor(Math.random() * options.length)].id;
        });
        setBeat((b) => b + 1);
      },
      beat === 0 ? 800 : beatMs.current
    );
    return () => clearTimeout(timer);
  }, [beat, isOver]);

  function handlePadPress(pad) {
    if (isOver || litPad === null) return;
    if (pad.id === litPad && !hitThisBeat.current) {
      hitThisBeat.current = true;
      setHits((h) => h + 1);
      setCombo(combo + 1);
      setBestCombo(Math.max(bestCombo, combo + 1));
      setPose((p) => 1 - p);
      setLitPad(null);
      beatMs.current = Math.max(FASTEST_BEAT_MS, beatMs.current - SPEED_UP_MS);
      playCorrect();
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.3, duration: 90, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(bounce, { toValue: 1, duration: 120, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start();
    } else if (pad.id !== litPad) {
      setCombo(0);
      playWrong();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🕺 Dance Tap"
        left={`🎵 ${hits}`}
        right={`🔥 ${combo}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.stage}>
        <Animated.Text style={[styles.dancer, { transform: [{ scale: bounce }] }]}>{pose ? '💃' : '🕺'}</Animated.Text>
        <Text style={styles.beatText}>
          Beat {Math.min(beat, TOTAL_BEATS)} / {TOTAL_BEATS}
        </Text>
      </View>
      <View style={styles.pads}>
        {PADS.map((pad) => {
          const isLit = pad.id === litPad;
          return (
            <Pressable
              key={pad.id}
              onPress={() => handlePadPress(pad)}
              accessibilityLabel={`Pad ${pad.emoji}${isLit ? ' glowing' : ''}`}
              style={[
                styles.pad,
                { backgroundColor: isLit ? pad.color : '#EFEAE2', borderColor: pad.color },
                isLit && [styles.padLit, shadow],
              ]}
            >
              <Text style={[styles.padEmoji, !isLit && styles.padEmojiDim]}>{pad.emoji}</Text>
            </Pressable>
          );
        })}
      </View>
      {isOver && (
        <MiniGameEnd
          emoji="🪩"
          headline={`You danced ${hits} of ${TOTAL_BEATS} beats!`}
          detail={`Best combo: 🔥 ${bestCombo}`}
          onDone={() => navigation.popToTop()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4ECFF',
  },
  stage: {
    alignItems: 'center',
    marginTop: 12,
  },
  dancer: {
    fontSize: 96,
  },
  beatText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray,
    marginTop: 4,
  },
  pads: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 16,
    padding: 16,
  },
  pad: {
    width: '42%',
    aspectRatio: 1,
    maxWidth: 200,
    borderRadius: 32,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padLit: {
    transform: [{ scale: 1.05 }],
  },
  padEmoji: {
    fontSize: 64,
  },
  padEmojiDim: {
    opacity: 0.45,
  },
});
