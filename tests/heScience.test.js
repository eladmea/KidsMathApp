import { setLanguage } from '../src/i18n/index';
import { generateQuestion } from '../src/curriculum/generators';
import { SCIENCE_GENERATORS } from '../src/curriculum/scienceGenerators';
import { FUN_FACTS, GARDEN, say } from '../src/content/he/science';

const RUNS = 300;

function checkText(text) {
  expect(typeof text).toBe('string');
  expect(text.length).toBeGreaterThan(0);
  expect(text).not.toMatch(/[A-Za-z{]/);
}

describe('Hebrew science pack', () => {
  beforeAll(() => setLanguage('he'));
  afterAll(() => setLanguage('en'));

  it.each(Object.keys(SCIENCE_GENERATORS))('%s speaks only Hebrew', (id) => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(id);
      checkText(q.prompt);
      checkText(q.speech);
      if (q.explain) checkText(q.explain);
      if (q.visual && q.visual.caption) checkText(q.visual.caption);
      (q.items || []).forEach((item) => checkText(item.caption));
      if (q.type === 'order') {
        expect([...q.answer].sort()).toEqual(q.items.map((item) => item.id).sort());
      } else {
        q.choices.forEach((choice) => checkText(choice));
        expect(q.choices).toContain(q.answer);
      }
    }
  });

  it('garden and bubble lines are Hebrew', () => {
    const { garden } = say;
    Object.values(GARDEN.choices).forEach(({ clue, reason }) => {
      if (clue) checkText(garden.look({ clue }));
      checkText(garden.wrong({ reason }));
      GARDEN.stages.forEach((stage) => checkText(garden.grew({ reason, stage })));
    });
    expect(garden.bloomed({ flowers: 1 })).toContain('פרח אחד');
    expect(garden.bloomed({ flowers: 2 })).toContain('שני פרחים');
    expect(garden.bloomed({ flowers: 5 })).toContain('5 פרחים');
    checkText(garden.sticker({ emoji: '⭐' }));
    FUN_FACTS.forEach((fact) => checkText(fact));
  });
});
