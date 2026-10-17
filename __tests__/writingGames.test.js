import { PREWRITING_PATHS, numberPool, pathCheckpoints, pickDistinct, traceStroke, BOX } from '../utils/tracing';
import {
  CUSTOMERS,
  TOPPINGS,
  VEHICLES,
  checkCount,
  clampToCircle,
  countdownWords,
  insideCircle,
  roundPoint,
  word,
} from '../utils/writingGames';
import { SKILLS, getSkill, skillsFor } from '../curriculum/skills';

describe('Bee Paths (pre-writing strokes)', () => {
  it('follows the developmental order: lines, then curves and circles, then the cross', () => {
    expect(PREWRITING_PATHS.slice(0, 5).map((p) => p.id)).toEqual(['down', 'across', 'rainbow', 'circle', 'cross']);
  });

  it('every path traces cleanly, stays in the box, and needs the whole stroke', () => {
    PREWRITING_PATHS.forEach((path) => {
      pathCheckpoints(path).forEach((cps) => {
        expect(traceStroke(cps, cps).done).toBe(true);
        expect(traceStroke(cps, cps.slice(0, Math.floor(cps.length / 2))).done).toBe(false);
        cps.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(BOX.width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(BOX.height);
        });
      });
    });
    // The circle starts at the top and closes back there.
    const [circle] = pathCheckpoints(PREWRITING_PATHS.find((p) => p.id === 'circle'));
    expect(circle[0][1]).toBeLessThan(40);
    expect(Math.hypot(circle[0][0] - circle[circle.length - 1][0], circle[0][1] - circle[circle.length - 1][1])).toBeLessThan(2);
  });
});

describe('number pools', () => {
  it('starts at 1-5, then 1-9; 0 only where it makes sense', () => {
    expect(numberPool()).toEqual([1, 2, 3, 4, 5]);
    expect(numberPool({ allowZero: true })).toEqual([1, 2, 3, 4, 5]);
    expect(numberPool({ bigNumbers: true })).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(numberPool({ bigNumbers: true, allowZero: true })).toContain(0);
    const picked = pickDistinct([1, 2, 3, 4, 5], 3);
    expect(new Set(picked).size).toBe(3);
    expect(pickDistinct([1, 2], 5)).toHaveLength(2);
  });
});

describe('counting toppings and candles', () => {
  it('checks the pile against the number', () => {
    expect(checkCount(3, 3)).toBe('right');
    expect(checkCount(2, 3)).toBe('more');
    expect(checkCount(4, 3)).toBe('fewer');
    expect(word(1, TOPPINGS[0])).toBe('mushroom');
    expect(word(3, TOPPINGS[0])).toBe('mushrooms');
  });

  it('knows when a drop lands on the pizza, and keeps toppings on it', () => {
    expect(insideCircle(150, 150, 300)).toBe(true);
    expect(insideCircle(5, 5, 300)).toBe(false);
    const [x, y] = clampToCircle(299, 150, 300);
    expect(Math.hypot(x - 150, y - 150)).toBeLessThanOrEqual(150 * 0.84 + 0.001);
    expect(clampToCircle(150, 160, 300)).toEqual([150, 160]);
  });

  it('counts candles down and scores a round', () => {
    expect(countdownWords(4)).toEqual(['4', '3', '2', '1']);
    expect(roundPoint({ restarts: 0, firstCheck: 'right' })).toBe(1);
    expect(roundPoint({ restarts: 1, firstCheck: 'right' })).toBe(1);
    expect(roundPoint({ restarts: 2, firstCheck: 'right' })).toBe(0);
    expect(roundPoint({ restarts: 0, firstCheck: 'more' })).toBe(0);
  });

  it('has enough customers, toppings and vehicles', () => {
    expect(CUSTOMERS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(TOPPINGS.map((t) => t.emoji)).size).toBe(TOPPINGS.length);
    expect(VEHICLES.length).toBe(10);
  });
});

describe('writing games in the skill map', () => {
  it('are ages 3-4 math skills on the shared screens', () => {
    expect(getSkill('math-bee-paths')).toMatchObject({ band: 'sprouts', screen: 'TracePath', traceGame: 'bee' });
    expect(getSkill('math-race-track')).toMatchObject({ band: 'sprouts', screen: 'TracePath', traceGame: 'race' });
    expect(getSkill('math-pizza')).toMatchObject({ band: 'sprouts', screen: 'PizzaShop' });
    expect(getSkill('math-birthday-cake')).toMatchObject({ band: 'sprouts', screen: 'BirthdayCake' });
    const ids = skillsFor({ subject: 'math', band: 'sprouts' }).map((s) => s.id);
    expect(ids.indexOf('math-bee-paths')).toBeLessThan(ids.indexOf('math-write-1-5'));
    SKILLS.filter((s) => s.screen === 'TracePath').forEach((s) => expect(['bee', 'race']).toContain(s.traceGame));
  });
});
