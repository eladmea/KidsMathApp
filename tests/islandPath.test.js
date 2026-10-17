import { islandComplete, islandOutline, pathStops, stopStatus } from '../src/logic/islandPath';
import { awardStickers, CHEST_STICKERS } from '../src/logic/stickers';
import { skillsFor } from '../src/curriculum/skills';

const PASSED = { attempts: 10, correct: 10, bestScore: 10, passedDays: ['2026-10-16'], box: 1, lastPlayed: '2026-10-16', dueDate: '2099-01-01' };
const MASTERED = { ...PASSED, passedDays: ['2026-10-15', '2026-10-16'] };

describe('island paths', () => {
  it('lays out every island band on screen, stops apart, chest last', () => {
    [1, 2, 3, 5, 6, 7, 11, 12].forEach((count) => {
      const { stops, chest } = pathStops(count);
      expect(stops).toHaveLength(count);
      [...stops, chest].forEach(({ x, y }) => {
        expect(x).toBeGreaterThanOrEqual(80);
        expect(x).toBeLessThanOrEqual(1200);
        expect(y).toBeGreaterThan(200);
        expect(y).toBeLessThan(640);
      });
      const all = [...stops, chest];
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y)).toBeGreaterThan(120);
    });
  });

  it('winds back on the second row', () => {
    const { stops } = pathStops(11);
    expect(stops[0].y).toBeLessThan(stops[10].y);
    expect(stops[0].x).toBeLessThan(stops[5].x);
    expect(stops[6].x).toBeGreaterThan(stops[10].x);
  });

  it('draws the same island outline every time', () => {
    expect(islandOutline(3, 200, 150)).toEqual(islandOutline(3, 200, 150));
    expect(islandOutline(3, 200, 150)).not.toEqual(islandOutline(4, 200, 150));
    islandOutline(2, 200, 150).forEach(({ x, y }) => expect(Math.hypot(x / 100, y / 75)).toBeLessThan(1.2));
  });

  it('says how far along the path a child is', () => {
    const skills = skillsFor({ subject: 'math', band: 'sprouts' });
    const [first] = skills;
    expect(stopStatus(first, {})).toBe('ready');
    expect(stopStatus(first, { [first.id]: PASSED })).toBe('passed');
    expect(stopStatus(first, { [first.id]: MASTERED })).toBe('mastered');
    expect(stopStatus(skills.find((s) => s.prereqs.length), {})).toBe('locked');
    expect(islandComplete(skills, {})).toBe(false);
    expect(islandComplete(skills, Object.fromEntries(skills.map((s) => [s.id, PASSED])))).toBe(true);
  });

  it('gives a chest sticker once per island band', () => {
    const first = awardStickers([], [{ kind: 'chest', ref: 'math-sprouts' }], '2026-10-17');
    expect(first.earned[0].emoji).toBe(CHEST_STICKERS[0]);
    expect(awardStickers(first.stickers, [{ kind: 'chest', ref: 'math-sprouts' }], '2026-10-18').earned).toHaveLength(0);
  });
});
