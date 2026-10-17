import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MiniGameHeader from '../components/MiniGameHeader';
import TraceCanvas from '../components/TraceCanvas';
import DragTray from '../components/DragTray';
import BigButton from '../components/BigButton';
import HintArrow from '../components/HintArrow';
import { useIdleHint } from '../utils/useIdleHint';
import { useProfiles } from '../context/ProfileContext';
import { useNarrator } from '../utils/useNarrator';
import { useSoundEffects } from '../utils/useSoundEffects';
import { getRecord, hasPassed } from '../utils/progress';
import { BOX, DIGIT_WORDS, digitCheckpoints, numberPool, pickDistinct } from '../utils/tracing';
import {
  CHEESE_COVERED,
  CUSTOMERS,
  CUTS_NEEDED,
  MAX_ON_TRAY_TARGET,
  PIZZAS_PER_ROUND,
  SAUCE_COVERED,
  SLICES,
  SLICE_WORDS,
  TOPPINGS,
  checkCount,
  clampToCircle,
  coverAt,
  coverageRatio,
  isCut,
  makeCoverage,
  roundPoint,
  sliceGeometry,
  word,
} from '../utils/writingGames';
import { finishSkillRound } from '../utils/skillRounds';
import { colors, shadow } from '../utils/theme';

const ROLL_DISTANCE = 700;
const BAKE_MS = 2400;
const NEXT_MS = 2600;
const MAX_SAUCE_DABS = 180;
// The sauce brush (diameter, as a share of the pizza). The covered area
// matches what is drawn, so the game never moves on while bare dough shows.
const SAUCE_DAB = 0.12;
const MAX_CHEESE_DABS = 160;
const CRUST = 9;

const SAUCE = '#D9412F';
const SAUCE_LOOK = {
  dot: 14,
  guide: '#EBCB9C',
  guideCurrent: '#E2B47A',
  done: SAUCE,
  doneScale: 1.5,
  trail: 'rgba(217, 65, 47, 0.6)',
  trailSize: 16,
  demo: '🥄',
};

// Olive slices are drawn as dark rings; the other toppings are emoji.
function Topping({ topping, size = 36 }) {
  if (topping.id === 'olive') {
    const ring = size * 0.72;
    return (
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: ring * 0.3,
          borderColor: '#2F2B26',
        }}
      />
    );
  }
  return (
    <Text selectable={false} style={{ fontSize: size }}>
      {topping.emoji}
    </Text>
  );
}

// A cheese shred: a short, rounded yellow strip at a fixed angle.
function Shred({ x, y, angle, baked }) {
  return (
    <View
      style={[
        styles.shred,
        { left: x - 7, top: y - 2.5, transform: [{ rotate: `${angle}deg` }] },
        baked && styles.shredBaked,
      ]}
    />
  );
}

// Four shreds around each cheese dab, spread out in a fixed pattern
// (within CHEESE_REACH, the area the dab counts as covered).
const CHEESE_REACH = 0.075;
function shredsFor(dab, i, size) {
  return [0, 1, 2, 3].map((k) => {
    const a = (i * 7 + k * 1.7) % (Math.PI * 2);
    const d = size * CHEESE_REACH * (0.3 + ((i * 13 + k * 5) % 10) / 14);
    return { x: dab[0] + Math.cos(a) * d, y: dab[1] + Math.sin(a) * d, angle: (i * 47 + k * 61) % 180 };
  });
}

// An even sprinkle over the whole pizza: once the cheese is spread (and
// melted after baking).
function meltedCheese(size) {
  const spots = [];
  for (let i = 0; i < 140; i++) {
    const a = i * 2.399;
    const r = (size / 2) * 0.78 * Math.sqrt(((i * 37) % 100) / 100);
    spots.push({ x: size / 2 + r * Math.cos(a), y: size / 2 + r * Math.sin(a), angle: (i * 53) % 180 });
  }
  return spots;
}

