import { DIRECTIONS, LEVELS, expandBlocks, makePuzzle, runProgram } from '../src/logic/roboPath';
import { OWL, SWITCH_AT, TRIALS, isCorrectResponse, isTarget, makeTrials } from '../src/logic/freezeZoo';
import { FULL_POWER_MS, judgeShot, makeZone, powerForHold } from '../src/logic/pushRoll';
import { FLOWER_STAGE, NEEDS, applyCare, canGrowToday, needForDay, newGarden } from '../src/logic/garden';
import { addDays } from '../src/logic/progress';

describe('Robo Path', () => {
  it.each(Object.keys(LEVELS))('%s puzzles are solvable with their own solution', (level) => {
    for (let i = 0; i < 200; i++) {
      const puzzle = makePuzzle(level);
      const solution = level === 'steps' ? expandBlocks(puzzle.solution) : puzzle.solution;
      expect(runProgram(puzzle, solution).outcome).toBe('goal');
      if (puzzle.blockLimit !== null) expect(puzzle.solution.length).toBeLessThanOrEqual(puzzle.blockLimit);
      const rockKeys = puzzle.rocks.map(String);
      expect(rockKeys).not.toContain(String(puzzle.start));
      expect(rockKeys).not.toContain(String(puzzle.goal));
      expect(String(puzzle.start)).not.toBe(String(puzzle.goal));
    }
  });

  it('crashes into walls and rocks, and reports stopping short', () => {
    const puzzle = { size: 3, start: [0, 0], goal: [0, 2], rocks: [[1, 0]], blockLimit: null };
    expect(runProgram(puzzle, [{ dir: 'up', times: 1 }]).outcome).toBe('crash');
    expect(runProgram(puzzle, [{ dir: 'down', times: 1 }]).outcome).toBe('crash');
    expect(runProgram(puzzle, [{ dir: 'right', times: 1 }]).outcome).toBe('short');
    const win = runProgram(puzzle, [{ dir: 'right', times: 2 }]);
    expect(win.outcome).toBe('goal');
    expect(win.path).toEqual([[0, 0], [0, 1], [0, 2]]);
    expect(Object.keys(DIRECTIONS)).toHaveLength(4);
  });
});

describe('Freeze Zoo', () => {
  it('switches rules halfway', () => {
    const trials = makeTrials();
    expect(trials).toHaveLength(TRIALS);
    expect(trials.filter((t) => t.phase === 1)).toHaveLength(SWITCH_AT);
  });

  it('scores go and no-go responses in both phases', () => {
    const dog1 = { animal: '🐶', phase: 1 };
    const owl1 = { animal: OWL, phase: 1 };
    const dog2 = { animal: '🐶', phase: 2 };
    const owl2 = { animal: OWL, phase: 2 };
    expect(isTarget(dog1)).toBe(true);
    expect(isTarget(owl1)).toBe(false);
    expect(isTarget(dog2)).toBe(false);
    expect(isTarget(owl2)).toBe(true);
    expect(isCorrectResponse(owl1, false)).toBe(true);
    expect(isCorrectResponse(owl1, true)).toBe(false);
    expect(isCorrectResponse(dog2, true)).toBe(false);
    expect(isCorrectResponse(owl2, true)).toBe(true);
  });
});

describe('Push & Roll', () => {
  it('a longer hold is a harder push, capped at full power', () => {
    expect(powerForHold(0)).toBe(0);
    expect(powerForHold(FULL_POWER_MS / 2)).toBeCloseTo(0.5);
    expect(powerForHold(FULL_POWER_MS * 3)).toBe(1);
  });

  it('judges too soft, too hard and just right', () => {
    const zone = { start: 0.5, width: 0.16 };
    expect(judgeShot(0.3, zone)).toBe('tooSoft');
    expect(judgeShot(0.58, zone)).toBe('hit');
    expect(judgeShot(0.9, zone)).toBe('tooHard');
  });

  it('target zones always fit on the track', () => {
    for (let i = 0; i < 200; i++) {
      const zone = makeZone();
      expect(zone.start).toBeGreaterThanOrEqual(0.3);
      expect(zone.start + zone.width).toBeLessThanOrEqual(0.95 + 1e-9);
    }
  });
});

describe('Garden Days', () => {
  const day = '2026-10-16';

  it('grows one stage per day when given what it needs', () => {
    const need = needForDay(day, 'p1');
    const first = applyCare(newGarden(), need, day, 'p1');
    expect(first.result).toBe('grew');
    expect(first.garden.stage).toBe(1);
    expect(canGrowToday(first.garden, day)).toBe(false);
    expect(applyCare(first.garden, need, day, 'p1').result).toBe('rested');
  });

  it('a wrong choice droops the plant without using up the day', () => {
    const need = needForDay(day, 'p1');
    const wrong = Object.keys(NEEDS).find((n) => n !== need);
    const result = applyCare(newGarden(), wrong, day, 'p1');
    expect(result.result).toBe('wrong');
    expect(result.garden.droopy).toBe(true);
    expect(applyCare(result.garden, need, day, 'p1').result).toBe('grew');
  });

  it('blooms after enough days and can be replanted', () => {
    let garden = newGarden();
    let result;
    for (let i = 0; i < FLOWER_STAGE; i++) {
      const d = addDays(day, i);
      ({ garden, result } = applyCare(garden, needForDay(d, 'p1'), d, 'p1'));
    }
    expect(result).toBe('bloomed');
    expect(garden.flowers).toBe(1);
    const replanted = applyCare(garden, 'replant', addDays(day, 10), 'p1');
    expect(replanted.result).toBe('replanted');
    expect(replanted.garden).toMatchObject({ stage: 0, flowers: 1 });
  });

  it('needs vary across days', () => {
    const needs = new Set(Array.from({ length: 30 }, (_, i) => needForDay(addDays(day, i), 'p1')));
    expect(needs.size).toBe(3);
  });
});
