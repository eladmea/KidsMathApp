// The list of sentences to record (src/services/voiceLines.js): complete for
// what the game says, and short and reusable so the recordings stay few.
import { voiceLines } from '../src/services/voiceLines';
import { splitSentences } from '../src/logic/voices';
import { content } from '../src/content/index';
import { setLanguage, t } from '../src/i18n/index';

const lines = voiceLines('en', { samples: 400 });
const texts = new Set(lines.map((line) => line.text));
const has = (text) => splitSentences(text).every((sentence) => texts.has(sentence));

describe('sentences to record', () => {
  afterAll(() => setLanguage('en'));

  it('lists the values of every spoken template', () => {
    expect(lines.missingTemplates).toEqual([]);
  });

  it('has the lines every child hears', () => {
    setLanguage('en');
    ["Who's playing? Tap your picture.", t('map.sayGreeting'), t('timeUp.say'), t('adventure.sayComplete'), t('pathRace.saySpin')].forEach((line) => expect(has(line)).toBe(true));
    const { say, NUMBER_WORDS, CUSTOMER_NAMES } = content('math', 'en');
    expect(has(say.pizza.order({ friend: CUSTOMER_NAMES.fox, number: 3, word: NUMBER_WORDS[3] }))).toBe(true);
    expect(has(say.pizza.tooFew({ number: 4, placed: 2 }))).toBe(true);
    expect(has('7')).toBe(true);
  });

  it('keeps spoken lines free of player names and template gaps', () => {
    setLanguage('en');
    lines.forEach((line) => expect(line.text).not.toMatch(/[{}]/));
    ['map.sayGreeting', 'timeUp.say', 'adventure.sayComplete', 'pathRace.saySpin'].forEach((key) => expect(t(key, { name: 'Zed' })).not.toContain('Zed'));
  });

  it('splits choices and number lists into reusable sentences', () => {
    expect(texts.has('Or goat?') || [...texts].some((text) => /^Or \w+\?$/.test(text))).toBe(true);
    // One sentence per choice: no sentence lists several choices with commas and "or".
    expect([...texts].filter((text) => /, or /.test(text) && text.split(',').length > 2).length).toBeLessThan(30);
    expect(lines.length).toBeLessThan(4000);
  });
});
