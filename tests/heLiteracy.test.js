// The Hebrew reading pack: every literacy question comes out in Hebrew, with
// a reachable answer, and the word banks hold together.
import { GENERATORS, GENERATOR_PACK, generateQuestion } from '../src/curriculum/generators';
import { SKILLS } from '../src/curriculum/skills';
import { setLanguage } from '../src/i18n/index';
import { content } from '../src/content/index';
import { isCorrectAnswer } from '../src/logic/quizRound';
import { createDeck } from '../src/logic/memoryGame';
import * as he from '../src/content/he/literacy';

const RUNS = 300;
const LITERACY = Object.keys(GENERATORS).filter((id) => GENERATOR_PACK[id] === 'literacy');
const HEBREW_LETTER = /^[א-ת]$/;
const strip = (text) => text.replace(/[֑-ׇ]/g, ''); // without nikud

function texts(q) {
  return [
    q.prompt,
    q.speech,
    q.explain,
    q.visual && q.visual.caption,
    q.visual && q.visual.sound,
    ...(q.choices || []),
    ...(q.tiles || []).map((tile) => tile.text),
    ...(q.parts || []),
    ...(q.items || []).map((item) => item.caption),
    q.word,
  ].filter((text) => text != null);
}

// Can the answer be built from the tiles on offer?
function buildable(q) {
  const left = q.tiles.map((tile) => tile.text);
  return q.parts.every((part) => {
    const at = left.indexOf(part);
    if (at < 0) return false;
    left.splice(at, 1);
    return true;
  });
}

