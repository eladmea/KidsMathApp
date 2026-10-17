// Robo Path: program a robot with arrow blocks to reach the cookie.
// Puzzles are built by walking a random path first, so every puzzle is
// solvable. In loop mode each block can repeat (➡️×3) and the number of
// blocks is limited, so children have to spot repeated moves.

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

function randInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const key = ([r, c]) => `${r},${c}`;

export function makePuzzle(levelId = 'steps', rng = Math.random) {
  const level = LEVELS[levelId];
  const { size } = level;
  for (let attempt = 0; attempt < 500; attempt++) {
    const start = [randInt(0, size - 1, rng), randInt(0, size - 1, rng)];
    const visited = new Set([key(start)]);
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
        position = next;
      }
      solution.push({ dir, times: length });
      previous = dir;
    }
    if (!ok) continue;
    const free = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!visited.has(key([r, c]))) free.push([r, c]);
    const rocks = [];
    while (rocks.length < Math.min(level.rocks, free.length)) {
      const [cell] = free.splice(Math.floor(rng() * free.length), 1);
      rocks.push(cell);
    }
    return {
      level: levelId,
      size,
      start,
      goal: position,
      rocks,
      loops: level.loops,
      // In loop mode you may use as many blocks as the solution's straight runs.
      blockLimit: level.loops ? solution.length : null,
      solution,
    };
  }
  throw new Error('could not build a puzzle');
}

// Runs blocks one step at a time. outcome: 'goal' | 'crash' | 'short'.
export function runProgram(puzzle, blocks) {
  const rocks = new Set(puzzle.rocks.map(key));
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
    }
  }
  return { path, outcome: key(position) === key(puzzle.goal) ? 'goal' : 'short' };
}

// Single-step blocks spelled out, e.g. for the "steps" level solution.
export function expandBlocks(blocks) {
  return blocks.flatMap(({ dir, times }) => Array.from({ length: times }, () => ({ dir, times: 1 })));
}
