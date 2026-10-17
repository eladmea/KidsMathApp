import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import MiniGameEnd from '../components/MiniGameEnd';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { colors } from '../utils/theme';

const TOTAL_CHIPS = 10;
const CUP_WIDTH = 96;
const CHIP_SIZE = 44;
const FLIGHT_MS = 550;
const START_SWEEP_MS = 2200;
const FASTEST_SWEEP_MS = 1000;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// The cup slides back and forth; tap to toss a chip straight up and catch it.
export default function ChipTossScreen({ route, navigation }) {
  const { activeProfile } = useProfiles();
  const { say } = useNarrator(activeProfile?.narration);
  const { playCorrect, playWrong } = useSoundEffects();
  const [width, setWidth] = useState(0);
  const [chipsLeft, setChipsLeft] = useState(TOTAL_CHIPS);
  const [score, setScore] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const cupX = useRef(new Animated.Value(0)).current;
  const chipY = useRef(new Animated.Value(0)).current;
  const cupXValue = useRef(0);
  const isOver = chipsLeft === 0 && !isFlying;
  // The cup speeds up every 3 catches.
  const sweepMs = Math.max(FASTEST_SWEEP_MS, START_SWEEP_MS - Math.floor(score / 3) * 300);

  useEffect(() => {
    say('Tap to toss the chip into the cup!');
  }, [say]);

  useEffect(() => {
    const id = cupX.addListener(({ value }) => {
      cupXValue.current = value;
    });
    return () => cupX.removeListener(id);
  }, [cupX]);

  useEffect(() => {
    if (!width || isOver) return undefined;
    const maxX = width - CUP_WIDTH;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cupX, { toValue: maxX, duration: sweepMs, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(cupX, { toValue: 0, duration: sweepMs, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [width, sweepMs, isOver, cupX]);

  function toss() {
    if (isFlying || chipsLeft === 0 || !width) return;
    setIsFlying(true);
    setLastResult(null);
    Animated.timing(chipY, { toValue: 1, duration: FLIGHT_MS, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }).start(() => {
      const cupCenter = cupXValue.current + CUP_WIDTH / 2;
      const isCatch = Math.abs(cupCenter - width / 2) <= CUP_WIDTH / 2 - CHIP_SIZE / 4;
      if (isCatch) {
        setScore((s) => s + 1);
        playCorrect();
      } else {
        playWrong();
      }
      setLastResult(isCatch ? 'catch' : 'miss');
      chipY.setValue(0);
      setChipsLeft((n) => n - 1);
      setIsFlying(false);
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader title="🥤 Chip Toss" left={`🥤 ${score}`} right={`🪙 ${chipsLeft}`} onBack={() => navigation.goBack()} />
      <Pressable style={styles.area} onPress={toss} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel="Toss">
        <View style={styles.cupLane} pointerEvents="none">
          <Animated.View style={[styles.cup, { transform: [{ translateX: cupX }] }]}>
            <Text style={styles.cupText}>🥤</Text>
          </Animated.View>
        </View>

        <Text style={styles.result} pointerEvents="none">
          {lastResult === 'catch' ? 'In the cup! 🎉' : lastResult === 'miss' ? 'So close! Try again' : ' '}
        </Text>

        <View style={styles.launchLane} pointerEvents="none">
          {chipsLeft > 0 && (
            <Animated.View
              style={[
                styles.chip,
                {
                  transform: [{ translateY: chipY.interpolate({ inputRange: [0, 1], outputRange: [0, -330] }) }],
                },
              ]}
            >
              <Text style={styles.chipText}>🪙</Text>
            </Animated.View>
          )}
          <Text style={styles.tapHint}>Tap anywhere to toss!</Text>
        </View>
      </Pressable>
      {isOver && (
        <MiniGameEnd
          emoji="🏆"
          headline={`${score} of ${TOTAL_CHIPS} in the cup!`}
          detail={score >= 7 ? 'Super aim!' : 'Great tossing!'}
          onDone={() => (route.params?.adventure ? navigation.goBack() : navigation.popToTop())}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1DC',
  },
  area: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  cupLane: {
    height: 100,
  },
  cup: {
    width: CUP_WIDTH,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupText: {
    fontSize: 76,
  },
  result: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: colors.textDark,
  },
  launchLane: {
    alignItems: 'center',
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 40,
  },
  tapHint: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray,
  },
});
