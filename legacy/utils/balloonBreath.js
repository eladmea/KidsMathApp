// Balloon Breath: a calming break. Hold to breathe in slowly (the balloon
// fills), let go to breathe out (it shrinks). Slow breathing like this is a
// common calm-down strategy taught in early SEL programmes.
export const BREATHS = 5;
// A full breath in fills the balloon in 4 s; one held at least 3 s counts.
export const IN_MS = 4000;
export const MIN_IN_MS = 3000;
export const OUT_MS = 4000;
export const MIN_SCALE = 0.35;

// Balloon size (MIN_SCALE..1) after holding for `holdMs`.
export function balloonScale(holdMs) {
  const filled = Math.min(1, Math.max(0, holdMs / IN_MS));
  return MIN_SCALE + (1 - MIN_SCALE) * filled;
}

// 'good' once the breath was slow enough, otherwise 'quick'.
export function judgeBreath(holdMs) {
  return holdMs >= MIN_IN_MS ? 'good' : 'quick';
}

// Seconds left to count down while breathing in, e.g. 4, 3, 2, 1.
export function countdown(holdMs, totalMs = IN_MS) {
  return Math.max(0, Math.ceil((totalMs - holdMs) / 1000));
}
