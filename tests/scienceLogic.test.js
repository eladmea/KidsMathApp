import { generateQuestion } from '../src/curriculum/generators';
import { ANIMAL_HOMES, FOOD_CHAINS, LIFE_CYCLES, MATTER, NOT_PLANT_NEEDS, PLANT_NEEDS, PUSH_PULL, WEATHER } from '../src/curriculum/scienceGenerators';
import { makeLogicGrid, solveLogicGrid } from '../src/curriculum/logicGenerators';

const RUNS = 200;

describe('science questions', () => {
  it('dress for weather: exactly one choice suits the weather', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('dress-weather');
      const weather = WEATHER.find((w) => w.emoji === q.visual.emoji);
      const suitable = q.choices.filter((c) => weather.items.some(([e]) => e === c));
      expect(suitable).toEqual([q.answer]);
    }
  });

  it('animal homes: the answer is the animal\'s habitat', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('animal-homes');
      const habitat = ANIMAL_HOMES.find((h) => h.animals.some(([e]) => e === q.visual.emoji));
      expect(q.answer).toBe(habitat.home[0]);
      expect(new Set(q.choices).size).toBe(3);
    }
  });

  it('plant needs: one real need among silly options', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('plant-needs');
      const real = q.choices.filter((c) => PLANT_NEEDS.some(([e]) => e === c));
      expect(real).toEqual([q.answer]);
      q.choices.filter((c) => c !== q.answer).forEach((c) => expect(NOT_PLANT_NEEDS.some(([e]) => e === c)).toBe(true));
    }
  });

  it('push or pull and states of matter use the labelled answer', () => {
    for (let i = 0; i < RUNS; i++) {
      const pp = generateQuestion('push-pull');
      expect(PUSH_PULL.find(([e, action]) => e === pp.visual.emoji && action === pp.visual.caption)[2]).toBe(pp.answer);
      const m = generateQuestion('states-of-matter');
      expect(MATTER.find(([e, name]) => e === m.visual.emoji && name === m.visual.caption)[2]).toBe(m.answer);
    }
  });

  it('life cycles and food chains are four-step order questions', () => {
    [...LIFE_CYCLES, ...FOOD_CHAINS].forEach((set) => expect(set).toHaveLength(4));
    ['life-cycles', 'food-chains'].forEach((id) => {
      const q = generateQuestion(id);
      expect(q.type).toBe('order');
      expect(q.answer).toEqual([0, 1, 2, 3]);
    });
  });
});

describe('logic questions', () => {
  it('logic grids always have exactly one solution and need deduction', () => {
    for (let i = 0; i < 100; i++) {
      const { truth, clues, ask } = makeLogicGrid(3);
      const solutions = solveLogicGrid(3, clues);
      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual(truth);
      expect(clues.some((c) => c.person === ask && c.has)).toBe(false);
      // Every clue is needed.
      clues.forEach((_, j) => expect(solveLogicGrid(3, clues.filter((__, k) => k !== j)).length).toBeGreaterThan(1));
    }
  });

  it('logic grid questions read naturally and offer the three pets', () => {
    const q = generateQuestion('logic-grids');
    expect(q.prompt).toMatch(/Which pet is \w+'s\?$/);
    expect(q.choices).toHaveLength(3);
    expect(q.choices).toContain(q.answer);
  });
});
