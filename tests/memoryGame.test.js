import { content } from '../src/content/index';
import {
  PAIR_COUNT,
  STARTING_CHIPS,
  VARIANTS,
  chipCostToMatch,
  createDeck,
  isStalemate,
  otherPlayer,
  startingChips,
} from '../src/logic/memoryGame';

// Evaluates a face label like "3+4", "12−5", "3×4", "56÷8" or "7".
function evaluate(label) {
  const match = label.match(/^(\d+)([+−×÷])(\d+)$/);
  if (!match) return Number(label);
  const [, a, op, b] = match;
  return { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, '÷': (x, y) => x / y }[op](Number(a), Number(b));
}

function eighths(label) {
  if (!label.includes('/')) return Number(label) * 8;
  const [n, d] = label.split('/').map(Number);
  return (n / d) * 8;
}

const { say } = content('math', 'en');
const { MEMORY_LETTERS } = content('literacy', 'en');

describe.each(Object.keys(VARIANTS))('%s deck', (variantId) => {
  const variant = VARIANTS[variantId];

  it('deals every value 1..pairCount exactly twice, face down, with unique ids', () => {
    const deck = createDeck(variantId, { letters: MEMORY_LETTERS });
    expect(deck).toHaveLength(variant.pairCount * 2);
    const counts = {};
    deck.forEach((card) => {
      expect(card.status).toBe('hidden');
      expect(card.face.label.length).toBeGreaterThan(0);
      expect(say.memory.face(card.face).length).toBeGreaterThan(0);
      counts[card.value] = (counts[card.value] || 0) + 1;
    });
    for (let n = 1; n <= variant.pairCount; n++) expect(counts[n]).toBe(2);
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
  });

  it('starts each player with as many chips as there are pairs', () => {
    expect(startingChips(variantId)).toBe(variant.pairCount);
    expect(startingChips(variantId)).toBeGreaterThanOrEqual(chipCostToMatch(1, variant.pairCount));
  });
});

describe('variant faces', () => {
  const RUNS = 50;

  it('Dot Chips pairs a dot card with a numeral card', () => {
    const deck = createDeck('dots');
    for (let v = 1; v <= VARIANTS.dots.pairCount; v++) {
      const kinds = deck.filter((c) => c.value === v).map((c) => c.face.kind).sort();
      expect(kinds).toEqual(['dots', 'number']);
      expect(deck.find((c) => c.value === v && c.face.kind === 'dots').face.count).toBe(v);
    }
  });

  it.each(['plusMinus', 'timesDivide'])('%s fact cards work out to the card value', (variantId) => {
    for (let i = 0; i < RUNS; i++) {
      createDeck(variantId).forEach((card) => {
        expect(evaluate(card.face.label)).toBe(card.value);
      });
    }
  });

  it('plus/minus and times/divide pairs show one fact and one number', () => {
    ['plusMinus', 'timesDivide'].forEach((variantId) => {
      const deck = createDeck(variantId);
      for (let v = 1; v <= 12; v++) {
        const labels = deck.filter((c) => c.value === v).map((c) => c.face.label);
        expect(labels).toContain(String(v));
        expect(labels.some((l) => l !== String(v))).toBe(true);
      }
    });
  });

  it('Fraction Chips pairs are equivalent fractions worth `value` eighths', () => {
    const deck = createDeck('fractions');
    deck.forEach((card) => expect(eighths(card.face.label)).toBe(card.value));
    for (let v = 1; v <= 8; v++) {
      const labels = deck.filter((c) => c.value === v).map((c) => c.face.label);
      expect(labels[0]).not.toBe(labels[1]);
    }
  });
});

describe('memory game rules', () => {
  it('keeps the classic 12-pair defaults', () => {
    expect(PAIR_COUNT).toBe(12);
    expect(STARTING_CHIPS).toBe(12);
    expect(createDeck()).toHaveLength(24);
  });

  it('chip cost is the gap between the two values, in either order', () => {
    expect(chipCostToMatch(2, 5)).toBe(3);
    expect(chipCostToMatch(5, 2)).toBe(3);
    expect(chipCostToMatch(7, 7)).toBe(0);
  });

  it('alternates players', () => {
    expect(otherPlayer(1)).toBe(2);
    expect(otherPlayer(2)).toBe(1);
  });

  it('asks the gap question using the faces, not the hidden values', () => {
    const low = say.memory.face({ kind: 'plus', label: '3+4', a: 3, b: 4 });
    const high = say.memory.face({ kind: 'number', label: '9', n: 9 });
    expect(say.memory.gap({ low, high })).toBe('How many chips does it take to turn 3 plus 4 into 9?');
    expect(say.memory.face({ kind: 'dots', count: 1, n: 1 })).toBe('1 dot');
    expect(say.memory.face({ kind: 'fraction', top: 3, bottom: 4 })).toBe('3 quarters');
    expect(say.memory.face({ kind: 'letter', letter: 'b' })).toBe('the letter b');
  });
});

describe('isStalemate', () => {
  const hidden = (id, value) => ({ id, value, status: 'hidden' });
  const matched = (id, value) => ({ id, value, status: 'matched' });

  it('is stuck when only an orphaned pair is left and nobody can afford the gap', () => {
    const deck = [matched(0, 1), matched(1, 1), hidden(2, 2), hidden(3, 6)];
    expect(isStalemate(deck, { 1: 3, 2: 1 })).toBe(true);
    expect(isStalemate(deck, { 1: 4, 2: 0 })).toBe(false);
  });

  it('is never stuck while a natural pair remains or the board is cleared', () => {
    expect(isStalemate([hidden(0, 2), hidden(1, 2), hidden(2, 9), hidden(3, 1)], { 1: 0, 2: 0 })).toBe(false);
    expect(isStalemate([matched(0, 2), matched(1, 2)], { 1: 0, 2: 0 })).toBe(false);
  });

  it('uses the smallest gap among the remaining cards', () => {
    const deck = [hidden(0, 1), hidden(1, 3), hidden(2, 8), hidden(3, 12)];
    expect(isStalemate(deck, { 1: 1, 2: 1 })).toBe(true);
    expect(isStalemate(deck, { 1: 2, 2: 0 })).toBe(false);
  });
});
