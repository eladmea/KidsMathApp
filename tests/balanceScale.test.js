import { LEVELS, MAX_TILT, isBalanced, isTooHeavy, makePuzzle, tilt, total } from '../src/logic/balanceScale';

describe('Balance Scale', () => {
  it('always makes a puzzle that the tray can balance', () => {
    Object.entries(LEVELS).forEach(([id, level]) => {
      for (let index = 0; index < level.puzzles; index++) {
        for (let n = 0; n < 200; n++) {
          const p = makePuzzle(id, index);
          // The answer blocks are on the tray and balance the scale.
          p.answer.forEach((w) => expect(p.tray).toContain(w));
          expect(total(p.left)).toBe(total([...p.fixed, ...p.answer]));
          // Different weights on the tray, all positive.
          expect(new Set(p.tray).size).toBe(p.tray.length);
          p.tray.forEach((w) => expect(w).toBeGreaterThan(0));
        }
      }
    });
  });

  it('ages 7-8 make sums up to 20 from blocks up to 10', () => {
    for (let n = 0; n < 200; n++) {
      const early = makePuzzle('sum', 0);
      expect(early.left[0] >= 6 && early.left[0] <= 10).toBe(true);
      const late = makePuzzle('sum', 5);
      expect(late.answer).toHaveLength(3);
      expect(late.left[0]).toBeLessThanOrEqual(20);
      late.tray.forEach((w) => expect(w).toBeLessThanOrEqual(10));
    }
  });

  it('ages 9-10 balance equal groups, then find a missing block', () => {
    const groups = makePuzzle('times', 0);
    expect(new Set(groups.left).size).toBe(1);
    expect(groups.answer[0]).toBe(total(groups.left));
    const missing = makePuzzle('times', 4);
    expect(missing.fixed).toHaveLength(1);
    expect(missing.left).toHaveLength(2);
  });

  it('tips towards the heavier side, more for a bigger difference', () => {
    expect(tilt([8], [3, 5])).toBe(0);
    expect(tilt([8], [3])).toBeLessThan(0);
    expect(tilt([8], [9])).toBeGreaterThan(0);
    expect(Math.abs(tilt([8], [1]))).toBeGreaterThan(Math.abs(tilt([8], [7])));
    expect(Math.abs(tilt([20], []))).toBe(MAX_TILT);
  });

  it('knows when the scale is level, and when the right side is too heavy', () => {
    expect(isBalanced([4, 4, 4], [12])).toBe(true);
    expect(isBalanced([9, 6], [5])).toBe(false);
    expect(isTooHeavy([9], [5, 6])).toBe(true);
    expect(isTooHeavy([9], [5])).toBe(false);
  });
});
