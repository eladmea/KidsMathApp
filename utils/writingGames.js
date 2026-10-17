// Rules for the age 3-4 writing games (Pizza Shop, Birthday Cake, Race
// Track, Bee Paths). Each pairs tracing a number with counting it, so the
// written digit is tied to its amount.

// Each pizza has many steps (dough to eating), so 2 make a round.
export const PIZZAS_PER_ROUND = 2;
export const CAKES_PER_ROUND = 3;
export const ROADS_PER_ROUND = 5;
export const MAX_ON_TRAY_TARGET = 12;

// Pizza toppings. Olives are drawn as slices (rings), not whole olives, so
// they have no emoji.
export const TOPPINGS = [
  { id: 'olive', emoji: null, name: 'olive slice', plural: 'olive slices' },
  { id: 'corn', emoji: '🌽', name: 'corn', plural: 'corn' },
  { id: 'mushroom', emoji: '🍄', name: 'mushroom', plural: 'mushrooms' },
  { id: 'pineapple', emoji: '🍍', name: 'pineapple', plural: 'pineapples' },
];

export const CUSTOMERS = [
  { emoji: '🐻', name: 'Bear' },
  { emoji: '🐰', name: 'Bunny' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🐸', name: 'Frog' },
  { emoji: '🐵', name: 'Monkey' },
  { emoji: '🦁', name: 'Lion' },
  { emoji: '🐷', name: 'Pig' },
];

export const VEHICLES = ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚜', '🛵'];

export function word(count, item) {
  return count === 1 ? item.name : item.plural;
}

// Checking a pile of toppings or candles against the number.
// 'right' | 'more' (needs more) | 'fewer' (too many)
export function checkCount(placed, target) {
  if (placed === target) return 'right';
  return placed < target ? 'more' : 'fewer';
}

// A drop lands on a round target (pizza, cake top) if it's inside the circle.
// x, y are relative to the target's top-left; size is its diameter.
export function insideCircle(x, y, size, margin = 0.08) {
  const r = size / 2;
  return Math.hypot(x - r, y - r) <= r * (1 - margin);
}

// Where a topping sits: inside the circle, never right off the edge.
export function clampToCircle(x, y, size, margin = 0.16) {
  const r = size / 2;
  const dx = x - r;
  const dy = y - r;
  const distance = Math.hypot(dx, dy);
  const limit = r * (1 - margin);
  if (distance <= limit) return [x, y];
  return [r + (dx / distance) * limit, r + (dy / distance) * limit];
}

// Blowing out candles counts down: 4, 3, 2, 1... then "Happy birthday!".
export function countdownWords(count) {
  return Array.from({ length: count }, (_, i) => String(count - i));
}

// A round's score: a pizza/cake counts if the tracing needed at most one
// restart and the count was right on the first check.
export function roundPoint({ restarts, firstCheck }) {
  return restarts <= 1 && firstCheck === 'right' ? 1 : 0;
}

// ---- Spreading sauce and cheese freely ----
// The pizza is split into a grid; a cell counts as covered once the finger
// passes near it. Only cells inside the circle count.
export const COVER_CELLS = 10;

export function makeCoverage(size, cells = COVER_CELLS) {
  const step = size / cells;
  const r = size / 2;
  const inside = [];
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const cx = (col + 0.5) * step;
      const cy = (row + 0.5) * step;
      if (Math.hypot(cx - r, cy - r) <= r * 0.88) inside.push(row * cells + col);
    }
  }
  return { size, cells, step, inside, covered: [] };
}

// Marks every inside cell whose centre is within `radius` of (x, y).
export function coverAt(coverage, x, y, radius) {
  const { cells, step, inside } = coverage;
  const covered = new Set(coverage.covered);
  inside.forEach((index) => {
    const cx = ((index % cells) + 0.5) * step;
    const cy = (Math.floor(index / cells) + 0.5) * step;
    if (Math.hypot(cx - x, cy - y) <= radius) covered.add(index);
  });
  return covered.size === coverage.covered.length ? coverage : { ...coverage, covered: [...covered] };
}

export function coverageRatio(coverage) {
  return coverage.inside.length ? coverage.covered.length / coverage.inside.length : 0;
}

// Sauce and cheese count as spread once most of the pizza is covered.
export const SAUCE_COVERED = 0.8;
export const CHEESE_COVERED = 0.7;

// ---- Slicing ----
// A cut is a swipe that crosses most of the pizza. Two cuts make 4 slices.
export const CUTS_NEEDED = 2;
export const SLICES = 4;

export function isCut(start, end, size) {
  return Math.hypot(end[0] - start[0], end[1] - start[1]) >= size * 0.6;
}

// Slice i (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right): where it
// sits and which corner is rounded.
export function sliceGeometry(i, size) {
  const half = size / 2;
  const col = i % 2;
  const row = Math.floor(i / 2);
  return { left: col * half, top: row * half, size: half, corner: ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'][i] };
}

export const SLICE_WORDS = ['One', 'Two', 'Three', 'Four'];
