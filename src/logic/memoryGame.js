// Memory Chips: deck building for every variant + the chip-gap math.
//
// Every card has a numeric `value` (what matching and chip gaps use) and a
// `face` (what the child sees). In Classic Chips both cards of a pair show the
// same number; in the other variants a pair joins two *different-looking*
// faces with the same value (dots <-> numeral, 3+4 <-> 7, 1/4 <-> 2/8), so the
// child has to work out each card's value before working out the gap.

// Their names and the notes shown under a gap question are in
// i18n (curriculum.json games.memory-chips.options, memory.json unitNote).
export const VARIANTS = {
  dots: { id: 'dots', pairCount: 6, guessStyle: 'chips' },
  // The gap is counted in alphabet steps (b -> e is 3 steps).
  letters: { id: 'letters', pairCount: 6, guessStyle: 'chips', helper: 'alphabet', unitNote: true },
  classic: { id: 'classic', pairCount: 12, guessStyle: 'numbers' },
  plusMinus: { id: 'plusMinus', pairCount: 12, guessStyle: 'numbers' },
  timesDivide: { id: 'timesDivide', pairCount: 12, guessStyle: 'numbers' },
  // Counted in eighths.
  fractions: { id: 'fractions', pairCount: 8, guessStyle: 'numbers', unitNote: true },
};
// Pre-readers (guessStyle 'chips') count chips out one by one instead of
// picking a numeral.

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

// A face is what a card shows: `label` is its notation ("3+4", "1/2", "b",
// or an emoji), and `kind` with its numbers says how it is read aloud (the
// math content pack's say.memory.face).
function numberFace(n) {
  return { kind: 'number', label: String(n), n };
}

function dotsFace(n) {
  return { kind: 'dots', count: n, label: String(n), n };
}

function plusMinusFace(value) {
  if (value >= 2 && Math.random() < 0.6) {
    const a = randInt(1, value - 1);
    return { kind: 'plus', label: `${a}+${value - a}`, a, b: value - a };
  }
  const b = randInt(1, 9);
  return { kind: 'minus', label: `${value + b}−${b}`, a: value + b, b };
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
    const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
    return { kind: 'times', label: `${x}×${y}`, a: x, b: y };
  }
  const divisor = randInt(2, 9);
  return { kind: 'divide', label: `${value * divisor}÷${divisor}`, a: value * divisor, b: divisor };
}

// Letter Chips: value = alphabet position (a = 1). One card shows the letter,
// its partner a picture that starts with that letter's sound. The letters and
// pictures come from the literacy content pack (MEMORY_LETTERS):
// { 1: ['a', [['🍎', 'apple'], ...]], ... }.
function letterFaces(value, letters) {
  const [letter, pictures] = letters[value];
  const [emoji, word] = pictures[randInt(0, pictures.length - 1)];
  return [
    { kind: 'letter', label: letter, letter },
    { kind: 'picture', label: emoji, word, picture: true },
  ];
}

// Fraction values are counted in eighths: 1 = 1/8 ... 8 = 8/8.
const FRACTION_FACES = {
  1: [[1, 8], [2, 16]],
  2: [[1, 4], [2, 8]],
  3: [[3, 8], [6, 16]],
  4: [[1, 2], [4, 8]],
  5: [[5, 8], [10, 16]],
  6: [[3, 4], [6, 8]],
  7: [[7, 8], [14, 16]],
  8: [[1, 1], [8, 8]],
};

function fractionFace([top, bottom]) {
  return top === bottom && top === 1 ? { kind: 'whole', label: '1', n: 1 } : { kind: 'fraction', label: `${top}/${bottom}`, top, bottom };
}

export function pairFaces(variantId, value, letters) {
  switch (variantId) {
    case 'dots':
      return [dotsFace(value), numberFace(value)];
    case 'plusMinus':
      return [plusMinusFace(value), numberFace(value)];
    case 'timesDivide':
      return [timesDivideFace(value), numberFace(value)];
    case 'fractions':
      return FRACTION_FACES[value].map((fraction) => fractionFace(fraction));
    case 'letters':
      return letterFaces(value, letters);
    default:
      return [numberFace(value), numberFace(value)];
  }
}

// `letters`: the literacy pack's MEMORY_LETTERS, for Letter Chips.
export function createDeck(variantId = DEFAULT_VARIANT, { letters } = {}) {
  const variant = getVariant(variantId);
  const cards = [];
  for (let value = 1; value <= variant.pairCount; value++) {
    pairFaces(variant.id, value, letters).forEach((face) => cards.push({ value, face }));
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
