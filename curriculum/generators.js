// One generator per skill. Each returns a question object:
//   { type, prompt, speech, visual, answer, choices }
// - type: 'choice' (tap an answer button) or 'numberLine' (tap a spot on a line)
// - prompt: short text shown on screen
// - speech: what the narrator reads aloud (pre-readers rely on this)
// - visual: optional picture data rendered by QuestionVisual
// - choices: values shown on the answer buttons (answer is always one of them)
// Number-line questions also carry { min, max, tolerance }; a tap within
// `tolerance` of the answer counts as correct.
import { CHOICES_PER_QUESTION } from '../utils/constants';
import { pick, randInt, shuffle } from './random';
import { LITERACY_GENERATORS } from './literacyGenerators';

export { randInt, shuffle };

// Numeric distractors near the answer, clamped to [min, max].
export function buildChoices(answer, { min = 0, max = Infinity, spread = 5, count = CHOICES_PER_QUESTION } = {}) {
  const low = Math.max(min, answer - spread);
  const high = Math.min(max, answer + spread);
  const target = Math.min(count, high - low + 1);
  const choices = new Set([answer]);
  while (choices.size < target) {
    const candidate = answer + (randInt(-spread, spread) || 1);
    if (candidate >= min && candidate <= max) {
      choices.add(candidate);
    }
  }
  return shuffle(Array.from(choices));
}

const OBJECTS = [
  { emoji: '🍎', name: 'apples' },
  { emoji: '⭐', name: 'stars' },
  { emoji: '🐟', name: 'fish' },
  { emoji: '🎈', name: 'balloons' },
  { emoji: '🐞', name: 'ladybugs' },
  { emoji: '🌸', name: 'flowers' },
  { emoji: '🚗', name: 'cars' },
  { emoji: '🍪', name: 'cookies' },
];

const SHAPES = [
  { emoji: '🔴', name: 'circle' },
  { emoji: '🟦', name: 'square' },
  { emoji: '🔺', name: 'triangle' },
  { emoji: '⭐', name: 'star' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '🔷', name: 'diamond' },
];

function countObjects(min, max) {
  return () => {
    const object = pick(OBJECTS);
    const count = randInt(min, max);
    return {
      prompt: 'How many?',
      speech: `How many ${object.name}?`,
      visual: { type: 'objects', emoji: object.emoji, count },
      answer: count,
      choices: buildChoices(count, { min: 1, max: max + 2, spread: 3 }),
    };
  };
}

function findShape() {
  const options = shuffle(SHAPES).slice(0, CHOICES_PER_QUESTION);
  const target = pick(options);
  return {
    prompt: `Find the ${target.name}`,
    speech: `Tap the ${target.name}.`,
    visual: null,
    answer: target.emoji,
    choices: options.map((shape) => shape.emoji),
  };
}

function whichHasMore(max) {
  return () => {
    const object = pick(OBJECTS);
    const a = randInt(1, max - 2);
    const b = randInt(a + 2, max);
    const groups = shuffle([a, b]).map((count) => object.emoji.repeat(count));
    const answer = object.emoji.repeat(b);
    return {
      prompt: 'Which has more?',
      speech: `Which group has more ${object.name}?`,
      visual: null,
      answer,
      choices: groups,
    };
  };
}

function nextNumber(min, max) {
  return () => {
    const start = randInt(min, max - 3);
    const answer = start + 3;
    return {
      prompt: `${start}, ${start + 1}, ${start + 2}, ?`,
      speech: `${start}, ${start + 1}, ${start + 2}. What number comes next?`,
      visual: null,
      answer,
      choices: buildChoices(answer, { min: 0, spread: 3 }),
    };
  };
}

function biggerNumber(max) {
  return () => {
    const a = randInt(0, max);
    let b = randInt(0, max);
    while (b === a) b = randInt(0, max);
    return {
      prompt: 'Which number is bigger?',
      speech: `Which number is bigger, ${a} or ${b}?`,
      visual: null,
      answer: Math.max(a, b),
      choices: [a, b],
    };
  };
}

