// Hebrew SEL and logic packs: every generated question is fully in Hebrew,
// with no unfilled values.
import { SEL_GENERATORS } from '../src/curriculum/selGenerators';
import { LOGIC_GENERATORS } from '../src/curriculum/logicGenerators';
import { FRIENDS } from '../src/logic/feelingsFriends';
import { OTHERS } from '../src/logic/bunnyPop';
import { content } from '../src/content/index';
import { getLanguage, setLanguage } from '../src/i18n/index';

const RUNS = 300;

function problems(text) {
  const found = [];
  if (/[A-Za-z]/.test(text)) found.push('english');
  if (/undefined|NaN|\{/.test(text)) found.push('unfilled');
  return found;
}

function check(text, where) {
  expect(typeof text === 'string' || typeof text === 'number', where).toBe(true);
  expect(problems(String(text)), `${where}: ${text}`).toEqual([]);
}

describe('Hebrew sel and logic packs', () => {
  let before;
  beforeAll(() => {
    before = getLanguage();
    setLanguage('he');
  });
  afterAll(() => setLanguage(before));

  it('uses the Hebrew packs', () => {
    expect(getLanguage()).toBe('he');
    expect(content('sel').FEELINGS.happy.word).toBe('שמחה');
    expect(content('logic').NAMES).toContain('נועה');
  });

  Object.entries({ ...SEL_GENERATORS, ...LOGIC_GENERATORS }).forEach(([id, generate]) => {
    it(`${id} is all Hebrew`, () => {
      for (let i = 0; i < RUNS; i++) {
        const q = generate();
        ['prompt', 'speech', 'explain'].forEach((field) => {
          if (q[field] != null) check(q[field], `${id}.${field}`);
        });
        q.choices.forEach((choice) => check(choice, `${id}.choice`));
      }
    });
  });

  it('Feelings Friends lines agree with each friend', () => {
    const { FRIENDS: WORDS, FEELINGS, say } = content('sel');
    FRIENDS.forEach((friend) => {
      const { name, story, helps, unhelpful, gender } = WORDS[friend.id];
      expect(['m', 'f']).toContain(gender);
      const feeling = FEELINGS[friend.feeling].word;
      const f = say.friends;
      [
        f.says({ name }),
        f.story({ name, story, question: f.feelQuestion({ name }) }),
        f.helpQuestion({ name }),
        f.feelRight({ name, feeling }),
        f.feelWrong({ name, feeling, story }),
        f.helpRight(),
        ...helps.map((helpful) => f.helpWrong({ name, helpful })),
        ...unhelpful,
      ].forEach((line) => check(line, friend.id));
      expect(helps).toHaveLength(friend.helps.length);
      expect(unhelpful).toHaveLength(friend.unhelpful.length);
    });
    expect(say.friends.feelRight({ name: 'ארנבונית', feeling: 'עצב' })).toBe('נכון! ארנבונית עצובה.');
    expect(say.friends.feelRight({ name: 'דובי', feeling: 'עצב' })).toBe('נכון! דובי עצוב.');
  });

  it('Bunny Pop names every other animal', () => {
    const { ANIMAL_NAMES, say } = content('logic');
    OTHERS.forEach((emoji) => check(say.bunnyOops({ animal: ANIMAL_NAMES[emoji] }), emoji));
  });
});
