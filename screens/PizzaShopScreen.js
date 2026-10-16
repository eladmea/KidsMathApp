import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import TraceCanvas from '../components/TraceCanvas';
import DragTray from '../components/DragTray';
import BigButton from '../components/BigButton';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { getRecord, hasPassed } from '../utils/progress';
import { DIGIT_WORDS, digitCheckpoints, numberPool, pickDistinct } from '../utils/tracing';
import { CUSTOMERS, MAX_ON_TRAY_TARGET, PIZZAS_PER_ROUND, TOPPINGS, checkCount, clampToCircle, roundPoint, word } from '../utils/writingGames';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const ROLL_DISTANCE = 700;
const CHEESE_TAPS = 3;
const BAKE_MS = 2200;
const SERVE_MS = 2600;

const SAUCE_LOOK = {
  dot: 14,
  guide: '#EBCB9C',
  guideCurrent: '#E2B47A',
  done: '#D63C3C',
  doneScale: 1.5,
  trail: 'rgba(214, 60, 60, 0.6)',
  trailSize: 16,
  demo: '🥄',
};

// Pizza Shop: roll the dough, pick a number, write it in sauce, add cheese,
// pick a topping, drag that many on, bake, and serve an animal customer.
export default function PizzaShopScreen({ route, navigation }) {
  const { skillId, adventureStep } = route.params;
  const { progress } = useProfiles();
  // Pre-readers need to hear every step.
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const { width } = useWindowDimensions();
  const pizzaSize = Math.min(width - 56, 300);
  const numbers = numberPool({ bigNumbers: hasPassed(getRecord(progress, 'math-write-1-5')) });
  const customers = useMemo(() => pickDistinct(CUSTOMERS, PIZZAS_PER_ROUND), []);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState('dough');
  const [rolled, setRolled] = useState(0);
  const [number, setNumber] = useState(null);
  const [cheese, setCheese] = useState(0);
  const [topping, setTopping] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [message, setMessage] = useState(null);
  const [points, setPoints] = useState(0);
  const pointsRef = useRef(0);
  const restartsRef = useRef(0);
  const firstCheckRef = useRef(null);
  const pizzaRef = useRef(null);
  const timerRef = useRef(null);
  const rollRef = useRef({ last: null, total: 0 });

  const customer = customers[index];
  const strokes = useMemo(() => (number === null ? null : digitCheckpoints(number)), [number]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setStep('dough');
    setRolled(0);
    setNumber(null);
    setCheese(0);
    setTopping(null);
    setPlaced([]);
    setMessage(null);
    restartsRef.current = 0;
    firstCheckRef.current = null;
    rollRef.current = { last: null, total: 0 };
    say(`${customer.name} is hungry! Let's make a pizza. Rub the dough to roll it out.`);
  }, [index]);

  // Rubbing the dough rolls it out; a tap helps a little too.
  const rollResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          rollRef.current.last = [event.nativeEvent.pageX, event.nativeEvent.pageY];
          rollRef.current.total += ROLL_DISTANCE * 0.08;
          setRolled(Math.min(1, rollRef.current.total / ROLL_DISTANCE));
        },
        onPanResponderMove: (event) => {
          const point = [event.nativeEvent.pageX, event.nativeEvent.pageY];
          const last = rollRef.current.last || point;
          rollRef.current.total += Math.hypot(point[0] - last[0], point[1] - last[1]);
          rollRef.current.last = point;
          setRolled(Math.min(1, rollRef.current.total / ROLL_DISTANCE));
        },
      }),
    []
  );

  useEffect(() => {
    if (step === 'dough' && rolled >= 1) {
      setStep('number');
      playCorrect();
      say('Great rolling! Now pick your number.');
    }
  }, [rolled, step]);

  function pickNumber(n) {
    setNumber(n);
    setStep('sauce');
    say(`${DIGIT_WORDS[n]}! Write ${DIGIT_WORDS[n]} with the sauce. Start at the green dot.`);
  }

  function sauceHint(kind) {
    if (kind === 'start') say('Start at the green dot!');
    else if (kind === 'next') say('Now the next line!');
    else {
      restartsRef.current += 1;
      say('Almost! Follow the dots all the way.');
      playWrong();
    }
  }

  function sauceDone() {
    playCorrect();
    setStep('cheese');
    say(`Yummy ${DIGIT_WORDS[number]}! Now tap the pizza to sprinkle cheese.`);
  }

  function sprinkle() {
    if (step !== 'cheese') return;
    const next = cheese + 1;
    setCheese(next);
    if (next >= CHEESE_TAPS) {
      setStep('topping');
      say('Cheesy! Now pick a topping.');
    }
  }

  function pickTopping(item) {
    setTopping(item);
    setStep('place');
    say(`Put ${DIGIT_WORDS[number]} ${word(number, item)} on the pizza. Drag them from the tray.`);
  }

  function drop(x, y) {
    if (placed.length >= MAX_ON_TRAY_TARGET) return;
    const [px, py] = clampToCircle(x, y, pizzaSize);
    const next = [...placed, { id: Date.now() + Math.random(), x: px, y: py }];
    setPlaced(next);
    setMessage(null);
    say(String(next.length));
  }

  function removeTopping() {
    if (!placed.length) return;
    const next = placed.slice(0, -1);
    setPlaced(next);
    say(String(next.length));
  }

  function check() {
    const result = checkCount(placed.length, number);
    if (firstCheckRef.current === null) firstCheckRef.current = result;
    if (result === 'right') {
      playCorrect();
      setMessage(null);
      setStep('bake');
      say(`${number} ${word(number, topping)}! Into the oven!`);
      timerRef.current = setTimeout(serve, BAKE_MS);
    } else if (result === 'more') {
      playWrong();
      setMessage(`The number is ${number}. We have ${placed.length}. Add more!`);
      say(`The number is ${number}. We have ${placed.length}. Add ${number - placed.length} more!`);
    } else {
      playWrong();
      setMessage(`Too many! The number is ${number}. Take one off.`);
      say(`Too many! The number is ${number}. Take ${placed.length - number} off.`);
    }
  }

  function serve() {
    const point = roundPoint({ restarts: restartsRef.current, firstCheck: firstCheckRef.current });
    pointsRef.current += point;
    setPoints(pointsRef.current);
    setStep('serve');
    say(`Yum! ${number} ${word(number, topping)}! Thank you!`);
    timerRef.current = setTimeout(() => {
      if (index + 1 >= PIZZAS_PER_ROUND) finishSkillRound(navigation, skillId, pointsRef.current, PIZZAS_PER_ROUND, adventureStep);
      else setIndex(index + 1);
    }, SERVE_MS);
  }

  const doughSize = pizzaSize * (0.35 + 0.65 * rolled);
  const canvasWidth = pizzaSize * 0.5;
  const showSauce = ['cheese', 'topping', 'place', 'bake', 'serve'].includes(step);

  const instruction = {
    dough: '👐 Rub the dough to roll it out!',
    number: 'Pick your number!',
    sauce: `Write ${number} with sauce 🥄`,
    cheese: '🧀 Tap the pizza to add cheese!',
    topping: 'Pick a topping!',
    place: `Put ${number} ${topping ? topping.emoji : ''} on the pizza`,
    bake: '🔥 Baking…',
    serve: `${customer.emoji} Yum! Thank you!`,
  }[step];

  function pizza(content) {
    return (
      <View
        ref={pizzaRef}
        collapsable={false}
        accessibilityLabel="Pizza"
        style={[styles.pizza, { width: pizzaSize, height: pizzaSize, borderRadius: pizzaSize / 2 }]}
      >
        {showSauce && <View style={[styles.sauce, { borderRadius: pizzaSize / 2 }]} />}
        {Array.from({ length: cheese * 6 }, (_, i) => (
          <Text key={`c${i}`} style={[styles.cheese, cheeseSpot(i, pizzaSize)]}>
            ▪
          </Text>
        ))}
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MiniGameHeader
        title="🍕 Pizza Shop"
        left={`⭐ ${points}`}
        right={`${index + 1} / ${PIZZAS_PER_ROUND}`}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.center}>
        <View style={styles.customerRow}>
          <Text style={styles.customer}>{customer.emoji}</Text>
          <View style={[styles.bubble, shadow]}>
            <Text style={styles.bubbleText}>{instruction}</Text>
          </View>
        </View>

        {step === 'dough' && (
          <View style={[styles.doughArea, { width: pizzaSize, height: pizzaSize }]} {...rollResponder.panHandlers} accessibilityLabel="Dough">
            <View style={[styles.dough, { width: doughSize, height: doughSize, borderRadius: doughSize / 2 }]} />
            <Text style={styles.pin}>🥖</Text>
          </View>
        )}

        {step === 'number' && (
          <View style={styles.cards}>
            {numbers.map((n) => (
              <Pressable key={n} onPress={() => pickNumber(n)} style={[styles.card, shadow]} accessibilityLabel={`Number ${n}`}>
                <Text style={styles.cardText}>{n}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 'sauce' && strokes &&
          pizza(
            <View style={styles.canvasHolder}>
              <TraceCanvas
                key={`${index}-${number}`}
                strokes={strokes}
                width={canvasWidth}
                look={SAUCE_LOOK}
                onHint={sauceHint}
                onComplete={sauceDone}
                label={`Sauce tracing for ${number}`}
              />
            </View>
          )}

        {step === 'cheese' && (
          <Pressable onPress={sprinkle} accessibilityLabel="Sprinkle cheese">
            {pizza(<Text style={[styles.bigNumber, { fontSize: pizzaSize * 0.5 }]}>{number}</Text>)}
          </Pressable>
        )}

        {step === 'topping' && (
          <View style={styles.cards}>
            {TOPPINGS.map((item) => (
              <Pressable key={item.name} onPress={() => pickTopping(item)} style={[styles.card, shadow]} accessibilityLabel={`Topping ${item.name}`}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {(step === 'place' || step === 'bake' || step === 'serve') &&
          pizza(
            <>
              {step === 'place' && <Text style={[styles.ghostNumber, { fontSize: pizzaSize * 0.5 }]}>{number}</Text>}
              {/* Plain pictures: touchable items here would steal the next drag. */}
              {placed.map((p) => (
                <View key={p.id} pointerEvents="none" style={[styles.topping, { left: p.x - 22, top: p.y - 24 }]} accessibilityLabel={`Placed ${topping.name}`}>
                  <Text style={styles.toppingText}>{topping.emoji}</Text>
                </View>
              ))}
              {step === 'bake' && (
                <View style={[styles.oven, { borderRadius: pizzaSize / 2 }]}>
                  <Text style={styles.ovenText}>🔥🔥🔥</Text>
                </View>
              )}
            </>
          )}

        {step === 'place' && (
          <>
            <View style={styles.countRow}>
              <Text style={styles.count}>
                {placed.length} {topping.emoji}
              </Text>
              {placed.length > 0 && (
                <Pressable onPress={removeTopping} style={[styles.takeOff, shadow]} accessibilityLabel="Take one off">
                  <Text style={styles.takeOffText}>➖ Take one off</Text>
                </Pressable>
              )}
            </View>
            <DragTray emoji={topping.emoji} label={topping.plural} targetRef={pizzaRef} onDrop={drop} />
            <BigButton label="Done ✓" color={colors.green} onPress={check} style={styles.done} />
          </>
        )}

        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </SafeAreaView>
  );
}

// Fixed, pleasant-looking spots for the cheese sprinkles.
function cheeseSpot(i, size) {
  const angle = i * 2.399;
  const radius = (size / 2) * 0.75 * Math.sqrt(((i * 37) % 100) / 100);
  return { left: size / 2 + radius * Math.cos(angle) - 6, top: size / 2 + radius * Math.sin(angle) - 10 };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    marginVertical: 8,
  },
  customer: {
    fontSize: 54,
    marginRight: 8,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
  },
  bubbleText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textDark,
  },
  doughArea: {
    userSelect: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dough: {
    backgroundColor: '#F3D9A4',
    borderWidth: 4,
    borderColor: '#E2BD78',
  },
  pin: {
    position: 'absolute',
    fontSize: 64,
    bottom: 0,
    right: 10,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 380,
    marginTop: 8,
  },
  card: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.textDark,
  },
  cardEmoji: {
    fontSize: 50,
  },
  pizza: {
    userSelect: 'none',
    backgroundColor: '#F3D9A4',
    borderWidth: 8,
    borderColor: '#D9A55B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sauce: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    backgroundColor: '#E04B3A',
  },
  cheese: {
    position: 'absolute',
    fontSize: 22,
    color: '#FFE27A',
  },
  canvasHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumber: {
    fontWeight: '900',
    color: 'rgba(160, 25, 20, 0.55)',
  },
  ghostNumber: {
    position: 'absolute',
    fontWeight: '900',
    color: 'rgba(160, 25, 20, 0.35)',
  },
  topping: {
    position: 'absolute',
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toppingText: {
    fontSize: 36,
  },
  oven: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 120, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  ovenText: {
    fontSize: 40,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  takeOff: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  takeOffText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.redDark,
  },
  count: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textDark,
    marginVertical: 8,
  },
  done: {
    marginTop: 12,
    minWidth: 200,
    paddingVertical: 14,
  },
  message: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.redDark,
    textAlign: 'center',
    marginTop: 8,
  },
});
