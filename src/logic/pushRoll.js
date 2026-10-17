// Push & Roll: a harder push sends the ball farther (NGSS K-PS2-1).
// Positions are fractions of the track (0 = start, 1 = end).

export const SHOTS = 8;
export const ZONE_WIDTH = 0.16;
// Holding the push button fills the power meter in this time.
export const FULL_POWER_MS = 1600;

export function makeZone(rng = Math.random) {
  return { start: 0.3 + rng() * (0.95 - ZONE_WIDTH - 0.3), width: ZONE_WIDTH };
}

export function powerForHold(ms) {
  return Math.min(1, Math.max(0, ms / FULL_POWER_MS));
}

// The ball rolls as far as the push was strong.
export function rollDistance(power) {
  return power;
}

export function judgeShot(position, zone) {
  if (position < zone.start) return 'tooSoft';
  if (position > zone.start + zone.width) return 'tooHard';
  return 'hit';
}
