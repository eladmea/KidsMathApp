// The solo-mode AI buddy for Memory Chips. It's deliberately imperfect: it
// only remembers some of the cards it sees, and sometimes gets the chip gap
// wrong, so young players can beat it. All functions are pure (rng injectable).

// How well the buddy plays, by the child's age band.
export const BUDDY_LEVELS = {
  sprouts: { recall: 0.35, accuracy: 0.6, attempt: 0.6 },
  explorers: { recall: 0.45, accuracy: 0.7, attempt: 0.7 },
  builders: { recall: 0.55, accuracy: 0.8, attempt: 0.75 },
  masters: { recall: 0.65, accuracy: 0.85, attempt: 0.8 },
};

export function buddyLevel(bandId) {
  return BUDDY_LEVELS[bandId] || BUDDY_LEVELS.explorers;
}

function pickRandom(array, rng) {
  return array[Math.floor(rng() * array.length)];
}

// memory: { [cardId]: value } — the cards the buddy currently remembers.
export function observeCard(memory, card, recall, rng = Math.random) {
  if (card.id in memory || rng() >= recall) return memory;
  return { ...memory, [card.id]: card.value };
}

export function forgetCards(memory, cardIds) {
  const next = { ...memory };
  cardIds.forEach((id) => delete next[id]);
  return next;
}

function hiddenCards(deck) {
  return deck.filter((card) => card.status === 'hidden');
}

function knownHidden(deck, memory) {
  return hiddenCards(deck).filter((card) => card.id in memory);
}

// First flip: a card from a remembered pair if there is one, otherwise a card
// it hasn't seen (to learn something), otherwise anything.
export function chooseFirstCard(deck, memory, rng = Math.random) {
  const known = knownHidden(deck, memory);
  for (const card of known) {
    if (known.some((other) => other.id !== card.id && memory[other.id] === memory[card.id])) {
      return card;
    }
  }
  const unseen = hiddenCards(deck).filter((card) => !(card.id in memory));
  return pickRandom(unseen.length ? unseen : hiddenCards(deck), rng);
}

// Second flip: the remembered partner of the first card if it knows one.
export function chooseSecondCard(deck, memory, firstCard, rng = Math.random) {
  const others = hiddenCards(deck).filter((card) => card.id !== firstCard.id);
  const partner = others.find((card) => card.id in memory && memory[card.id] === firstCard.value);
  if (partner) return partner;
  const unseen = others.filter((card) => !(card.id in memory));
  return pickRandom(unseen.length ? unseen : others, rng);
}

// Decide what to do with a mismatch: a chip guess (number) or null to skip.
export function decideGap({ cost, chipsAvailable, accuracy, attempt }, rng = Math.random) {
  if (chipsAvailable < cost || rng() >= attempt) return null;
  if (rng() < accuracy || chipsAvailable === 1) return cost;
  const wrong = Array.from({ length: chipsAvailable }, (_, i) => i + 1).filter((n) => n !== cost);
  return pickRandom(wrong, rng);
}
