// Garden Days: grow a plant over real days by giving it what it needs.
// The plant can grow at most one stage per day, so children come back on a
// later day (built-in spacing). A wrong choice just makes it droop and
// explains what it needed; the plant never dies.
import { toDayKey } from './progress';

export const STAGES = [
  { emoji: '🌰', name: 'seed' },
  { emoji: '🌱', name: 'sprout' },
  { emoji: '🌿', name: 'young plant' },
  { emoji: '🪴', name: 'leafy plant' },
  { emoji: '🌷', name: 'bud' },
  { emoji: '🌻', name: 'flower' },
];
export const FLOWER_STAGE = STAGES.length - 1;

export const NEEDS = {
  water: { emoji: '💧', label: 'Water', clue: 'The soil is dry and the leaves are floppy.', reason: 'Plants drink water through their roots.' },
  sun: { emoji: '☀️', label: 'Sunlight', clue: 'It is sitting in a dark corner.', reason: 'Plants use sunlight to make their food.' },
  soil: { emoji: '🟫', label: 'Fresh soil', clue: 'The leaves look pale and the soil is worn out.', reason: 'Good soil gives plants nutrients.' },
};
export const SILLY_CHOICES = {
  candy: { emoji: '🍬', label: 'Candy', reason: "Plants don't eat candy!" },
  music: { emoji: '🎸', label: 'Loud music', reason: "Plants don't need loud music to grow." },
};

export function newGarden() {
  return { stage: 0, lastGrowDay: null, flowers: 0, droopy: false };
}

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

// What the plant needs today (the same all day, different across days).
export function needForDay(day, seed = '') {
  const ids = Object.keys(NEEDS);
  return ids[hash(`${day}:${seed}`) % ids.length];
}

export function canGrowToday(garden, day = toDayKey()) {
  return garden.lastGrowDay !== day;
}

// result: 'grew' | 'bloomed' | 'wrong' | 'rested' (already grew today) | 'replanted'
export function applyCare(garden, choice, day = toDayKey(), seed = '') {
  if (garden.stage === FLOWER_STAGE) {
    return { garden: { ...newGarden(), flowers: garden.flowers }, result: 'replanted' };
  }
  if (!canGrowToday(garden, day)) return { garden, result: 'rested' };
  if (choice !== needForDay(day, seed)) return { garden: { ...garden, droopy: true }, result: 'wrong' };
  const stage = garden.stage + 1;
  const bloomed = stage === FLOWER_STAGE;
  return {
    garden: { ...garden, stage, lastGrowDay: day, droopy: false, flowers: garden.flowers + (bloomed ? 1 : 0) },
    result: bloomed ? 'bloomed' : 'grew',
  };
}
