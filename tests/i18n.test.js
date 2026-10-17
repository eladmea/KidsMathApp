// The language files: every key the code uses exists in English, other
// languages only use keys English has, and t() fills in, pluralises and
// falls back.
import fs from 'fs';
import path from 'path';
import { FALLBACK, keysOf, languages, list, raw, setLanguage, t } from '../src/i18n/index';

function sources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return full.endsWith('.js') ? [full] : [];
  });
}

describe('language files', () => {
  it('has English', () => {
    expect(languages()[0]).toMatchObject({ id: 'en', name: 'English', dir: 'ltr', speech: 'en-US' });
  });

  it('has every key the code asks for', () => {
    const missing = [];
    sources('src').forEach((file) => {
      const code = fs.readFileSync(file, 'utf8');
      for (const [, key] of code.matchAll(/\bt\(\s*'([a-zA-Z]+\.[a-zA-Z0-9_.-]+)'/g)) {
        if (raw(key, FALLBACK) === undefined) missing.push(`${file}: ${key}`);
      }
    });
    expect(missing).toEqual([]);
  });

  it('other languages only use keys English has', () => {
    const english = new Set(keysOf(FALLBACK));
    languages()
      .filter((language) => language.id !== FALLBACK)
      .forEach((language) => {
        expect(keysOf(language.id).filter((key) => !english.has(key))).toEqual([]);
      });
  });

  it('names every skill, island and age band', async () => {
    const { SKILLS } = await import('../src/curriculum/skills');
    const { SUBJECTS } = await import('../src/curriculum/subjects');
    const { AGE_BANDS } = await import('../src/curriculum/ageBands');
    SKILLS.forEach((skill) => expect(raw(`curriculum.skills.${skill.id}`)).toBeTruthy());
    SUBJECTS.forEach((subject) => expect(raw(`curriculum.subjects.${subject.id}`)).toBeTruthy());
    AGE_BANDS.forEach((band) => expect(raw(`curriculum.bands.${band.id}`)).toBeTruthy());
  });
});

describe('t()', () => {
  afterEach(() => setLanguage(FALLBACK));

  it('fills in values and picks plural forms', () => {
    expect(t('map.greeting', { name: 'Mia' })).toBe('Hi, Mia! Pick an island.');
    expect(t('stickers.count', { count: 1 })).toBe('1 sticker');
    expect(t('stickers.count', { count: 3 })).toBe('3 stickers');
  });

  it('falls back to English, then to the key', () => {
    setLanguage('xx');
    expect(t('map.review')).toBe('⭐ Daily Review');
    expect(t('nothing.here')).toBe('nothing.here');
  });

  it('joins lists the way the language does', () => {
    expect(list(['Count to 5', 'Find the Shape'])).toBe('Count to 5 and Find the Shape');
  });
});
