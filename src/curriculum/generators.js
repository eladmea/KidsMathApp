// One generator per skill. Each returns a question object:
//   { type, prompt, speech, visual, answer, choices }
// - type: 'choice' (tap an answer button) or 'numberLine' (tap a spot on a line)
// - prompt: short text shown on screen
// - speech: what the narrator reads aloud (pre-readers rely on this)
// - visual: optional picture data rendered by QuestionVisual
// - choices: values shown on the answer buttons (answer is always one of them)
// Number-line questions also carry { min, max, tolerance }; a tap within
// `tolerance` of the answer counts as correct.
import { CHOICES_PER_QUESTION } from '../logic/constants';
import { pick, randInt, shuffle } from './random';
import { LITERACY_GENERATORS } from './literacyGenerators';
import { SCIENCE_GENERATORS } from './scienceGenerators';
import { LOGIC_GENERATORS } from './logicGenerators';
import { SEL_GENERATORS } from './selGenerators';
import { content } from '../content/index';

export { randInt, shuffle };

// Numeric distractors near the answer, clamped to [min, max]. Near an edge
// the window widens on the other side, so there are always `count` choices
// when the range allows (answer 1 in 1-5 offers 1, 2, 3, 4, not just 1-3).
export function buildChoices(answer, { min = 0, max = Infinity, spread = 5, count = CHOICES_PER_QUESTION } = {}) {
  let reach = spread;
  const windowSize = () => Math.min(max, answer + reach) - Math.max(min, answer - reach) + 1;
  while (windowSize() < count && (answer - reach > min || answer + reach < max)) reach += 1;
  const low = Math.max(min, answer - reach);
  const high = Math.min(max, answer + reach);
  const others = [];
  for (let value = low; value <= high; value++) if (value !== answer) others.push(value);
  return shuffle([answer, ...shuffle(others).slice(0, count - 1)]);
}

// The words for every math question come from the language's math pack
// (src/content/<language>/math.js): things to count, shapes, and `say`.
const math = () => content('math');

function countObjects(min, max) {
  return () => {
    const { OBJECTS, say } = math();
    const object = pick(OBJECTS);
    const count = randInt(min, max);
    return {
      prompt: say.count.prompt(),
      speech: say.count.speech({ object }),
      visual: { type: 'objects', emoji: object.emoji, count },
      answer: count,
      explain: say.count.explain({ object, count }),
      choices: buildChoices(count, { min: 1, max: max + 2, spread: 3 }),
    };
  };
}

function findShape() {
  const { SHAPES, say } = math();
  const options = shuffle(SHAPES).slice(0, CHOICES_PER_QUESTION);
  const shape = pick(options);
  return {
    prompt: say.shape.prompt({ shape }),
    speech: say.shape.speech({ shape }),
    visual: null,
    answer: shape.emoji,
    explain: say.shape.explain({ shape }),
    choices: options.map((option) => option.emoji),
  };
}

function whichHasMore(max) {
  return () => {
    const { OBJECTS, say } = math();
    const object = pick(OBJECTS);
    const a = randInt(1, max - 2);
    const b = randInt(a + 2, max);
    const groups = shuffle([a, b]).map((count) => object.emoji.repeat(count));
    return {
      prompt: say.more.prompt(),
      speech: say.more.speech({ object }),
      visual: null,
      answer: object.emoji.repeat(b),
      explain: say.more.explain({ object, more: b, less: a }),
      choices: groups,
    };
  };
}

// Number sequences that go up or down by a steady step. Shown as a staircase
// (see QuestionVisual 'sequence') so the direction is visible at a glance.
function numberSequence(steps, max) {
  return () => {
    const { say } = math();
    const step = pick(steps);
    const direction = Math.random() < 0.5 ? 'up' : 'down';
    const delta = direction === 'up' ? step : -step;
    const span = step * 3;
    const first = direction === 'up' ? randInt(0, max - span) : randInt(span, max);
    const numbers = [first, first + delta, first + 2 * delta];
    const answer = first + 3 * delta;
    // Typical slips: skipping a step, repeating the last number, off by one.
    const slips = [answer + delta, numbers[2], answer + 1, answer - 1, answer + 2, answer - 2];
    let distractors = [...new Set(slips)].filter((c) => c >= 0 && c !== answer).slice(0, CHOICES_PER_QUESTION - 1);
    // Counting down to 0 rules out most slips; fill up with nearby numbers.
    if (distractors.length < CHOICES_PER_QUESTION - 1) {
      const nearby = buildChoices(answer, { min: 0, spread: 2 }).filter((c) => c !== answer && !distractors.includes(c));
      distractors = [...distractors, ...nearby].slice(0, CHOICES_PER_QUESTION - 1);
    }
    return {
      prompt: say.sequence.prompt(),
      speech: say.sequence.speech({ numbers }),
      visual: { type: 'sequence', numbers, direction, step },
      answer,
      choices: shuffle([answer, ...distractors]),
      explain: say.sequence.explain({ direction, step, last: numbers[2], answer }),
    };
  };
}

function biggerNumber(max) {
  return () => {
    const { say } = math();
    const a = randInt(0, max);
    let b = randInt(0, max);
    while (b === a) b = randInt(0, max);
    return {
      prompt: say.bigger.prompt(),
      speech: say.bigger.speech({ a, b }),
      visual: null,
      answer: Math.max(a, b),
      explain: say.bigger.explain({ bigger: Math.max(a, b), smaller: Math.min(a, b) }),
      choices: [a, b],
    };
  };
}

