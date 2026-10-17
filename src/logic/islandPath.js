// The look of the islands, kept free of Phaser so it can be tested: where
// the stops of an island's path go, the outline of an island, and how far a
// child has got along it.
import { getRecord, hasPassed, isMastered, isUnlocked } from './progress';
import { isAvailable } from './skillRoutes';

// Stops along a winding road in an area of the screen: one row for a few
// stops, two rows (left to right, then back) for more. The chest comes after
// the last stop. Returns { stops: [{ x, y }], chest: { x, y } }.
export function pathStops(count, { left = 140, right = 1140, top = 320, bottom = 520, maxPerRow = 6 } = {}) {
  const rows = count > maxPerRow ? 2 : 1;
  const perRow = Math.ceil((count + 1) / rows);
  const step = (right - left) / Math.max(1, perRow - 1);
  const points = [];
  for (let i = 0; i <= count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    // The second row comes back the other way.
    const x = rows === 1 ? (left + right) / 2 + (col - count / 2) * Math.min(step, 210) : left + (row % 2 ? perRow - 1 - col : col) * step;
    const y = rows === 1 ? (top + bottom) / 2 + (col % 2 ? 40 : -40) : row ? bottom : top;
    points.push({ x: Math.round(x), y: Math.round(y) });
  }
  return { stops: points.slice(0, count), chest: points[count] };
}

// A small seeded random generator, so an island keeps its shape.
function seeded(seed) {
  let value = seed % 2147483647 || 1;
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

// An island's outline: a wobbly oval around (0, 0), `points` points.
export function islandOutline(seed, width, height, points = 24) {
  const rand = seeded(seed * 9301 + 49297);
  const wobbles = [rand() * 0.08 + 0.04, rand() * 0.06 + 0.02];
  const phase = rand() * Math.PI * 2;
  return Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const r = 1 + wobbles[0] * Math.sin(3 * a + phase) + wobbles[1] * Math.sin(5 * a - phase) + (rand() - 0.5) * 0.04;
    return { x: Math.cos(a) * (width / 2) * r, y: Math.sin(a) * (height / 2) * r };
  });
}

// One stop: 'soon' (game not built), 'locked', 'ready', 'passed', 'mastered'.
export function stopStatus(skill, progress) {
  if (!isAvailable(skill)) return 'soon';
  if (!isUnlocked(skill, progress)) return 'locked';
  const record = getRecord(progress, skill.id);
  if (isMastered(record)) return 'mastered';
  return hasPassed(record) ? 'passed' : 'ready';
}

// The chest opens once every stop on the path is passed.
export function islandComplete(skills, progress) {
  return skills.length > 0 && skills.every((skill) => hasPassed(getRecord(progress, skill.id)));
}