describe('Hebrew literacy pack', () => {
  beforeAll(() => setLanguage('he'));
  afterAll(() => setLanguage('en'));

  it('is the pack the game uses in Hebrew', () => {
    expect(content('literacy').SOUND_SPEECH).toBe(he.SOUND_SPEECH);
  });

  it('every literacy skill has a generator that runs in Hebrew', () => {
    SKILLS.filter((skill) => skill.subject === 'literacy' && skill.generator).forEach((skill) => {
      expect(LITERACY).toContain(skill.generator);
    });
  });

  LITERACY.forEach((id) => {
    it(`${id}: Hebrew only, and the answer is reachable`, () => {
      for (let i = 0; i < RUNS; i++) {
        const q = generateQuestion(id);
        texts(q).forEach((text) => {
          expect(String(text)).not.toMatch(/[A-Za-z]/);
          expect(String(text)).not.toMatch(/undefined|null|\{|\}/);
        });
        expect(q.prompt).toBeTruthy();
        expect(q.speech).toBeTruthy();
        if (q.type === 'build') {
          expect(q.parts.join('')).toBe(q.answer);
          expect(buildable(q)).toBe(true);
          expect(isCorrectAnswer(q, q.parts)).toBe(true);
          expect(q.tiles).toHaveLength(q.parts.length + 2);
          expect(q.tiles.map((t) => t.text).filter((t) => !q.parts.includes(t))).toHaveLength(2);
          q.tiles.forEach((tile) => expect(he.SOUND_SPEECH[tile.text]).toBeDefined());
        } else if (q.type === 'order') {
          expect([...q.answer].sort()).toEqual(q.items.map((item) => item.id).sort());
          expect(isCorrectAnswer(q, q.answer)).toBe(true);
        } else {
          expect(q.choices).toContain(q.answer);
          expect(new Set(q.choices).size).toBe(q.choices.length);
          expect(q.choices.length).toBeGreaterThanOrEqual(2);
          expect(q.choices.length).toBeLessThanOrEqual(4);
          expect(isCorrectAnswer(q, q.answer)).toBe(true);
        }
      }
    });
  });

  it('first-sound pictures start with their letter, and no picture is used twice', () => {
    const seen = new Set();
    Object.entries(he.FIRST_SOUND_WORDS).forEach(([letter, words]) => {
      expect(letter).toMatch(HEBREW_LETTER);
      expect(words.length).toBeGreaterThanOrEqual(2);
      words.forEach(([emoji, word]) => {
        expect(word[0]).toBe(letter);
        expect(seen.has(emoji)).toBe(false);
        seen.add(emoji);
      });
    });
    he.FIRST_SOUNDS_EARLY.forEach((letter) => expect(he.FIRST_SOUND_WORDS[letter]).toBeDefined());
  });

  // (ס and ש are both used: every ש picture starts with shin, not sin.)
  it('no two first-sound letters sound alike', () => {
    he.SOUND_ALIKE.filter((group) => group !== 'סש').forEach((group) => {
      expect([...group].filter((letter) => he.FIRST_SOUND_WORDS[letter]).length).toBeLessThanOrEqual(1);
    });
  });

  it('sound snack: exactly one picture starts with the letter', () => {
    const firstOf = (emoji) => Object.keys(he.FIRST_SOUND_WORDS).find((l) => he.FIRST_SOUND_WORDS[l].some(([e]) => e === emoji));
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('sound-snack');
      const target = firstOf(q.answer);
      expect(q.choices.map(firstOf).filter((l) => l === target)).toHaveLength(1);
      expect(q.speech).toContain(he.soundSpeech(target));
    }
  });

  it('rhymes: one rhyming picture, and no picture in two families', () => {
    const seen = new Set();
    he.RHYME_FAMILIES.forEach((family) => {
      expect(family.length).toBeGreaterThanOrEqual(2);
      family.forEach(([emoji]) => {
        expect(seen.has(emoji)).toBe(false);
        seen.add(emoji);
      });
    });
    const familyOf = (emoji) => he.RHYME_FAMILIES.findIndex((family) => family.some(([e]) => e === emoji));
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('rhymes');
      expect(q.choices.filter((c) => familyOf(c) === familyOf(q.visual.emoji))).toEqual([q.answer]);
    }
  });

  it('letter questions: the answer is the first letter of the word', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('letter-sounds');
      expect(q.choices).toHaveLength(4);
      const word = q.speech.match(/(?:במילה|המילה) ([א-ת]+)/)[1];
      expect(word[0]).toBe(q.answer);
    }
  });

  it('final letters: the word ends with the answer, and builder words end with a final letter', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('digraph-starts');
      const word = q.speech.match(/המילה ([א-ת]+)/)[1];
      expect(word[word.length - 1]).toBe(q.answer);
    }
    Object.entries(he.DIGRAPH_START_WORDS).forEach(([letter, words]) => words.forEach(([, word]) => expect(word.endsWith(letter)).toBe(true)));
    he.DIGRAPH_WORDS.forEach(({ word }) => expect(Object.keys(he.FINAL_TWINS)).toContain(word[word.length - 1]));
    // The regular twin of the final letter is offered, to choose between.
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('digraph-builder');
      const twin = he.FINAL_TWINS[q.parts[q.parts.length - 1]];
      expect(q.tiles.map((t) => t.text)).toContain(twin);
    }
  });

  it('word builder: extra tiles never sound like a letter in the word', () => {
    const alike = (a, b) => a === b || he.SOUND_ALIKE.some((group) => group.includes(a) && group.includes(b));
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('word-builder');
      const extras = q.tiles.map((t) => t.text).filter((t) => !q.parts.includes(t));
      extras.forEach((extra) => q.parts.forEach((part) => expect(alike(extra, part)).toBe(false)));
    }
  });

  it('word banks: tiles spell words, a final letter only ends a word', () => {
    [...he.CVC_WORDS, ...he.DIGRAPH_WORDS].forEach(({ word, tiles }) => {
      expect(tiles.join('')).toBe(word);
      tiles.slice(0, -1).forEach((tile) => expect(Object.keys(he.FINAL_TWINS)).not.toContain(tile));
    });
    he.CVC_WORDS.forEach(({ tiles }) => tiles.forEach((tile) => expect(he.ALPHABET).toContain(tile)));
    expect(he.ALPHABET).toHaveLength(22);
    expect(new Set(he.SIGHT_WORDS).size).toBe(he.SIGHT_WORDS.length);
    expect(new Set(he.SIGHT_WORDS.map(strip)).size).toBe(he.SIGHT_WORDS.length);
    he.STORIES.forEach((story) => expect(story).toHaveLength(4));
    he.WORD_PARTS.forEach(([, meaning, distractors]) => {
      expect(distractors).not.toContain(meaning);
      expect(new Set(distractors).size).toBe(3);
    });
  });

  it('compound words: right parts, three wrong cuts', () => {
    he.COMPOUND_WORDS.forEach(([word, parts]) => {
      const { correct, wrong } = he.compoundChoices(word, parts);
      expect(wrong.length).toBeGreaterThanOrEqual(3);
      expect(wrong).not.toContain(correct);
      wrong.forEach((cut) => expect(cut.replace(' + ', '')).toBe(word));
    });
  });

  it('Letter Chips pair א–ו with pictures that start with them', () => {
    const deck = createDeck('letters', { letters: he.MEMORY_LETTERS });
    expect(deck).toHaveLength(12);
    for (let v = 1; v <= 6; v++) {
      const pair = deck.filter((c) => c.value === v);
      const letter = pair.find((c) => !c.face.picture).face.label;
      expect(letter).toBe(he.ALPHABET[v - 1]);
      expect(pair.find((c) => c.face.picture).face.word[0]).toBe(letter);
    }
  });

  it('lists choices one sentence each', () => {
    expect(he.listWords(['טבעת', 'עץ', 'עז'])).toBe('טבעת. עץ. או עז');
    expect(he.listWords(['עץ'])).toBe('עץ');
  });
});
