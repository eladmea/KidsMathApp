// The solo-mode AI buddy for the memory games (Memory Chips, Number Pairs).
// It plays like a child, so young players can beat it:
// - it remembers only some of the cards it sees (recall),
// - it holds only the last few of those (span): older ones fade,
// - even when it knows where a partner is, it sometimes turns over the wrong
//   card (slip), and slips more while it is ahead (see buddySlip),
// - in Memory Chips it sometimes gets the chip gap wrong (accuracy, attempt).
// All functions are pure (rng injectable).

// How well the buddy plays, by the child's age band.
export const BUDDY_LEVELS = {
  sprouts: { recall: 0.25, span: 2, slip: 0.4, accuracy: 0.6, attempt: 0.6 },
  explorers: { recall: 0.4, span: 3, slip: 0.25, accuracy: 0.7, attempt: 0.7 },
  builders: { recall: 0.5, span: 4, slip: 0.2, accuracy: 0.8, attempt: 0.75 },
  masters: { recall: 0.6, span: 5, slip: 0.15, accuracy: 0.85, attempt: 0.8 },
};

// How much more often it slips while it has more pairs than the child.
export const AHEAD_SLIP = 0.25;

export function buddyLevel(bandId) {
  return BUDDY_LEVELS[bandId] || BUDDY_LEVELS.explorers;
}

// The chance of a slip this turn: more when the buddy is winning, so the
// game stays close.
export function buddySlip(level, buddyPairs, childPairs) {
  return Math.min(0.8, level.slip + (buddyPairs > childPairs ? AHEAD_SLIP : 0));
}

function pickRandom(array, rng) {
  return array[Math.floor(rng() * array.length)];
}

// memory: [{ id, value }], oldest first: the cards the buddy remembers.
// Seeing a card again (and remembering it) makes it the newest; past `span`
// cards, the oldest is forgotten.
export function observeCard(memory, card, { recall, span = Infinity }, rng = Math.random) {
  if (rng() >= recall) return memory;
  return [...memory.filter((m) => m.id !== card.id), { id: card.id, value: card.value }].slice(-span);
}

export function forgetCards(memory, cardIds) {
  return memory.filter((m) => !cardIds.includes(m.id));
}

// The remembered value of a card, or undefined.
const recalled = (memory, id) => memory.find((m) => m.id === id)?.value;
const remembers = (memory, id) => memory.some((m) => m.id === id);

function hiddenCards(deck) {
  return deck.filter((card) => card.status === 'hidden');
}

function knownHidden(deck, memory) {
  return hiddenCards(deck).filter((card) => remembers(memory, card.id));
}

// First flip: a card from a remembered pair if there is one, otherwise a card
// it hasn't seen (to learn something), otherwise anything.
export function chooseFirstCard(deck, memory, rng = Math.random) {
  const known = knownHidden(deck, memory);
  for (const card of known) {
    if (known.some((other) => other.id !== card.id && recalled(memory, other.id) === recalled(memory, card.id))) {
      return card;
    }
  }
  const unseen = hiddenCards(deck).filter((card) => !remembers(memory, card.id));
  return pickRandom(unseen.length ? unseen : hiddenCards(deck), rng);
}

// Second flip: the remembered partner of the first card if it knows one,
// unless it slips (then any other card). Otherwise a card it hasn't seen.
export function chooseSecondCard(deck, memory, firstCard, rng = Math.random, slip = 0) {
  const others = hiddenCards(deck).filter((card) => card.id !== firstCard.id);
  const partner = others.find((card) => recalled(memory, card.id) === firstCard.value);
  if (partner && (others.length === 1 || rng() >= slip)) return partner;
  const candidates = others.filter((card) => card !== partner);
  const unseen = candidates.filter((card) => !remembers(memory, card.id));
  return pickRandom(unseen.length ? unseen : candidates, rng);
}

// Decide what to do with a mismatch: a chip guess (number) or null to skip.
export function decideGap({ cost, chipsAvailable, accuracy, attempt }, rng = Math.random) {
  if (chipsAvailable < cost || rng() >= attempt) return null;
  if (rng() < accuracy || chipsAvailable === 1) return cost;
  const wrong = Array.from({ length: chipsAvailable }, (_, i) => i + 1).filter((n) => n !== cost);
  return pickRandom(wrong, rng);
}