function addition(maxSum, { minAddend = 0, withPicture = false } = {}) {
  return () => {
    const a = randInt(minAddend, maxSum - minAddend);
    const b = randInt(minAddend, maxSum - a);
    const object = pick(OBJECTS);
    return {
      prompt: `${a} + ${b} = ?`,
      speech: `What is ${a} plus ${b}?`,
      visual: withPicture ? { type: 'sum', emoji: object.emoji, a, b } : null,
      answer: a + b,
      choices: buildChoices(a + b, { min: 0 }),
    };
  };
}

function subtraction(maxStart, { minStart = 0, withPicture = false } = {}) {
  return () => {
    const a = randInt(minStart, maxStart);
    const b = randInt(0, a);
    const object = pick(OBJECTS);
    return {
      prompt: `${a} − ${b} = ?`,
      speech: `What is ${a} minus ${b}?`,
      visual: withPicture ? { type: 'takeAway', emoji: object.emoji, a, b } : null,
      answer: a - b,
      choices: buildChoices(a - b, { min: 0 }),
    };
  };
}

function multiplication(factorsA, factorsB) {
  return () => {
    const a = pick(factorsA);
    const b = pick(factorsB);
    return {
      prompt: `${a} × ${b} = ?`,
      speech: `What is ${a} times ${b}?`,
      visual: null,
      answer: a * b,
      choices: buildChoices(a * b, { min: 0, spread: Math.max(5, a) }),
    };
  };
}

function division(min, max) {
  return () => {
    const divisor = randInt(min, max);
    const quotient = randInt(min, max);
    return {
      prompt: `${divisor * quotient} ÷ ${divisor} = ?`,
      speech: `What is ${divisor * quotient} divided by ${divisor}?`,
      visual: null,
      answer: quotient,
      choices: buildChoices(quotient, { min: 0 }),
    };
  };
}

// Subitizing: dots flash briefly so children "see" the amount without counting.
function quickLook(min, max, layout, flashMs) {
  return () => {
    const count = randInt(min, max);
    return {
      prompt: 'Quick look!',
      speech: 'Quick! How many dots did you see?',
      visual: { type: 'dots', count, layout, flashMs },
      answer: count,
      choices: buildChoices(count, { min: 1, max: max + 1, spread: 2 }),
    };
  };
}

// Number-line estimation: place a number on an empty line.
function numberLine(max, tolerance) {
  return () => {
    const target = randInt(1, max - 1);
    return {
      type: 'numberLine',
      prompt: `Where does ${target} go?`,
      speech: `Tap where ${target} goes on the line.`,
      visual: null,
      answer: target,
      choices: [],
      min: 0,
      max,
      tolerance,
    };
  };
}

function range(min, max) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export const GENERATORS = {
  'count-5': countObjects(1, 5),
  'count-10': countObjects(3, 10),
  shapes: findShape,
  'more-less': whichHasMore(8),
  'quick-look-5': quickLook(1, 5, 'dice', 1500),
  'quick-look-10': quickLook(3, 10, 'tenFrame', 2000),
  'number-line-10': numberLine(10, 1),
  'number-line-100': numberLine(100, 8),
  'number-line-1000': numberLine(1000, 70),
  'next-number': nextNumber(1, 100),
  'bigger-number': biggerNumber(100),
  'add-10': addition(10, { withPicture: true }),
  'sub-10': subtraction(10, { withPicture: true }),
  'add-20': addition(20, { minAddend: 1 }),
  'sub-20': subtraction(20, { minStart: 5 }),
  'add-100': addition(100, { minAddend: 10 }),
  'sub-100': subtraction(99, { minStart: 20 }),
  'mult-2-5-10': multiplication([2, 5, 10], range(1, 10)),
  'mult-10': multiplication(range(1, 10), range(1, 10)),
  'div-10': division(1, 10),
  'mult-12': multiplication(range(5, 12), range(5, 12)),
  'div-12': division(5, 12),
  ...LITERACY_GENERATORS,
};

export function generateQuestion(generatorId) {
  const generator = GENERATORS[generatorId];
  if (!generator) {
    throw new Error(`Unknown generator: ${generatorId}`);
  }
  return { type: 'choice', ...generator() };
}
