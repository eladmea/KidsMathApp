// Memory Chips: deck building for every variant + the chip-gap math.
//
// Every card has a numeric `value` (what matching and chip gaps use) and a
// `face` (what the child sees). In Classic Chips both cards of a pair show the
// same number; in the other variants a pair joins two *different-looking*
// faces with the same value (dots <-> numeral, 3+4 <-> 7, 1/4 <-> 2/8), so the
// child has to work out each card's value before working out the gap.

export const VARIANTS = {
  dots: {
    id: 'dots',
    title: 'Dot Chips',
    emoji: '🎲',
    description: 'Match dots to numbers',
    pairCount: 6,
    // Pre-readers count chips out one by one instead of picking a numeral.
    guessStyle: 'chips',
    unitNote: null,
  },
  classic: {
    id: 'classic',
    title: 'Classic Chips',
    emoji: '🔢',
    description: 'Match numbers 1-12',
    pairCount: 12,
    guessStyle: 'numbers',
    unitNote: null,
  },
  plusMinus: {
    id: 'plusMinus',
    title: 'Plus & Minus Chips',
    emoji: '➕',
    description: 'Match 3 + 4 to 7',
    pairCount: 12,
    guessStyle: 'numbers',
    unitNote: null,
  },
  timesDivide: {
    id: 'timesDivide',
    title: 'Times & Divide Chips',
    emoji: '✖️',
    description: 'Match 3 × 4 to 12',
    pairCount: 12,
    guessStyle: 'numbers',
    unitNote: null,
  },
  fractions: {
    id: 'fractions',
    title: 'Fraction Chips',
    emoji: '🍕',
    description: 'Match 1/2 to 4/8',
    pairCount: 8,
    guessStyle: 'numbers',
    unitNote: 'Each chip is one eighth (1/8).',
  },
};

export const DEFAULT_VARIANT = 'classic';

// Kept for the original 12-pair game.
export const PAIR_COUNT = VARIANTS.classic.pairCount;
export const STARTING_CHIPS = PAIR_COUNT;

// Each player starts with as many chips as there are pairs, so bigger boards
// mean a bigger bonus-chip pool and the largest gap is always affordable.
export function startingChips(variantId = DEFAULT_VARIANT) {
  return getVariant(variantId).pairCount;
}

export function getVariant(variantId) {
  return VARIANTS[variantId] || VARIANTS[DEFAULT_VARIANT];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function numberFace(n) {
  return { kind: 'number', label: String(n), speech: String(n) };
}

function dotsFace(n) {
  return { kind: 'dots', count: n, label: String(n), speech: n === 1 ? '1 dot' : `${n} dots` };
}

function textFace(label, speech) {
  return { kind: 'text', label, speech };
}

function plusMinusFace(value) {
  if (value >= 2 && Math.random() < 0.6) {
    const a = randInt(1, value - 1);
    return textFace(`${a}+${value - a}`, `${a} plus ${value - a}`);
  }
  const b = randInt(1, 9);
  return textFace(`${value + b}−${b}`, `${value + b} minus ${b}`);
}

function factorPairs(n) {
  const pairs = [];
  for (let a = 2; a * a <= n; a++) {
    if (n % a === 0) pairs.push([a, n / a]);
  }
  return pairs;
}

function timesDivideFace(value) {
  const pairs = factorPairs(value);
  if (pairs.length && Math.random() < 0.5) {
    const [a, b] = pairs[randInt(0, pairs.length - 1)];
    return Math.random() < 0.5 ? textFace(`${a}×${b}`, `${a} times ${b}`) : textFace(`${b}×${a}`, `${b} times ${a}`);
  }
  const divisor = randInt(2, 9);
  return textFace(`${value * divisor}÷${divisor}`, `${value * divisor} divided by ${divisor}`);
}

// Fraction values are counted in eighths: 1 = 1/8 ... 8 = 8/8.
const FRACTION_FACES = {
  1: [['1/8', '1 eighth'], ['2/16', '2 sixteenths']],
  2: [['1/4', '1 quarter'], ['2/8', '2 eighths']],
  3: [['3/8', '3 eighths'], ['6/16', '6 sixteenths']],
  4: [['1/2', '1 half'], ['4/8', '4 eighths']],
  5: [['5/8', '5 eighths'], ['10/16', '10 sixteenths']],
  6: [['3/4', '3 quarters'], ['6/8', '6 eighths']],
  7: [['7/8', '7 eighths'], ['14/16', '14 sixteenths']],
  8: [['1', '1 whole'], ['8/8', '8 eighths']],
};

export function pairFaces(variantId, value) {
  switch (variantId) {
    case 'dots':
      return [dotsFace(value), numberFace(value)];
    case 'plusMinus':
      return [plusMinusFace(value), numberFace(value)];
    case 'timesDivide':
      return [timesDivideFace(value), numberFace(value)];
    case 'fractions':
      return FRACTION_FACES[value].map(([label, speech]) => textFace(label, speech));
    default:
      return [numberFace(value), numberFace(value)];
  }
}

export function createDeck(variantId = DEFAULT_VARIANT) {
  const variant = getVariant(variantId);
  const cards = [];
  for (let value = 1; value <= variant.pairCount; value++) {
    pairFaces(variant.id, value).forEach((face) => cards.push({ value, face }));
  }
  return shuffle(cards).map((card, index) => ({ ...card, id: index, status: 'hidden' }));
}

export function otherPlayer(player) {
  return player === 1 ? 2 : 1;
}

export function chipCostToMatch(valueA, valueB) {
  return Math.abs(valueA - valueB);
}

// True when the game can never finish: no natural pair is left among the
// face-down cards and neither player has enough chips to close any gap.
// (Wrong guesses burn chips, so this can happen with an orphaned pair.)
export function isStalemate(deck, chips) {
  const remaining = deck.filter((card) => card.status !== 'matched');
  if (remaining.length === 0) return false;
  let smallestGap = Infinity;
  for (let i = 0; i < remaining.length; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      const gap = chipCostToMatch(remaining[i].value, remaining[j].value);
      if (gap === 0) return false;
      smallestGap = Math.min(smallestGap, gap);
    }
  }
  return Object.values(chips).every((count) => count < smallestGap);
}

// The question asked on a mismatch, for the narrator.
export function gapQuestionSpeech(lowFace, highFace) {
  return `How many chips does it take to turn ${lowFace.speech} into ${highFace.speech}?`;
}
