import { digitCheckpoints, freeTraceStart, freeTraceAdd, freeTraceResult, FREE_COVER } from '../src/logic/tracing';
import { PREWRITING_PATHS, numberPool, pathCheckpoints, pickDistinct, traceStroke, BOX } from '../src/logic/tracing';
import {
  CHEESE_COVERED,
  CUTS_NEEDED,
  PIZZAS_PER_ROUND,
  SAUCE_COVERED,
  SLICES,
  coverAt,
  coverageRatio,
  isCut,
  makeCoverage,
  sliceGeometry,
  CUSTOMERS,
  TOPPINGS,
  VEHICLES,
  checkCount,
  clampToCircle,
  countdownWords,
  insideCircle,
  roundPoint,
  word,
} from '../src/logic/writingGames';
import { SKILLS, getSkill, skillsFor } from '../src/curriculum/skills';

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
    const mushroom = TOPPINGS.find((t) => t.id === 'mushroom');
    expect(word(1, mushroom)).toBe('mushroom');
    expect(word(3, mushroom)).toBe('mushrooms');
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
    // Exactly the four toppings asked for; olives are slices (drawn, no emoji).
    expect(TOPPINGS.map((t) => t.id)).toEqual(['olive', 'corn', 'mushroom', 'pineapple']);
    expect(TOPPINGS.find((t) => t.id === 'olive')).toMatchObject({ emoji: null, plural: 'olive slices' });
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

describe('pizza: spreading, baking and slicing', () => {
  it('counts only cells inside the pizza, and spreading covers them', () => {
    let cover = makeCoverage(300);
    expect(cover.inside.length).toBeGreaterThan(50);
    expect(cover.inside.length).toBeLessThan(100);
    expect(coverageRatio(cover)).toBe(0);
    cover = coverAt(cover, 150, 150, 30);
    expect(coverageRatio(cover)).toBeGreaterThan(0);
    // Painting the same spot again adds nothing.
    expect(coverAt(cover, 150, 150, 30)).toBe(cover);
    // A corner outside the circle never counts.
    expect(coverAt(makeCoverage(300), 2, 2, 10).covered).toHaveLength(0);
  });

  it('a finger zig-zagging over the whole pizza finishes the sauce and the cheese', () => {
    let cover = makeCoverage(300);
    for (let y = 40; y <= 260; y += 30) for (let x = 40; x <= 260; x += 15) cover = coverAt(cover, x, y, 300 * 0.11);
    expect(coverageRatio(cover)).toBeGreaterThanOrEqual(SAUCE_COVERED);
    expect(coverageRatio(cover)).toBeGreaterThanOrEqual(CHEESE_COVERED);
  });

  it('needs swipes across most of the pizza to cut, and makes 4 slices', () => {
    expect(isCut([150, 10], [150, 290], 300)).toBe(true);
    expect(isCut([150, 100], [150, 160], 300)).toBe(false);
    expect(CUTS_NEEDED).toBe(2);
    expect(SLICES).toBe(4);
    const pieces = Array.from({ length: SLICES }, (_, i) => sliceGeometry(i, 300));
    expect(pieces.map((p) => [p.left, p.top])).toEqual([[0, 0], [150, 0], [0, 150], [150, 150]]);
    expect(new Set(pieces.map((p) => p.corner)).size).toBe(4);
  });

  it('keeps a round short enough for a 3-year-old', () => {
    expect(PIZZAS_PER_ROUND).toBe(2);
  });
});

describe('free-order writing on the pizza', () => {
  const run = (strokes, points) => freeTraceResult(points.reduce(freeTraceAdd, freeTraceStart(strokes)));

  it('counts the number in the usual order', () => {
    for (let d = 0; d <= 9; d++) {
      const strokes = digitCheckpoints(d);
      expect(run(strokes, strokes.flat()).done).toBe(true);
    }
  });

  it('counts it backwards, with the strokes swapped, or in bits', () => {
    for (let d = 0; d <= 9; d++) {
      const strokes = digitCheckpoints(d);
      expect(run(strokes, [...strokes].reverse().flatMap((s) => [...s].reverse())).done).toBe(true);
      // Second half first, then first half (as if lifting the finger midway).
      const flat = strokes.flat();
      const half = Math.floor(flat.length / 2);
      expect(run(strokes, [...flat.slice(half), ...flat.slice(0, half)]).done).toBe(true);
    }
  });

  it('counts a wobbly line that stays near the number', () => {
    const strokes = digitCheckpoints(3);
    const wobbly = strokes.flat().map(([x, y], i) => [x + (i % 2 ? 6 : -6), y + (i % 3) * 3]);
    expect(run(strokes, wobbly).done).toBe(true);
  });

  it('needs most of the number covered', () => {
    const strokes = digitCheckpoints(5);
    const flat = strokes.flat();
    const part = run(strokes, flat.slice(0, Math.floor(flat.length * 0.5)));
    expect(part.done).toBe(false);
    expect(part.cover).toBeLessThan(FREE_COVER);
  });

  it('does not count sauce spread over the whole pizza', () => {
    const strokes = digitCheckpoints(1);
    const everywhere = [];
    for (let y = 5; y <= 135; y += 8) for (let x = 5; x <= 95; x += 8) everywhere.push([x, y]);
    const result = run(strokes, everywhere);
    expect(result.cover).toBeGreaterThanOrEqual(FREE_COVER);
    expect(result.done).toBe(false);
    expect(result.messy).toBe(true);
  });
});
