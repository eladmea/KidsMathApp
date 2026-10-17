// Content packs: every generator's pack exists in English, and any other
// language's pack offers what the English one does.
import { GENERATOR_PACK, GENERATORS } from '../src/curriculum/generators';
import { content, contentLanguages, packsOf } from '../src/content/index';

describe('content packs', () => {
  it('English has a pack for every generator', () => {
    Object.keys(GENERATORS).forEach((id) => expect(packsOf('en')).toContain(GENERATOR_PACK[id]));
  });

  it("other languages' packs export what English does", () => {
    contentLanguages()
      .filter((language) => language !== 'en')
      .forEach((language) => {
        packsOf(language).forEach((pack) => {
          const english = Object.keys(content(pack, 'en'));
          const theirs = Object.keys(content(pack, language));
          // A pack may replace generators instead of offering the same data.
          if (!theirs.includes('generators')) expect(english.filter((name) => !theirs.includes(name))).toEqual([]);
        });
      });
  });
});
