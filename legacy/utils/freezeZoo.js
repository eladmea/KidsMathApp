// Freeze Zoo: a go/no-go game for inhibitory control, with a rule switch
// halfway through for cognitive flexibility (Diamond's executive functions).
// Part 1: tap every animal, but FREEZE for the owl.
// Part 2: switch! Tap ONLY the owl.

export const OWL = '🦉';
export const ANIMALS = ['🐶', '🐱', '🐰', '🐸', '🐵', '🐷', '🦁', '🐼'];
export const TRIALS = 24;
export const SWITCH_AT = 12;
const OWL_CHANCE = 0.3;

export function makeTrials(count = TRIALS, switchAt = SWITCH_AT, rng = Math.random) {
  return Array.from({ length: count }, (_, i) => {
    const isOwl = rng() < OWL_CHANCE;
    return {
      id: i,
      animal: isOwl ? OWL : ANIMALS[Math.floor(rng() * ANIMALS.length)],
      phase: i < switchAt ? 1 : 2,
    };
  });
}

export function isTarget(trial) {
  return trial.phase === 1 ? trial.animal !== OWL : trial.animal === OWL;
}

// Correct = tapped a target, or held still for a non-target.
export function isCorrectResponse(trial, tapped) {
  return tapped === isTarget(trial);
}
