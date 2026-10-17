// Rules for the age 3-4 writing games (Pizza Shop, Birthday Cake, Race
// Track, Bee Paths). Each pairs tracing a number with counting it, so the
// written digit is tied to its amount.

export const PIZZAS_PER_ROUND = 3;
export const CAKES_PER_ROUND = 3;
export const ROADS_PER_ROUND = 5;
export const MAX_ON_TRAY_TARGET = 12;

export const TOPPINGS = [
  { emoji: '🍄', name: 'mushroom', plural: 'mushrooms' },
  { emoji: '🍅', name: 'tomato', plural: 'tomatoes' },
  { emoji: '🫑', name: 'pepper', plural: 'peppers' },
  { emoji: '🍍', name: 'pineapple', plural: 'pineapples' },
  { emoji: '🫒', name: 'olive', plural: 'olives' },
  { emoji: '🌽', name: 'corn', plural: 'corns' },
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
