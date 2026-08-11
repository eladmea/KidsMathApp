export const PAIR_COUNT = 12;
export const STARTING_CHIPS = PAIR_COUNT;

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
