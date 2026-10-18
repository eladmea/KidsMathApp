// The Hebrew math pack: every math question comes out in Hebrew (no English
// words or broken templates), and counted nouns agree in gender and number.
import { setLanguage } from '../src/i18n/index';
import { GENERATORS, GENERATOR_PACK, generateQuestion } from '../src/curriculum/generators';
import { content } from '../src/content/index';
import { createDeck } from '../src/logic/memoryGame';

const RUNS = 300;
const MATH = Object.keys(GENERATORS).filter((id) => GENERATOR_PACK[id] === 'math');
const BROKEN = /[A-Za-z]|undefined|NaN|\{/;

describe('Hebrew math pack', () => {
  beforeAll(() => setLanguage('he'));
  afterAll(() => setLanguage('en'));

  it.each(MATH)('%s speaks Hebrew', (id) => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(id);
      const texts = [q.prompt, q.speech, q.explain, ...q.choices.map(String)];
      texts.forEach((text) => {
        expect(typeof text).toBe('string');
        expect(text).not.toMatch(BROKEN);
      });
    }
  });

  const { OBJECTS, TOPPING_NAMES, NUMBER_WORDS, say } = content('math', 'he');
  const apple = OBJECTS.find((o) => o.emoji === '🍎');
  const car = OBJECTS.find((o) => o.emoji === '🚗');

  it('counts with the noun’s gender', () => {
    expect(say.count.explain({ object: apple, count: 3 })).toBe('סופרים אחד אחד: 1, 2, 3. יש שלושה תפוחים!');
    expect(say.count.explain({ object: car, count: 3 })).toBe('סופרים אחד אחד: 1, 2, 3. יש שלוש מכוניות!');
    expect(say.count.explain({ object: apple, count: 1 })).toBe('סופרים אחד אחד: 1. יש תפוח אחד!');
    expect(say.count.explain({ object: car, count: 1 })).toBe('סופרים אחד אחד: 1. יש מכונית אחת!');
    expect(say.more.explain({ object: apple, more: 2, less: 1 })).toBe('שני תפוחים זה יותר מתפוח אחד.');
    expect(say.more.explain({ object: car, more: 7, less: 2 })).toBe('שבע מכוניות זה יותר משתי מכוניות.');
    expect(say.quickLook.explain({ count: 2 })).toBe('היו שתי נקודות.');
  });

  it('agrees in the games too', () => {
    expect(say.pizza.right({ number: 2, topping: TOPPING_NAMES.mushroom })).toMatch(/^שתי פטריות!/);
    expect(say.pizza.right({ number: 5, topping: TOPPING_NAMES.olive })).toMatch(/^חמישה זיתים!/);
    expect(say.pizza.order({ friend: 'דובי', number: 3, word: NUMBER_WORDS[3] })).toMatch(/^דובי רוצה פיצה! שלוש תוספות, בבקשה!/);
    expect(say.cake.iced({ number: 4, word: NUMBER_WORDS[4] })).toMatch(/ארבעה נרות/);
    expect(say.pizza.ate({ eaten: 1 })).toBe('פרוסה אחת! יאמי!');
    expect(say.memory.face({ kind: 'fraction', top: 3, bottom: 4 })).toBe('שלושה רבעים');
  });

  it('reads every Memory card in Hebrew', () => {
    ['dots', 'classic', 'fractions'].forEach((variant) => {
      createDeck(variant).forEach((card) => expect(say.memory.face(card.face)).not.toMatch(BROKEN));
    });
  });
});
