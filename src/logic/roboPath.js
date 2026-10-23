// Robo Path: program a robot with arrow blocks to reach the cookie.
// Puzzles are built by walking a random path first, so every puzzle is
// solvable. In loop mode each block can repeat (➡️×3) and the number of
// blocks is limited, so children have to spot repeated moves.
//
// Robo Path climbs 8 levels (STAGES): a bigger board, more turns, more rocks
// beside the path and, from level 4, stars to collect before the cookie.
// A puzzle solved on the first run goes up a level; two failed runs go down.

export const DIRECTIONS = {
  up: { dr: -1, dc: 0, arrow: '⬆️' },
  right: { dr: 0, dc: 1, arrow: '➡️' },
  down: { dr: 1, dc: 0, arrow: '⬇️' },
  left: { dr: 0, dc: -1, arrow: '⬅️' },
};
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const LEVELS = {
  steps: { size: 4, segments: [2, 3], segmentLength: [1, 2], rocks: 2, loops: false },
  loops: { size: 6, segments: [2, 3], segmentLength: [2, 4], rocks: 4, loops: true },
};

// Robo Path's levels, 1 to 8. The longest solution is 18 steps.
export const STAGES = [
  { size: 4, segments: [2, 2], segmentLength: [1, 2], rocks: 2, stars: 0 },
  { size: 4, segments: [3, 3], segmentLength: [1, 2], rocks: 3, stars: 0 },
  { size: 5, segments: [3, 3], segmentLength: [1, 3], rocks: 4, stars: 0 },
  { size: 5, segments: [3, 4], segmentLength: [1, 3], rocks: 5, stars: 1 },
  { size: 6, segments: [4, 4], segmentLength: [1, 3], rocks: 7, stars: 1 },
  { size: 6, segments: [4, 5], segmentLength: [2, 3], rocks: 9, stars: 2 },
  { size: 7, segments: [5, 5], segmentLength: [2, 3], rocks: 11, stars: 2 },
  { size: 7, segments: [5, 6], segmentLength: [2, 3], rocks: 14, stars: 3 },
].map((stage) => ({ ...stage, loops: false }));
export const TOP_STAGE = STAGES.length;

// The level after a puzzle: up after a first-run win, down after 2 failed runs.
export function nextStage(stage, fails) {
  if (fails === 0) return Math.min(TOP_STAGE, stage + 1);
  if (fails >= 2) return Math.max(1, stage - 1);
  return stage;
}

// A saved level, made safe (old players have none).
export function clampStage(stage) {
  return Number.isInteger(stage) ? Math.min(TOP_STAGE, Math.max(1, stage)) : 1;
}

function randInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const key = ([r, c]) => `${r},${c}`;

// A puzzle at one of Robo Path's levels (1 to 8).
export function makeStagePuzzle(stage, rng = Math.random) {
  return buildPuzzle(STAGES[clampStage(stage) - 1], 'steps', rng, clampStage(stage));
}

export function makePuzzle(levelId = 'steps', rng = Math.random) {
  return buildPuzzle(LEVELS[levelId], levelId, rng, null);
}

const NEIGHBOURS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function buildPuzzle(level, levelId, rng, stage) {
  const { size } = level;
  for (let attempt = 0; attempt < 2000; attempt++) {
    const start = [randInt(0, size - 1, rng), randInt(0, size - 1, rng)];
    const visited = new Set([key(start)]);
    const route = [start];
    const solution = [];
    let position = start;
    let previous = null;
    let ok = true;
    const segmentCount = randInt(level.segments[0], level.segments[1], rng);
    for (let s = 0; s < segmentCount && ok; s++) {
      const options = Object.keys(DIRECTIONS).filter((d) => d !== previous && d !== OPPOSITE[previous]);
      const dir = options[Math.floor(rng() * options.length)];
      const length = randInt(level.segmentLength[0], level.segmentLength[1], rng);
      for (let i = 0; i < length; i++) {
        const next = [position[0] + DIRECTIONS[dir].dr, position[1] + DIRECTIONS[dir].dc];
        if (next[0] < 0 || next[1] < 0 || next[0] >= size || next[1] >= size || visited.has(key(next))) {
          ok = false;
          break;
        }
        visited.add(key(next));
        route.push(next);
        position = next;
      }
      solution.push({ dir, times: length });
      previous = dir;
    }
    if (!ok) continue;
    const free = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!visited.has(key([r, c]))) free.push([r, c]);
    // Rocks go beside the path first, so going straight bumps into them.
    const besidePath = (cell) => NEIGHBOURS.some(([dr, dc]) => visited.has(key([cell[0] + dr, cell[1] + dc])));
    const near = free.filter(besidePath);
    const far = free.filter((cell) => !besidePath(cell));
    const rocks = [];
    while (rocks.length < level.rocks && (near.length || far.length)) {
      const pool = near.length && (rng() < 0.75 || !far.length) ? near : far;
      const [cell] = pool.splice(Math.floor(rng() * pool.length), 1);
      rocks.push(cell);
    }
    // Stars sit on the path (never the start or the cookie), spread along it.
    const stars = [];
    const count = level.stars || 0;
    if (count) {
      const inner = route.slice(1, -1);
      if (inner.length < count) continue;
      for (let i = 0; i < count; i++) stars.push(inner[Math.floor(((i + 0.5) * inner.length) / count)]);
    }
    return {
      level: levelId,
      stage,
      size,
      start,
      goal: position,
      rocks,
      stars,
      loops: level.loops,
      // In loop mode you may use as many blocks as the solution's straight runs.
      blockLimit: level.loops ? solution.length : null,
      solution,
    };
  }
  throw new Error('could not build a puzzle');
}

// Runs blocks one step at a time.
// outcome: 'goal' | 'crash' | 'short' | 'stars' (at the cookie, a star missed).
export function runProgram(puzzle, blocks) {
  const rocks = new Set(puzzle.rocks.map(key));
  const stars = (puzzle.stars || []).map(key);
  const collected = new Set();
  let position = puzzle.start;
  const path = [position];
  for (const { dir, times } of blocks) {
    for (let i = 0; i < times; i++) {
      const next = [position[0] + DIRECTIONS[dir].dr, position[1] + DIRECTIONS[dir].dc];
      if (next[0] < 0 || next[1] < 0 || next[0] >= puzzle.size || next[1] >= puzzle.size || rocks.has(key(next))) {
        return { path, outcome: 'crash', crashAt: next };
      }
      position = next;
      path.push(position);
      if (stars.includes(key(position))) collected.add(key(position));
    }
  }
  const atGoal = key(position) === key(puzzle.goal);
  const outcome = !atGoal ? 'short' : collected.size < stars.length ? 'stars' : 'goal';
  return { path, outcome, collected: collected.size };
}

// Single-step blocks spelled out, e.g. for the "steps" level solution.
export function expandBlocks(blocks) {
  return blocks.flatMap(({ dir, times }) => Array.from({ length: times }, () => ({ dir, times: 1 })));
}
