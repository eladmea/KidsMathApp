import { GENERATORS, buildChoices, generateQuestion } from '../curriculum/generators';

const RUNS_PER_GENERATOR = 300;

describe.each(Object.keys(GENERATORS))('generator %s', (generatorId) => {
  it('always produces a well-formed question', () => {
    for (let i = 0; i < RUNS_PER_GENERATOR; i++) {
      const q = generateQuestion(generatorId);
      expect(typeof q.prompt).toBe('string');
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(typeof q.speech).toBe('string');
      expect(q.speech.length).toBeGreaterThan(0);
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.choices.length).toBeLessThanOrEqual(4);
      q.choices.forEach((choice) => {
        if (typeof choice === 'number') {
          expect(Number.isInteger(choice)).toBe(true);
          expect(choice).toBeGreaterThanOrEqual(0);
        }
      });
    }
  });
});

describe('arithmetic answers are correct', () => {
  const OPS = {
    '+': (a, b) => a + b,
    '−': (a, b) => a - b,
    '×': (a, b) => a * b,
    '÷': (a, b) => a / b,
  };

  it.each(['add-10', 'sub-10', 'add-20', 'sub-20', 'add-100', 'sub-100', 'mult-2-5-10', 'mult-10', 'div-10', 'mult-12', 'div-12'])(
    '%s',
    (generatorId) => {
      for (let i = 0; i < RUNS_PER_GENERATOR; i++) {
        const q = generateQuestion(generatorId);
        const [, a, op, b] = q.prompt.match(/^(\d+) (.) (\d+) = \?$/);
        expect(OPS[op](Number(a), Number(b))).toBe(q.answer);
      }
    }
  );

  it('keeps add/sub within their stated ranges', () => {
    for (let i = 0; i < RUNS_PER_GENERATOR; i++) {
      expect(generateQuestion('add-10').answer).toBeLessThanOrEqual(10);
      expect(generateQuestion('add-20').answer).toBeLessThanOrEqual(20);
      expect(generateQuestion('add-100').answer).toBeLessThanOrEqual(100);
    }
  });
});

describe('young-child generators', () => {
  it('counting pictures match the answer', () => {
    for (let i = 0; i < RUNS_PER_GENERATOR; i++) {
      const five = generateQuestion('count-5');
      expect(five.visual.count).toBe(five.answer);
      expect(five.answer).toBeGreaterThanOrEqual(1);
      expect(five.answer).toBeLessThanOrEqual(5);
      expect(generateQuestion('count-10').answer).toBeLessThanOrEqual(10);
    }
  });

  it('"which has more" answer is the longer group', () => {
    for (let i = 0; i < RUNS_PER_GENERATOR; i++) {
      const q = generateQuestion('more-less');
      const lengths = q.choices.map((c) => Array.from(c).length);
      expect(Array.from(q.answer).length).toBe(Math.max(...lengths));
    }
  });

  it('take-away picture fades exactly the subtracted amount', () => {
    for (let i = 0; i < RUNS_PER_GENERATOR; i++) {
      const q = generateQuestion('sub-10');
      expect(q.visual.a - q.visual.b).toBe(q.answer);
    }
  });
});

describe('buildChoices', () => {
  it('terminates and stays in range when the answer sits on a bound', () => {
    expect(buildChoices(0, { min: 0, spread: 1 }).sort()).toEqual([0, 1]);
    const choices = buildChoices(1, { min: 1, max: 7, spread: 3 });
    expect(choices).toHaveLength(4);
    choices.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(7);
    });
  });

  it('throws on an unknown generator', () => {
    expect(() => generateQuestion('nope')).toThrow('Unknown generator');
  });
});
