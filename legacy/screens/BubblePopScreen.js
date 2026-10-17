import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import MiniGameEnd from '../components/MiniGameEnd';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { colors } from '../utils/theme';

const GAME_SECONDS = 45;
const SPAWN_MS = 650;
const GOLDEN_EVERY = 9;
const BUBBLE_COLORS = ['#8EC5FF', '#FFB3D1', '#B8F0C8', '#FFE08A', '#D2B8FF'];
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const FUN_FACTS = [
  'An octopus has three hearts!',
  'Honey never goes bad.',
  'A group of flamingos is called a flamboyance.',
  'Sea otters hold hands while they sleep.',
  'Bananas are berries, but strawberries are not!',
  'A snail can sleep for three years.',
  'Butterflies taste with their feet.',
  'Cows have best friends.',
  'The heart of a blue whale is as big as a small car.',
  'Koalas sleep up to 20 hours a day.',
];

let nextBubbleId = 0;

export default function BubblePopScreen({ route, navigation }) {
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const { playCorrect } = useSoundEffects();
  const [area, setArea] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const [popped, setPopped] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(GAME_SECONDS);
  const [fact, setFact] = useState(null);
  const spawnCount = useRef(0);
  const factIndex = useRef(Math.floor(Math.random() * FUN_FACTS.length));
  const isOver = secondsLeft <= 0;

  useEffect(() => {
    say('Pop as many bubbles as you can!');
  }, [say]);

  useEffect(() => {
    if (isOver) return undefined;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [isOver]);

  useEffect(() => {
    if (!area || isOver) return undefined;
    const timer = setInterval(() => {
      spawnCount.current += 1;
      const size = 56 + Math.random() * 36;
      const bubble = {
        id: nextBubbleId++,
        size,
        x: Math.random() * (area.width - size),
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
        golden: spawnCount.current % GOLDEN_EVERY === 0,
        rise: new Animated.Value(0),
      };
      setBubbles((prev) => [...prev, bubble]);
      Animated.timing(bubble.rise, {
        toValue: 1,
        duration: 4200 + Math.random() * 2500,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      });
    }, SPAWN_MS);
    return () => clearInterval(timer);
  }, [area, isOver]);

  useEffect(() => {
    if (isOver) setBubbles([]);
  }, [isOver]);

  function pop(bubble) {
    bubble.rise.stopAnimation();
    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    setPopped((n) => n + 1);
    playCorrect();
    if (bubble.golden) {
      const text = FUN_FACTS[factIndex.current % FUN_FACTS.length];
      factIndex.current += 1;
      setFact(text);
      say(`Fun fact! ${text}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🫧 Bubble Pop"
        left={`🫧 ${popped}`}
        right={`⏱ ${Math.max(0, secondsLeft)}`}
        onBack={() => navigation.goBack()}
      />
      {fact && (
        <Pressable onPress={() => setFact(null)} style={styles.factBanner}>
          <Text style={styles.factText}>✨ {fact}</Text>
        </Pressable>
      )}
      <View style={styles.area} onLayout={(e) => setArea(e.nativeEvent.layout)}>
        {area &&
          bubbles.map((bubble) => (
            <Animated.View
              key={bubble.id}
              style={[
                styles.bubbleWrap,
                {
                  left: bubble.x,
                  width: bubble.size,
                  height: bubble.size,
                  transform: [
                    {
                      translateY: bubble.rise.interpolate({
                        inputRange: [0, 1],
                        outputRange: [area.height, -bubble.size],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable
                onPress={() => pop(bubble)}
                accessibilityLabel={bubble.golden ? 'Golden bubble' : 'Bubble'}
                style={[
                  styles.bubble,
                  { borderRadius: bubble.size / 2, backgroundColor: bubble.golden ? '#FFD23F' : bubble.color },
                  bubble.golden && styles.goldenBubble,
                ]}
              >
                <View style={styles.shine} />
                {bubble.golden && <Text style={styles.goldenStar}>⭐</Text>}
              </Pressable>
            </Animated.View>
          ))}
      </View>
      {isOver && (
        <MiniGameEnd
          emoji="🎉"
          headline={`You popped ${popped} bubbles!`}
          detail="What a bubble champion!"
          onDone={() => (route.params?.adventure ? navigation.goBack() : navigation.popToTop())}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4FE',
  },
  area: {
    flex: 1,
    overflow: 'hidden',
  },
  bubbleWrap: {
    position: 'absolute',
    top: 0,
  },
  bubble: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  goldenBubble: {
    borderColor: colors.orange,
    borderWidth: 3,
  },
  shine: {
    position: 'absolute',
    top: '18%',
    left: '22%',
    width: '22%',
    height: '22%',
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  goldenStar: {
    fontSize: 24,
  },
  factBanner: {
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  factText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
  },
});
