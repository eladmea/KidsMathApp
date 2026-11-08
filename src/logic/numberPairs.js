// Number Pairs: a memory game. Cards lie face down; turn two over and keep
// them if they show the same number in two ways: dots and a numeral (ages
// 3-6), or a numeral and its word (ages 7-8). Played alone on Number Island,
// or against the buddy or a friend from the Games list.

// Per level: how many pairs, which numbers, the two faces of a pair, and how
// long every card is shown face up before the game starts (a head start for
// the youngest).
export const LEVELS = {
  dots5: { pairs: 4, min: 1, max: 5, faces: ['dots', 'numeral'], peekMs: 3000 },
  dots10: { pairs: 6, min: 1, max: 10, faces: ['dots', 'numeral'], peekMs: 2000 },
  words: { pairs: 8, min: 0, max: 20, faces: ['numeral', 'word'], peekMs: 0 },
};

export function getLevel(levelId) {
  return LEVELS[levelId] || LEVELS.dots5;
}

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The shuffled cards: { id, value, face: 'dots' | 'numeral' | 'word',
// status: 'hidden' }. `status` is what the buddy (logic/memoryBuddy.js)
// looks at: 'hidden', 'up' or 'matched'.
export function makeDeck(levelId, rng = Math.random) {
  const level = getLevel(levelId);
  const numbers = Array.from({ length: level.max - level.min + 1 }, (_, i) => level.min + i);
  const values = shuffle(numbers, rng).slice(0, level.pairs);
  const cards = values.flatMap((value) => level.faces.map((face) => ({ value, face })));
  return shuffle(cards, rng).map((card, id) => ({ ...card, id, status: 'hidden' }));
}

export const isMatch = (a, b) => a.id !== b.id && a.value === b.value;

// A memory slip: the partner of the first card was already seen (so it could
// have been found), yet the second card isn't it. Turning over cards nobody
// has seen yet is never a slip.
export function isSlip(first, second, seenIds, deck) {
  if (isMatch(first, second)) return false;
  const partner = deck.find((card) => card.id !== first.id && card.value === first.value);
  return Boolean(partner && seenIds.has(partner.id));
}

// Solo score: a point per pair, less one for each slip (never below 0).
export const soloScore = (pairs, slips) => Math.max(0, pairs - slips);

// Two players: who wins, by pairs found (0 for a tie).
export function winner(pairsByPlayer) {
  if (pairsByPlayer[1] === pairsByPlayer[2]) return 0;
  return pairsByPlayer[1] > pairsByPlayer[2] ? 1 : 2;
}
