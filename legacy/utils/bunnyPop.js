// Bunny Pop: a whack-a-mole go/no-go game for ages 3-4 (inhibitory control,
// Diamond's executive functions). Animals pop out of holes one at a time.
// The rule never changes: boop the bunny, leave every other animal alone.
// (Freeze Zoo's rule switch suits ages 5-6.)

export const TARGET = '🐰';
// Clearly different from the bunny, so the choice is about stopping, not
// telling look-alikes apart.
export const OTHERS = ['🐸', '🐷', '🐱', '🐶', '🐵', '🦊', '🐼', '🐔'];
export const HOLES = 6;
export const POPS = 16;
// About 6 in 10 pops are bunnies, so tapping is the habit to hold back.
const TARGET_CHANCE = 0.6;
// Young children need longer to look and decide.
export const SHOW_MS = 1900;
export const GAP_MS = 550;

// The pops for one round: { id, hole, animal }. Never the same hole twice in
// a row, and never more than 3 non-bunnies in a row (it stays fun).
export function makePops(count = POPS, rng = Math.random) {
  const pops = [];
  let othersInRow = 0;
  for (let i = 0; i < count; i++) {
    const previousHole = pops.length ? pops[pops.length - 1].hole : -1;
    let hole = Math.floor(rng() * HOLES);
    if (hole === previousHole) hole = (hole + 1 + Math.floor(rng() * (HOLES - 1))) % HOLES;
    const isTarget = othersInRow >= 3 || rng() < TARGET_CHANCE;
    othersInRow = isTarget ? 0 : othersInRow + 1;
    const animal = isTarget ? TARGET : OTHERS[Math.floor(rng() * OTHERS.length)];
    pops.push({ id: i, hole, animal });
  }
  return pops;
}

export function isTarget(pop) {
  return pop.animal === TARGET;
}

// Correct = booped the bunny, or left another animal alone.
export function isCorrectResponse(pop, tapped) {
  return tapped === isTarget(pop);
}
