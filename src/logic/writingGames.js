// Rules for the age 3-4 writing games (Pizza Shop, Birthday Cake, Race
// Track, Bee Paths). Each pairs tracing a number with counting it, so the
// written digit is tied to its amount.

// Each pizza has many steps (dough to eating), so 2 make a round.
export const PIZZAS_PER_ROUND = 2;
export const CAKES_PER_ROUND = 3;
export const ROADS_PER_ROUND = 5;
export const MAX_ON_TRAY_TARGET = 12;

// Pizza toppings (their names are in the math content pack). Olives are
// drawn as slices (rings), not whole olives, so they have no emoji.
export const TOPPINGS = [
  { id: 'olive', emoji: null },
  { id: 'corn', emoji: '🌽' },
  { id: 'mushroom', emoji: '🍄' },
  { id: 'pineapple', emoji: '🍍' },
];

export const CUSTOMERS = [
  { id: 'bear', emoji: '🐻' },
  { id: 'bunny', emoji: '🐰' },
  { id: 'fox', emoji: '🦊' },
  { id: 'panda', emoji: '🐼' },
  { id: 'frog', emoji: '🐸' },
  { id: 'monkey', emoji: '🐵' },
  { id: 'lion', emoji: '🦁' },
  { id: 'pig', emoji: '🐷' },
];

export const VEHICLES = ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚜', '🛵'];

// Checking a pile of toppings or candles against the number.
// 'right' | 'more' (needs more) | 'fewer' (too many)
export function checkCount(placed, target) {
  if (placed === target) return 'right';
  return placed < target ? 'more' : 'fewer';
}

// Where the candles stand on a cake `width` wide: evenly spaced, never on
// top of each other, so each one can be tapped. Up to `perRow` fit in one
// row; more make a second row behind (row 1), between the front ones.
// [{ x, row, spacing }] with x from the cake's left edge, in placing order.
export function candleSlots(count, width, perRow = 8) {
  if (count <= 0) return [];
  const rows = count <= perRow ? [count] : [Math.ceil(count / 2), Math.floor(count / 2)];
  const slots = [];
  rows.forEach((inRow, row) => {
    const spacing = width / inRow;
    for (let i = 0; i < inRow; i++) slots.push({ x: (i + 0.5) * spacing, row, spacing });
  });
  return slots;
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
export const SAUCE_COVERED = 0.75;
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

// ---- Pizza Shop's steps ----
// Rolling the dough out takes this much rubbing, in pizza widths; a new
// touch counts as a little rub too.
export const ROLL_WIDTHS = 2.5;
export const ROLL_TOUCH = 0.08;

export const PIZZA_STEPS = ['dough', 'trace', 'sauce', 'cheese', 'topping', 'place', 'oven', 'baking', 'slice', 'feed', 'done'];

// The bar of stations above the pizza, and the steps each one covers.
export const STATIONS = [
  { id: 'sauce', emoji: '🥫', steps: ['trace', 'sauce'] },
  { id: 'cheese', emoji: '🧀', steps: ['cheese'] },
  { id: 'toppings', emoji: '🍄', steps: ['topping', 'place'] },
];

// 'active' | 'done' | 'later'
export function stationStatus(station, step) {
  if (station.steps.includes(step)) return 'active';
  const last = PIZZA_STEPS.indexOf(station.steps[station.steps.length - 1]);
  return PIZZA_STEPS.indexOf(step) > last ? 'done' : 'later';
}

// Cheese, as it is sprinkled: 4 shreds around each dab, scattered the same
// way every time. Offsets are in pizza widths; angles in degrees.
export function cheeseShreds(dab) {
  return [0, 1, 2, 3].map((k) => {
    const a = (dab * 7 + k * 1.7) % (Math.PI * 2);
    const distance = 0.075 * (0.3 + ((dab * 13 + k * 5) % 10) / 14);
    return { dx: Math.cos(a) * distance, dy: Math.sin(a) * distance, angle: (dab * 47 + k * 61) % 180 };
  });
}

// Melted cheese, once it is all on: spots spread evenly over the pizza
// (a sunflower spiral). Offsets are in pizza widths.
export function meltedCheese(count = 140) {
  return Array.from({ length: count }, (_, i) => {
    const a = i * 2.399;
    const r = 0.5 * 0.78 * Math.sqrt(((i * 37) % 100) / 100);
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, angle: (i * 53) % 180 };
  });
}