// Everything on the pizza, drawn in a size x size box.
// `sauceSmooth`: once the sauce is spread, it evens out over the whole pizza.
function PizzaLayers({ size, sauceDabs, cheeseDabs, toppings, topping, baked, sauceSmooth, cheeseSmooth }) {
  const dab = size * SAUCE_DAB;
  const melted = useMemo(() => meltedCheese(size), [size]);
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.crust, { width: size, height: size, borderRadius: size / 2 }, baked && styles.crustBaked]} />
      <View style={[styles.base, { left: CRUST, top: CRUST, width: size - CRUST * 2, height: size - CRUST * 2, borderRadius: size / 2 }]} />
      {baked || sauceSmooth ? (
        <View style={[styles.sauceDisc, { left: CRUST + 4, top: CRUST + 4, width: size - CRUST * 2 - 8, height: size - CRUST * 2 - 8, borderRadius: size / 2 }]} />
      ) : (
        sauceDabs.map(([x, y], i) => (
          <View key={`s${i}`} style={[styles.sauceDab, { left: x - dab / 2, top: y - dab / 2, width: dab, height: dab, borderRadius: dab / 2 }]} />
        ))
      )}
      {baked || cheeseSmooth
        ? melted.map((s, i) => <Shred key={`m${i}`} {...s} baked={baked} />)
        : cheeseDabs.flatMap((d, i) => shredsFor(d, i, size).map((s, k) => <Shred key={`c${i}-${k}`} {...s} />))}
      {topping &&
        toppings.map((t) => (
          <View key={t.id} style={[styles.placed, { left: t.x - 22, top: t.y - 22 }]}>
            <Topping topping={topping} />
          </View>
        ))}
    </View>
  );
}

