// Block Tower: build a tower from flat blocks made of unit squares, the
// biggest at the bottom. A block can only sit on a bigger one: put it on a
// smaller one and it falls. Ages 3-4 lose only that block; ages 5-6 see the
// whole tower fall and build it again. The top block can always be lifted
// off again, so a child is never stuck. Comparing lengths by counting units
// is the "which is more" step of the counting trajectory.

// Per level (the skill's `towerLevel`): how many towers a round has, how many
// blocks each tower has, the longest block, and what a wrong block does.
export const LEVELS = {
  small: { towers: 4, blocks: [3, 3, 3, 4], longest: 5, numbers: false, onWrong: 'block' },
  big: { towers: 5, blocks: [4, 4, 5, 5, 5], longest: 10, numbers: true, onWrong: 'tower' },
};

export function getLevel(levelId) {
  return LEVELS[levelId] || LEVELS.small;
}

// The block lengths for tower `index` (0-based) of a round, in a shuffled
// order for the tray. Lengths are all different. The later big towers keep
// two blocks one unit apart (6 and 7), so the child has to count.
export function makeTower(levelId, index, rng = Math.random) {
  const level = getLevel(levelId);
  const count = level.blocks[Math.min(index, level.blocks.length - 1)];
  const pool = Array.from({ length: level.longest }, (_, i) => i + 1);
  let lengths;
  for (let tries = 0; tries < 50; tries++) {
    lengths = pickDistinct(pool, count, rng);
    if (!level.numbers || index < 2 || hasNeighbours(lengths)) break;
  }
  return shuffle(lengths, rng);
}

function pickDistinct(pool, count, rng) {
  return shuffle(pool, rng).slice(0, count);
}

function hasNeighbours(lengths) {
  return lengths.some((n) => lengths.includes(n + 1));
}

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Can a block of `length` go on top of `stack` (lengths, bottom first)? Any
// block can start a tower; after that only a smaller one.
export function canPlace(stack, length) {
  return stack.length === 0 || length < stack[stack.length - 1];
}

// The tower is done when every block is on it (and so is in order).
export function isComplete(stack, blocks) {
  return stack.length === blocks.length;
}

// What a wrong block knocks down: just itself (ages 3-4), or the whole tower.
export function afterWrong(levelId, stack) {
  return getLevel(levelId).onWrong === 'tower' ? [] : [...stack];
}
