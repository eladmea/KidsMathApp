import { LEVELS, isMatch, isSlip, makeDeck, soloScore, winner } from '../src/logic/numberPairs';
import { NUMBER_WORDS as en } from '../src/content/en/math';
import { NUMBER_WORDS as he } from '../src/content/he/math';
import { chooseFirstCard, chooseSecondCard } from '../src/logic/memoryBuddy';

describe('Number Pairs', () => {
  it('deals each number once in each of its two faces', () => {
    Object.entries(LEVELS).forEach(([id, level]) => {
      for (let n = 0; n < 50; n++) {
        const deck = makeDeck(id);
        expect(deck).toHaveLength(level.pairs * 2);
        const values = [...new Set(deck.map((c) => c.value))];
        expect(values).toHaveLength(level.pairs);
        values.forEach((value) => {
          const pair = deck.filter((c) => c.value === value);
          expect(pair.map((c) => c.face).sort()).toEqual([...level.faces].sort());
          expect(value >= level.min && value <= level.max).toBe(true);
        });
        expect(deck.every((c) => c.status === 'hidden')).toBe(true);
      }
    });
  });

  it('has a word for every number the words level deals, in both languages', () => {
    for (let n = LEVELS.words.min; n <= LEVELS.words.max; n++) {
      expect(en[n]).toBeTruthy();
      expect(he[n]).toBeTruthy();
    }
  });

  it('matches two cards of the same number', () => {
    const a = { id: 0, value: 3 };
    expect(isMatch(a, { id: 1, value: 3 })).toBe(true);
    expect(isMatch(a, { id: 1, value: 4 })).toBe(false);
    expect(isMatch(a, a)).toBe(false);
  });

  it('counts a slip only when the partner had been seen', () => {
    const deck = [{ id: 0, value: 3 }, { id: 1, value: 3 }, { id: 2, value: 5 }, { id: 3, value: 5 }];
    expect(isSlip(deck[0], deck[2], new Set(), deck)).toBe(false);
    expect(isSlip(deck[0], deck[2], new Set([1]), deck)).toBe(true);
    expect(isSlip(deck[0], deck[1], new Set([1]), deck)).toBe(false);
    expect(soloScore(4, 1)).toBe(3);
    expect(soloScore(4, 9)).toBe(0);
  });

  it('picks the winner by pairs', () => {
    expect(winner({ 1: 3, 2: 1 })).toBe(1);
    expect(winner({ 1: 1, 2: 3 })).toBe(2);
    expect(winner({ 1: 2, 2: 2 })).toBe(0);
  });

  it("works with the Memory Chips buddy's card choices", () => {
    const deck = makeDeck('dots5');
    const memory = { [deck[0].id]: deck[0].value };
    const partner = deck.find((c) => c.id !== deck[0].id && c.value === deck[0].value);
    memory[partner.id] = partner.value;
    const first = chooseFirstCard(deck, memory);
    expect(first.value).toBe(deck[0].value);
    expect(chooseSecondCard(deck, memory, first).value).toBe(first.value);
  });
});
