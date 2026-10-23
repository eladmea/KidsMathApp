// Robo Path's 8 levels: every puzzle is solvable, the levels get harder,
// stars must be collected, and the level moves up and down with play.
import { STAGES, TOP_STAGE, clampStage, expandBlocks, makeStagePuzzle, nextStage, runProgram } from '../src/logic/roboPath';

const steps = (puzzle) => puzzle.solution.reduce((sum, block) => sum + block.times, 0);

describe('Robo Path levels', () => {
  it.each(STAGES.map((_, i) => i + 1))('level %i puzzles are solvable, with stars on the way', (stage) => {
    const level = STAGES[stage - 1];
    for (let i = 0; i < 150; i++) {
      const puzzle = makeStagePuzzle(stage);
      expect(puzzle.size).toBe(level.size);
      expect(puzzle.stars).toHaveLength(level.stars);
      expect(puzzle.rocks.length).toBeLessThanOrEqual(level.rocks);
      expect(runProgram(puzzle, expandBlocks(puzzle.solution)).outcome).toBe('goal');
      const blocked = [puzzle.start, puzzle.goal, ...puzzle.stars].map(String);
      puzzle.rocks.forEach((rock) => expect(blocked).not.toContain(String(rock)));
      // The program panel holds 27 blocks.
      expect(steps(puzzle)).toBeLessThanOrEqual(27);
    }
  });

  it('gets harder level by level', () => {
    const average = (stage) => {
      let total = 0;
      for (let i = 0; i < 100; i++) total += steps(makeStagePuzzle(stage));
      return total / 100;
    };
    expect(average(8)).toBeGreaterThan(average(4));
    expect(average(4)).toBeGreaterThan(average(1));
    STAGES.slice(1).forEach((stage, i) => {
      expect(stage.size).toBeGreaterThanOrEqual(STAGES[i].size);
      expect(stage.rocks).toBeGreaterThan(STAGES[i].rocks);
    });
  });

  it('reaching the cookie without every star is not a win', () => {
    const puzzle = { size: 3, start: [0, 0], goal: [0, 2], rocks: [], stars: [[1, 1]] };
    expect(runProgram(puzzle, [{ dir: 'right', times: 2 }]).outcome).toBe('stars');
    const detour = [{ dir: 'down', times: 1 }, { dir: 'right', times: 1 }, { dir: 'up', times: 1 }, { dir: 'right', times: 1 }];
    expect(runProgram(puzzle, detour).outcome).toBe('goal');
  });

  it('moves up after a first-run win and down after 2 failed runs', () => {
    expect(nextStage(1, 0)).toBe(2);
    expect(nextStage(TOP_STAGE, 0)).toBe(TOP_STAGE);
    expect(nextStage(3, 1)).toBe(3);
    expect(nextStage(3, 2)).toBe(2);
    expect(nextStage(1, 3)).toBe(1);
    expect(clampStage(undefined)).toBe(1);
    expect(clampStage(99)).toBe(TOP_STAGE);
  });
});
