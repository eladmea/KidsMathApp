export const PAIR_COUNT = 8;
export const STARTING_CHIPS = 10;
const MAX_COST = PAIR_COUNT - 1;

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

export function createDeck() {
  const values = [];
  for (let n = 1; n <= PAIR_COUNT; n++) {
    values.push(n, n);
  }
  return shuffle(values).map((value, index) => ({
    id: index,
    value,
    status: 'hidden',
  }));
}

export function otherPlayer(player) {
  return player === 1 ? 2 : 1;
}

export function chipCostToMatch(valueA, valueB) {
  return Math.abs(valueA - valueB);
}

export function buildChipCostChoices(cost) {
  const choices = new Set([cost]);
  while (choices.size < 4) {
    const offset = randInt(-3, 3) || 1;
    const candidate = cost + offset;
    if (candidate >= 1 && candidate <= MAX_COST && !choices.has(candidate)) {
      choices.add(candidate);
    }
  }
  return shuffle(Array.from(choices));
}
