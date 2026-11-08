// Balance Scale: blocks weigh as much as their number. The left pan is set;
// the child puts blocks from the tray on the right pan until the beam is
// level. Ages 7-8 make a sum (8 = 3 + 5, then up to 20). Ages 9-10 find the
// one block that balances equal groups (three 4s = 12), then the missing
// block (9 + 6 = 5 + ?): equality as balance, the step before algebra.

export const LEVELS = {
  sum: { puzzles: 6 },
  times: { puzzles: 6 },
};

export function getLevel(levelId) {
  return LEVELS[levelId] || LEVELS.sum;
}

const randInt = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// `size` different numbers from min..max, none in `avoid`.
function distinct(size, min, max, avoid, rng) {
  const pool = shuffle(Array.from({ length: max - min + 1 }, (_, i) => min + i).filter((n) => !avoid.includes(n)), rng);
  return pool.slice(0, size);
}

// Splits `total` into `parts` different numbers from 1..10.
function split(total, parts, rng) {
  for (let tries = 0; tries < 200; tries++) {
    const pieces = [];
    let left = total;
    for (let p = parts; p > 1; p--) {
      const piece = randInt(1, Math.min(10, left - (p - 1)), rng);
      pieces.push(piece);
      left -= piece;
    }
    pieces.push(left);
    if (left >= 1 && left <= 10 && new Set(pieces).size === parts) return pieces;
  }
  return null;
}

// Puzzle `index` (0-based) of a round:
//   { left: [weights], fixed: [weights already on the right], tray: [weights], answer: [weights] }
export function makePuzzle(levelId, index, rng = Math.random) {
  return levelId === 'times' ? timesPuzzle(index, rng) : sumPuzzle(index, rng);
}

function sumPuzzle(index, rng) {
  // 6-10 from two blocks, then 11-20 from two, then from three.
  const parts = index < 4 ? 2 : 3;
  let target;
  let answer = null;
  while (!answer) {
    target = index < 2 ? randInt(6, 10, rng) : randInt(11, parts === 3 ? 20 : 18, rng);
    answer = split(target, parts, rng);
  }
  const others = distinct(5 - parts, 1, 10, answer, rng);
  return { left: [target], fixed: [], tray: shuffle([...answer, ...others], rng), answer };
}

function timesPuzzle(index, rng) {
  if (index < 3) {
    // Equal groups on the left; one block on the tray weighs the same.
    const groups = randInt(2, 4, rng);
    const size = randInt(2, 6, rng);
    const product = groups * size;
    const near = [product + size, product - size, product + 1, product - 1].filter((n) => n > 0 && n !== product);
    const tray = shuffle([product, ...shuffle([...new Set(near)], rng).slice(0, 3)], rng);
    return { left: Array(groups).fill(size), fixed: [], tray, answer: [product] };
  }
  // a + b on the left, c + ? on the right.
  const a = randInt(4, 12, rng);
  const b = randInt(4, 12, rng);
  const c = randInt(2, a + b - 2, rng);
  const missing = a + b - c;
  const near = [missing + 1, missing - 1, missing + 2, missing - 2, c].filter((n) => n > 0 && n !== missing);
  const tray = shuffle([missing, ...shuffle([...new Set(near)], rng).slice(0, 3)], rng);
  return { left: [a, b], fixed: [c], tray, answer: [missing] };
}

export const total = (weights) => weights.reduce((sum, w) => sum + w, 0);

// The beam's angle in degrees: 0 when level, tipping down towards the
// heavier side (positive: the right side down), more for a bigger
// difference, never more than MAX_TILT.
export const MAX_TILT = 12;
export function tilt(left, right) {
  const difference = total(right) - total(left);
  if (difference === 0) return 0;
  return Math.sign(difference) * Math.min(MAX_TILT, 3 + Math.abs(difference) * 1.2);
}

export const isBalanced = (left, right) => total(left) === total(right);

// Is the right side already heavier (a block has to come off)?
export const isTooHeavy = (left, right) => total(right) > total(left);
