import { PAIR_COUNT, STARTING_CHIPS, chipCostToMatch, createDeck, otherPlayer } from '../utils/memoryGame';

describe('memory game', () => {
  it('deals every number 1..PAIR_COUNT exactly twice, face down', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(PAIR_COUNT * 2);
    const counts = {};
    deck.forEach((card) => {
      expect(card.status).toBe('hidden');
      counts[card.value] = (counts[card.value] || 0) + 1;
    });
    for (let n = 1; n <= PAIR_COUNT; n++) expect(counts[n]).toBe(2);
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
  });

  it('chip cost is the gap between the two numbers, in either order', () => {
    expect(chipCostToMatch(2, 5)).toBe(3);
    expect(chipCostToMatch(5, 2)).toBe(3);
    expect(chipCostToMatch(7, 7)).toBe(0);
  });

  it('starting chips cover the biggest possible gap', () => {
    expect(STARTING_CHIPS).toBeGreaterThanOrEqual(chipCostToMatch(1, PAIR_COUNT));
  });

  it('alternates players', () => {
    expect(otherPlayer(1)).toBe(2);
    expect(otherPlayer(2)).toBe(1);
  });
});