function addition(maxSum, { minAddend = 0, withPicture = false } = {}) {
  return () => {
    const { OBJECTS, say } = math();
    const a = randInt(minAddend, maxSum - minAddend);
    const b = randInt(minAddend, maxSum - a);
    const object = pick(OBJECTS);
    return {
      prompt: `${a} + ${b} = ?`,
      speech: say.add.speech({ a, b }),
      visual: withPicture ? { type: 'sum', emoji: object.emoji, a, b } : null,
      answer: a + b,
      explain: say.add.explain({ a, b, sum: a + b }),
      choices: buildChoices(a + b, { min: 0 }),
    };
  };
}

function subtraction(maxStart, { minStart = 0, withPicture = false } = {}) {
  return () => {
    const { OBJECTS, say } = math();
    const a = randInt(minStart, maxStart);
    const b = randInt(0, a);
    const object = pick(OBJECTS);
    return {
      prompt: `${a} − ${b} = ?`,
      speech: say.subtract.speech({ a, b }),
      visual: withPicture ? { type: 'takeAway', emoji: object.emoji, a, b } : null,
      answer: a - b,
      explain: say.subtract.explain({ a, b, left: a - b }),
      choices: buildChoices(a - b, { min: 0 }),
    };
  };
}

function multiplication(factorsA, factorsB) {
  return () => {
    const { say } = math();
    const a = pick(factorsA);
    const b = pick(factorsB);
    return {
      prompt: `${a} × ${b} = ?`,
      speech: say.multiply.speech({ a, b }),
      visual: null,
      answer: a * b,
      explain: say.multiply.explain({ a, b, product: a * b }),
      choices: buildChoices(a * b, { min: 0, spread: Math.max(5, a) }),
    };
  };
}

function division(min, max) {
  return () => {
    const { say } = math();
    const divisor = randInt(min, max);
    const quotient = randInt(min, max);
    const total = divisor * quotient;
    return {
      prompt: `${total} ÷ ${divisor} = ?`,
      speech: say.divide.speech({ total, divisor }),
      visual: null,
      answer: quotient,
      explain: say.divide.explain({ total, divisor, quotient }),
      choices: buildChoices(quotient, { min: 0 }),
    };
  };
}

// Subitizing: dots flash briefly so children "see" the amount without counting.
// `choiceMax` caps the answer buttons (3-4 year olds only ever see 1-5).
function quickLook(min, max, layout, flashMs, { choiceMax = max + 1, small = false } = {}) {
  return () => {
    const { say } = math();
    const count = randInt(min, max);
    return {
      prompt: say.quickLook.prompt(),
      speech: small ? say.quickLook.speechSmall() : say.quickLook.speech(),
      visual: { type: 'dots', count, layout, flashMs },
      answer: count,
      explain: say.quickLook.explain({ count }),
      choices: buildChoices(count, { min: 1, max: choiceMax, spread: 2 }),
    };
  };
}

// Number-line estimation: place a number on an empty line.
function numberLine(max, tolerance) {
  return () => {
    const { say } = math();
    const target = randInt(1, max - 1);
    return {
      type: 'numberLine',
      prompt: say.numberLine.prompt({ target }),
      speech: say.numberLine.speech({ target }),
      visual: null,
      answer: target,
      explain: say.numberLine.explain({ target, max }),
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

const MATH_GENERATORS = {
  'count-5': countObjects(1, 5),
  'count-10': countObjects(3, 10),
  shapes: findShape,
  'more-less': whichHasMore(8),
  // Ages 3-4: up to 5 dots, shown longer. Ten frames up to 10 come in 5-6.
  'quick-look-5': quickLook(1, 5, 'dice', 2500, { choiceMax: 5, small: true }),
  'quick-look-10': quickLook(3, 10, 'tenFrame', 2000),
  'number-line-10': numberLine(10, 1),
  'number-line-100': numberLine(100, 8),
  'number-line-1000': numberLine(1000, 70),
  'next-number': numberSequence([1], 30),
  'skip-count': numberSequence([2, 5, 10], 100),
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
};

// Generators by content pack (src/content/<language>/<pack>.js).
const BY_PACK = {
  math: MATH_GENERATORS,
  literacy: LITERACY_GENERATORS,
  science: SCIENCE_GENERATORS,
  logic: LOGIC_GENERATORS,
  sel: SEL_GENERATORS,
};

export const GENERATORS = Object.assign({}, ...Object.values(BY_PACK));

// The content pack a generator's words come from.
export const GENERATOR_PACK = Object.fromEntries(
  Object.entries(BY_PACK).flatMap(([pack, generators]) => Object.keys(generators).map((id) => [id, pack]))
);

// A question in the current language. A language's pack can replace any
// generator with its own (`generators` in the pack).
export function generateQuestion(generatorId) {
  const pack = GENERATOR_PACK[generatorId];
  if (!pack) {
    throw new Error(`Unknown generator: ${generatorId}`);
  }
  const generator = (content(pack).generators || {})[generatorId] || GENERATORS[generatorId];
  return { type: 'choice', ...generator() };
}