// Pizza Shop: an animal orders a pizza with N toppings. Roll the dough,
// write N in sauce, spread the sauce and the cheese, add N toppings, bake,
// slice and feed the slices to the animal.
export default function PizzaShopScreen({ route, navigation }) {
  const { skillId, adventureStep } = route.params;
  const { progress } = useProfiles();
  // Pre-readers need to hear every step.
  const { say } = useNarrator(true);
  const { playCorrect, playWrong } = useSoundEffects();
  const { width, height } = useWindowDimensions();
  // Room above for the order and ingredients, below for the tray or oven.
  const size = Math.max(200, Math.min(width - 56, 280, Math.round(height * 0.34)));
  const bigNumbers = hasPassed(getRecord(progress, 'math-write-1-5'));
  // The customer picks the number: different numbers each pizza.
  const numbers = useMemo(() => pickDistinct(numberPool({ bigNumbers }), PIZZAS_PER_ROUND), []);
  const customers = useMemo(() => pickDistinct(CUSTOMERS, PIZZAS_PER_ROUND), []);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState('dough');
  const [rolled, setRolled] = useState(0);
  const [sauceDabs, setSauceDabs] = useState([]);
  const [cheeseDabs, setCheeseDabs] = useState([]);
  const [coverage, setCoverage] = useState(() => makeCoverage(size));
  const [topping, setTopping] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [cuts, setCuts] = useState(0);
  const [eaten, setEaten] = useState([]);
  const [dragSlice, setDragSlice] = useState(null);
  const [ovenDrag, setOvenDrag] = useState(null);
  const [message, setMessage] = useState(null);
  const [points, setPoints] = useState(0);

  const pointsRef = useRef(0);
  const restartsRef = useRef(0);
  const firstCheckRef = useRef(null);
  const pizzaRef = useRef(null);
  const pizzaBoxRef = useRef({ x: 0, y: 0 });
  const animalRef = useRef(null);
  const ovenRef = useRef(null);
  const ovenBoxRef = useRef(null);
  const animalBoxRef = useRef(null);
  const timerRef = useRef(null);
  const rollRef = useRef({ last: null, total: 0 });
  const paintRef = useRef({ last: null, cover: null, sauce: [], cheese: [] });
  const cutRef = useRef(null);
  const live = useRef({});

  const number = numbers[index];
  const customer = customers[index];
  const strokes = useMemo(() => digitCheckpoints(number), [number]);
  const canvasWidth = size * 0.5;
  const canvasOffset = [(size - canvasWidth) / 2, (size - canvasWidth * (BOX.height / BOX.width)) / 2];

  // Gesture handlers are created once; they read the latest state and
  // functions through this ref (so the second pizza isn't the first one).
  live.current = { step, coverage, sauceDabs, cheeseDabs, cuts, eaten };

  // A reminder arrow (and the instruction spoken again) after 5 s without
  // progress. The task key changes with the step, and when the toppings are
  // all on (then the arrow points at Done instead of the tray).
  const hintKey = `${index}-${step}-${step === 'place' && placed.length >= number}`;
  const { showing: hinting, poke } = useIdleHint(hintKey, {
    enabled: !['baking', 'done'].includes(step),
    onIdle: () => live.current.sayHint && live.current.sayHint(),
  });
  live.current.poke = poke;

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setStep('dough');
    setRolled(0);
    setSauceDabs([]);
    setCheeseDabs([]);
    setCoverage(makeCoverage(size));
    setTopping(null);
    setPlaced([]);
    setCuts(0);
    setEaten([]);
    setMessage(null);
    restartsRef.current = 0;
    firstCheckRef.current = null;
    rollRef.current = { last: null, total: 0 };
    say(`${customer.name} wants a pizza with ${DIGIT_WORDS[number]} ${number === 1 ? 'topping' : 'toppings'}! First, rub the dough to roll it out.`);
  }, [index]);

  function measurePizza() {
    pizzaRef.current?.measureInWindow((x, y) => {
      pizzaBoxRef.current = { x, y };
    });
  }

  function toPizza(event) {
    const { pageX, pageY } = event.nativeEvent;
    return [pageX - pizzaBoxRef.current.x, pageY - pizzaBoxRef.current.y];
  }

  // ---- Dough: rubbing rolls it out (a tap helps a little too) ----
  const rollResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          live.current.poke();
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
          live.current.poke();
        },
      }),
    []
  );

  useEffect(() => {
    if (step === 'dough' && rolled >= 1) {
      setStep('trace');
      playCorrect();
      say(`Great rolling! Now write ${DIGIT_WORDS[number]} with the sauce. Start at the green dot.`);
    }
  }, [rolled, step]);

  // ---- Sauce: write the number ----
  function traceHint(kind) {
    poke();
    if (kind === 'start') say('Start at the green dot!');
    else if (kind === 'next') say('Now the next line!');
    else {
      restartsRef.current += 1;
      say('Almost! Follow the dots all the way.');
      playWrong();
    }
  }

  function traceDone() {
    playCorrect();
    // The written number stays on the pizza as sauce.
    const scale = canvasWidth / BOX.width;
    const written = strokes.flat().filter((_, i) => i % 2 === 0).map(([x, y]) => [canvasOffset[0] + x * scale, canvasOffset[1] + y * scale]);
    const cover = written.reduce((c, [x, y]) => coverAt(c, x, y, size * 0.06), makeCoverage(size));
    paintRef.current = { last: null, cover, sauce: written, cheese: [] };
    setSauceDabs(written);
    setCoverage(cover);
    setStep('sauce');
    say(`${DIGIT_WORDS[number]}! Now spread the sauce all over the pizza with your finger.`);
  }

  // ---- Spreading sauce and cheese with a finger ----
  // Many move events can arrive before a re-render, so the latest coverage
  // and marks live in paintRef (state only mirrors them for drawing).
  function startPaint(kind) {
    paintRef.current = {
      last: null,
      cover: makeCoverage(size),
      sauce: kind === 'sauce' ? [...live.current.sauceDabs] : null,
      cheese: [],
      // The next layer starts with a new touch, not mid-swipe.
      waitForLift: true,
    };
  }

  function paint(point) {
    const { step: current } = live.current;
    const ref = paintRef.current;
    if (ref.waitForLift) return;
    const last = ref.last;
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < size * 0.035) return;
    ref.last = point;
    live.current.poke();
    const [x, y] = clampToCircle(point[0], point[1], size, 0.12);
    if (current === 'sauce') {
      if (ref.sauce.length < MAX_SAUCE_DABS) ref.sauce = [...ref.sauce, [x, y]];
      ref.cover = coverAt(ref.cover, x, y, (size * SAUCE_DAB) / 2);
      setSauceDabs(ref.sauce);
      setCoverage(ref.cover);
      if (coverageRatio(ref.cover) >= SAUCE_COVERED) {
        setStep('cheese');
        live.current.step = 'cheese';
        startPaint('cheese');
        setCoverage(paintRef.current.cover);
        playCorrect();
        say('Saucy! Now sprinkle the cheese all over.');
      }
    } else if (current === 'cheese') {
      if (ref.cheese.length < MAX_CHEESE_DABS) ref.cheese = [...ref.cheese, [x, y]];
      ref.cover = coverAt(ref.cover, x, y, size * CHEESE_REACH);
      setCheeseDabs(ref.cheese);
      setCoverage(ref.cover);
      if (coverageRatio(ref.cover) >= CHEESE_COVERED) {
        setStep('topping');
        live.current.step = 'topping';
        playCorrect();
        say(`Cheesy! Now pick a topping. ${customer.name} wants ${DIGIT_WORDS[number]}.`);
      }
    }
  }

  // ---- Slicing: swipe across the baked pizza ----
  function cutSwipe(start, end) {
    if (!isCut(start, end, size)) {
      say('Swipe all the way across the pizza!');
      return;
    }
    const next = live.current.cuts + 1;
    setCuts(next);
    playCorrect();
    if (next >= CUTS_NEEDED) {
      setStep('feed');
      say(`Four slices! Give the slices to ${customer.name}. Drag them one by one.`);
    } else {
      say('Chop! One more cut.');
    }
  }

  const PIZZA_GESTURE_STEPS = ['sauce', 'cheese', 'slice', 'oven'];
  const pizzaResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => PIZZA_GESTURE_STEPS.includes(live.current.step),
        onStartShouldSetPanResponderCapture: () => PIZZA_GESTURE_STEPS.includes(live.current.step),
        onMoveShouldSetPanResponder: () => PIZZA_GESTURE_STEPS.includes(live.current.step),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          live.current.poke();
          measurePizza();
          if (live.current.step === 'oven') {
            ovenRef.current?.measureInWindow((x, y, w, h) => {
              ovenBoxRef.current = { x, y, w, h };
            });
            setOvenDrag({ dx: 0, dy: 0 });
            return;
          }
          const point = toPizza(event);
          paintRef.current = { ...paintRef.current, last: null, waitForLift: false };
          cutRef.current = point;
          if (live.current.step !== 'slice') live.current.paint(point);
        },
        onPanResponderMove: (event, gesture) => {
          if (live.current.step === 'oven') setOvenDrag({ dx: gesture.dx, dy: gesture.dy });
          else if (live.current.step !== 'slice') live.current.paint(toPizza(event));
        },
        onPanResponderRelease: (event) => {
          if (live.current.step === 'oven') {
            setOvenDrag(null);
            const box = ovenBoxRef.current;
            const { pageX, pageY } = event.nativeEvent;
            const margin = 30;
            if (box && pageX >= box.x - margin && pageX <= box.x + box.w + margin && pageY >= box.y - margin && pageY <= box.y + box.h + margin) {
              live.current.bake();
            } else {
              live.current.say('Drag the pizza all the way into the oven!');
            }
            return;
          }
          if (live.current.step === 'slice' && cutRef.current) live.current.cutSwipe(cutRef.current, toPizza(event));
          cutRef.current = null;
        },
        onPanResponderTerminate: () => setOvenDrag(null),
      }),
    [size]
  );

  // ---- Toppings ----
  function pickTopping(item) {
    setTopping(item);
    setStep('place');
    say(`Put ${DIGIT_WORDS[number]} ${word(number, item)} on the pizza. Drag them from the tray.`);
  }

  function drop(x, y) {
    poke();
    if (placed.length >= MAX_ON_TRAY_TARGET) return;
    const [px, py] = clampToCircle(x, y, size);
    const next = [...placed, { id: `${Date.now()}-${Math.random()}`, x: px, y: py }];
    setPlaced(next);
    setMessage(null);
    say(String(next.length));
  }

  function takeOne() {
    poke();
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
      setStep('oven');
      say(`${number} ${word(number, topping)}! Now drag the pizza into the oven.`);
    } else if (result === 'more') {
      playWrong();
      setMessage(`${customer.name} wants ${number}. We have ${placed.length}. Add more!`);
      say(`${customer.name} wants ${number}. We have ${placed.length}. Add ${number - placed.length} more!`);
    } else {
      playWrong();
      setMessage(`Too many! ${customer.name} wants ${number}. Take one off.`);
      say(`Too many! ${customer.name} wants ${number}. Take ${placed.length - number} off.`);
    }
  }

  function bake() {
    setStep('baking');
    say('Into the oven! It is getting hot…');
    timerRef.current = setTimeout(() => {
      setStep('slice');
      playCorrect();
      say('Ding! The pizza is ready. Swipe across it to cut it into slices.');
    }, BAKE_MS);
  }

  // ---- Feeding: drag each slice to the animal ----
  const sliceResponders = useMemo(
    () =>
      Array.from({ length: SLICES }, (_, i) =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => live.current.step === 'feed' && !live.current.eaten.includes(i),
          onMoveShouldSetPanResponder: () => live.current.step === 'feed' && !live.current.eaten.includes(i),
          onPanResponderTerminationRequest: () => false,
          onPanResponderGrant: () => {
            live.current.poke();
            animalRef.current?.measureInWindow((x, y, w, h) => {
              animalBoxRef.current = { x, y, w, h };
            });
            setDragSlice({ i, dx: 0, dy: 0 });
          },
          onPanResponderMove: (_, gesture) => setDragSlice({ i, dx: gesture.dx, dy: gesture.dy }),
          onPanResponderRelease: (event) => {
            setDragSlice(null);
            const box = animalBoxRef.current;
            const { pageX, pageY } = event.nativeEvent;
            const margin = 30;
            if (box && pageX >= box.x - margin && pageX <= box.x + box.w + margin && pageY >= box.y - margin && pageY <= box.y + box.h + margin) {
              live.current.feed(i);
            }
          },
          onPanResponderTerminate: () => setDragSlice(null),
        })
      ),
    []
  );

  function feed(i) {
    const next = [...live.current.eaten, i];
    setEaten(next);
    playCorrect();
    if (next.length < SLICES) {
      say(`${SLICE_WORDS[next.length - 1]} slice! Yum!`);
      return;
    }
    const point = roundPoint({ restarts: restartsRef.current, firstCheck: firstCheckRef.current });
    pointsRef.current += point;
    setPoints(pointsRef.current);
    setStep('done');
    say(`Four slices! All gone! Thank you, that was yummy!`);
    timerRef.current = setTimeout(() => {
      if (index + 1 >= PIZZAS_PER_ROUND) finishSkillRound(navigation, skillId, pointsRef.current, PIZZAS_PER_ROUND, adventureStep);
      else setIndex(index + 1);
    }, NEXT_MS);
  }

  live.current.paint = paint;
  live.current.cutSwipe = cutSwipe;
  live.current.feed = feed;
  live.current.bake = bake;
  live.current.say = say;

  const baked = ['slice', 'feed', 'done'].includes(step);
  const sauceSmooth = !['dough', 'trace', 'sauce'].includes(step);
  const cheeseSmooth = sauceSmooth && step !== 'cheese';
  const layers = { size, sauceDabs, cheeseDabs, toppings: placed, topping, baked, sauceSmooth, cheeseSmooth };
  const coverPercent = Math.round(coverageRatio(coverage) * 100);

  const instruction = {
    dough: '👐 Rub the dough to roll it out!',
    trace: `Write ${number} with sauce 🥄`,
    sauce: '👆 Spread the sauce all over!',
    cheese: '🧀 Now the cheese! Spread it all over',
    topping: 'Pick a topping!',
    place: `Put ${number} on the pizza`,
    oven: '🔥 Drag the pizza into the oven!',
    baking: '🔥 Baking…',
    slice: `🔪 Swipe across to cut (${cuts}/${CUTS_NEEDED})`,
    feed: `Feed me the slices! (${eaten.length}/${SLICES})`,
    done: '😋 Yum! Thank you!',
  }[step];

  // What the reminder says and where its arrow points.
  const allOn = step === 'place' && placed.length >= number;
  const hint = {
    dough: { where: 'pizza', label: 'Rub!', say: 'Rub the dough with your finger to roll it out!' },
    trace: { where: 'trace', say: 'Start at the green dot and follow the dots with your finger.' },
    sauce: { where: 'pizza', label: 'Rub!', say: 'Rub your finger all over the pizza to spread the sauce.' },
    cheese: { where: 'pizza', label: 'Rub!', say: 'Rub your finger all over the pizza to sprinkle the cheese.' },
    topping: { where: 'toppings', label: 'Tap one!', say: 'Tap a topping you like.' },
    place: allOn
      ? { where: 'done', label: 'Tap!', say: `${number}! Now tap Done.` }
      : { where: 'tray', label: 'Drag!', say: `Drag a ${topping ? topping.name : 'topping'} from the tray onto the pizza.` },
    oven: { where: 'oven', label: 'Drag the pizza here!', say: 'Drag the pizza into the oven.' },
    slice: { where: 'pizza', label: 'Swipe!', direction: 'right', say: 'Swipe your finger across the pizza to cut it.' },
    feed: { where: 'animal', label: 'Feed me!', say: `Drag a slice to ${customer.name}.` },
  }[step];
  live.current.sayHint = () => hint && say(hint.say);
  const showHint = (where) => hinting && hint && hint.where === where;

  // Sauce -> cheese -> toppings, shown once the dough is rolled. The active
  // one stands out; finished ones get a tick; later ones are greyed out.
  const stationStatus = (steps) => {
    const at = STEP_ORDER.indexOf(step);
    if (steps.includes(step)) return 'active';
    return at > Math.max(...steps.map((s) => STEP_ORDER.indexOf(s))) ? 'done' : 'later';
  };

  const pizzaOffset = ovenDrag ? { transform: [{ translateX: ovenDrag.dx }, { translateY: ovenDrag.dy }, { scale: 0.6 }] } : null;

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
          <View ref={animalRef} collapsable={false} accessibilityLabel={`Customer ${customer.name}`}>
            <Text style={styles.customer}>{step === 'done' || (step === 'feed' && eaten.length) ? '😋' : customer.emoji}</Text>
            {showHint('animal') && <HintArrow direction="up" label={hint.label} size={32} style={styles.animalHint} />}
          </View>
          <View style={[styles.bubble, shadow]}>
            <Text style={styles.bubbleText}>{instruction}</Text>
          </View>
          <View style={[styles.ticket, shadow]} accessibilityLabel={`Order: ${number} toppings`}>
            <Text style={styles.ticketLabel}>🧾 Order</Text>
            <Text style={styles.ticketNumber}>{number}</Text>
          </View>
        </View>

        {step !== 'dough' && (
          <View style={styles.stations}>
            {STATIONS.map((station, i) => {
              const status = stationStatus(station.steps);
              return (
                <View key={station.id} style={styles.stationWrap}>
                  {i > 0 && <Text style={styles.stationArrow}>›</Text>}
                  <View
                    accessibilityLabel={`${station.label} ${status}`}
                    style={[styles.station, status === 'active' && [styles.stationActive, shadow], status === 'later' && styles.stationLater]}
                  >
                    <Text style={[styles.stationEmoji, status === 'active' && styles.stationEmojiActive]}>{station.emoji}</Text>
                    <Text style={[styles.stationLabel, status === 'active' && styles.stationLabelActive]}>{station.label}</Text>
                    {status === 'done' && <Text style={styles.stationTick}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {step === 'dough' ? (
          <View style={[styles.doughArea, { width: size, height: size }]} {...rollResponder.panHandlers} accessibilityLabel="Dough">
            <View style={[styles.dough, { width: size * (0.35 + 0.65 * rolled), height: size * (0.35 + 0.65 * rolled), borderRadius: size }]} />
            <Text style={styles.pin}>🥖</Text>
            {showHint('pizza') && <HintArrow label={hint.label} style={styles.pizzaHint} />}
          </View>
        ) : step === 'feed' || step === 'done' ? (
          <View style={{ width: size, height: size }} accessibilityLabel="Pizza slices">
            {Array.from({ length: SLICES }, (_, i) => {
              if (eaten.includes(i)) return null;
              const g = sliceGeometry(i, size);
              const out = 6;
              const dx = (i % 2 ? out : -out) + (dragSlice?.i === i ? dragSlice.dx : 0);
              const dy = (i < 2 ? -out : out) + (dragSlice?.i === i ? dragSlice.dy : 0);
              return (
                <View
                  key={i}
                  {...sliceResponders[i].panHandlers}
                  accessibilityLabel={`Slice ${i + 1}`}
                  style={[
                    styles.slice,
                    { left: g.left, top: g.top, width: g.size, height: g.size, [`border${g.corner}Radius`]: g.size },
                    { transform: [{ translateX: dx }, { translateY: dy }] },
                    dragSlice?.i === i && styles.sliceDragging,
                  ]}
                >
                  <View style={{ position: 'absolute', left: -g.left, top: -g.top }}>
                    <PizzaLayers {...layers} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            ref={pizzaRef}
            collapsable={false}
            onLayout={measurePizza}
            accessibilityLabel="Pizza"
            style={[styles.pizzaArea, { width: size, height: size }, pizzaOffset, ovenDrag && styles.pizzaLifted, step === 'baking' && styles.pizzaInOven]}
            {...pizzaResponder.panHandlers}
          >
            <PizzaLayers {...layers} />
            {step === 'trace' && (
              <View style={[styles.canvasHolder, { left: canvasOffset[0], top: canvasOffset[1] }]}>
                <TraceCanvas
                  key={`${index}-${number}`}
                  strokes={strokes}
                  width={canvasWidth}
                  look={SAUCE_LOOK}
                  hintStart={showHint('trace')}
                  onTouch={poke}
                  onHint={traceHint}
                  onComplete={traceDone}
                  label={`Sauce tracing for ${number}`}
                />
              </View>
            )}
            {step === 'slice' && cuts >= 1 && <View pointerEvents="none" style={[styles.cutLine, styles.cutVertical, { left: size / 2 - 2, height: size }]} />}
            {step === 'slice' && cuts >= 2 && <View pointerEvents="none" style={[styles.cutLine, { top: size / 2 - 2, width: size, height: 4 }]} />}
            {showHint('pizza') && <HintArrow direction={hint.direction || 'down'} label={hint.label} style={styles.pizzaHint} />}
          </View>
        )}

        {(step === 'sauce' || step === 'cheese') && (
          <View style={styles.meter} accessibilityLabel={`Covered ${coverPercent} percent`}>
            <View style={[styles.meterFill, { width: `${Math.min(100, (coverPercent / ((step === 'sauce' ? SAUCE_COVERED : CHEESE_COVERED) * 100)) * 100)}%` }, step === 'cheese' && styles.meterCheese]} />
          </View>
        )}

        {step === 'topping' && (
          <View>
            {showHint('toppings') && <HintArrow label={hint.label} style={styles.aboveHint} />}
            <View style={styles.toppingRow}>
              {TOPPINGS.map((item) => (
                <Pressable key={item.id} onPress={() => pickTopping(item)} style={[styles.toppingCard, shadow]} accessibilityLabel={`Topping ${item.name}`}>
                  <Topping topping={item} size={38} />
                  <Text style={styles.toppingLabel} numberOfLines={1}>
                    {CARD_LABELS[item.id]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 'place' && (
          <>
            <View style={styles.countRow}>
              <Text style={styles.count}>
                {placed.length} {topping.emoji || '⚫'}
              </Text>
              {placed.length > 0 && (
                <Pressable onPress={takeOne} style={[styles.takeOff, shadow]} accessibilityLabel="Take one off">
                  <Text style={styles.takeOffText}>➖ Take one off</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.fullWidth}>
              {showHint('tray') && <HintArrow label={hint.label} style={styles.aboveHint} />}
              <DragTray
                emoji={topping.emoji}
                renderItem={topping.emoji ? null : () => <Topping topping={topping} />}
                label={topping.plural}
                targetRef={pizzaRef}
                onDrop={drop}
              />
            </View>
            <View>
              {showHint('done') && <HintArrow label={hint.label} style={styles.aboveHint} />}
              <BigButton label="Done ✓" color={colors.green} onPress={check} style={styles.done} />
            </View>
          </>
        )}

        {(step === 'oven' || step === 'baking') && (
          <View style={styles.ovenSpot}>
            {showHint('oven') && <HintArrow label={hint.label} style={styles.aboveHint} />}
            <View ref={ovenRef} collapsable={false} accessibilityLabel="Oven" style={[styles.ovenBox, step === 'baking' && styles.ovenHot]}>
              <View style={styles.ovenKnobs}>
                <View style={styles.knob} />
                <View style={styles.knob} />
              </View>
              <View style={[styles.ovenWindow, step === 'baking' && styles.ovenWindowHot]}>
                <Text style={styles.ovenWindowText}>{step === 'baking' ? '🍕' : ''}</Text>
              </View>
              <Text style={styles.ovenFlames}>🔥🔥🔥</Text>
            </View>
          </View>
        )}

        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </SafeAreaView>
  );
}

// Short names that fit the small topping cards.
const CARD_LABELS = { olive: 'olives', corn: 'corn', mushroom: 'mushroom', pineapple: 'pineapple' };

const STEP_ORDER = ['dough', 'trace', 'sauce', 'cheese', 'topping', 'place', 'oven', 'baking', 'slice', 'feed', 'done'];
const STATIONS = [
  { id: 'sauce', emoji: '🥫', label: 'Sauce', steps: ['trace', 'sauce'] },
  { id: 'cheese', emoji: '🧀', label: 'Cheese', steps: ['cheese'] },
  { id: 'toppings', emoji: '🍄', label: 'Toppings', steps: ['topping', 'place'] },
];

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
    gap: 8,
  },
  customer: {
    fontSize: 54,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 10,
  },
  bubbleText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.textDark,
  },
  ticket: {
    backgroundColor: '#FFFDF5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5D3B3',
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.gray,
  },
  ticketNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: SAUCE,
    lineHeight: 38,
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
  pizzaArea: {
    userSelect: 'none',
  },
  pizzaLifted: {
    zIndex: 20,
  },
  pizzaInOven: {
    opacity: 0,
  },
  pizzaHint: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    left: 0,
    right: 0,
  },
  aboveHint: {
    position: 'absolute',
    top: -78,
    left: 0,
    right: 0,
  },
  animalHint: {
    position: 'absolute',
    top: 52,
    left: -20,
    width: 100,
  },
  fullWidth: {
    width: '100%',
  },
  stations: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationArrow: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.gray,
    marginHorizontal: 4,
  },
  station: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5D3B3',
    backgroundColor: '#FFFDF7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 72,
  },
  stationActive: {
    borderWidth: 4,
    borderColor: colors.orange,
    backgroundColor: colors.white,
    transform: [{ scale: 1.12 }],
  },
  stationLater: {
    opacity: 0.3,
  },
  stationEmoji: {
    fontSize: 24,
  },
  stationEmojiActive: {
    fontSize: 32,
  },
  stationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gray,
  },
  stationLabelActive: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textDark,
  },
  stationTick: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    backgroundColor: colors.greenDark,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    overflow: 'hidden',
  },
  toppingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  toppingCard: {
    width: 80,
    height: 92,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toppingLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textDark,
  },
  ovenSpot: {
    marginTop: 16,
    alignItems: 'center',
  },
  ovenBox: {
    width: 180,
    height: 130,
    borderRadius: 18,
    backgroundColor: '#5B5552',
    borderWidth: 4,
    borderColor: '#3E3936',
    alignItems: 'center',
    paddingTop: 6,
  },
  ovenHot: {
    borderColor: '#FF7A1A',
  },
  ovenKnobs: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  knob: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C8C2BE',
  },
  ovenWindow: {
    width: 130,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#2A2624',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovenWindowHot: {
    backgroundColor: '#E86A1C',
  },
  ovenWindowText: {
    fontSize: 40,
  },
  ovenFlames: {
    fontSize: 18,
    marginTop: 2,
  },
  crust: {
    position: 'absolute',
    backgroundColor: '#E2B26B',
  },
  crustBaked: {
    backgroundColor: '#C9873A',
  },
  base: {
    position: 'absolute',
    backgroundColor: '#F6DFB0',
  },
  sauceDab: {
    position: 'absolute',
    backgroundColor: SAUCE,
    opacity: 0.92,
  },
  sauceDisc: {
    position: 'absolute',
    backgroundColor: SAUCE,
  },
  shred: {
    position: 'absolute',
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFD84D',
    borderWidth: 1,
    borderColor: '#EDB92E',
  },
  shredBaked: {
    width: 18,
    height: 7,
    backgroundColor: '#FFE38A',
    borderColor: '#F2B441',
  },
  placed: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasHolder: {
    position: 'absolute',
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    maxWidth: 360,
    marginTop: 8,
  },
  card: {
    width: 150,
    height: 120,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textDark,
  },
  meter: {
    width: '70%',
    maxWidth: 260,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginTop: 12,
  },
  meterFill: {
    height: '100%',
    backgroundColor: SAUCE,
  },
  meterCheese: {
    backgroundColor: '#F2C230',
  },
  cutLine: {
    position: 'absolute',
    backgroundColor: 'rgba(70, 40, 20, 0.7)',
  },
  cutVertical: {
    top: 0,
    width: 4,
  },
  slice: {
    position: 'absolute',
    overflow: 'hidden',
  },
  sliceDragging: {
    zIndex: 10,
    opacity: 0.9,
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
    marginTop: 8,
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
    minWidth: 220,
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
