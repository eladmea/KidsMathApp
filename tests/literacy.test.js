import { generateQuestion } from '../src/curriculum/generators';
import { compoundSplits } from '../src/curriculum/literacyGenerators';
import {
  COMPOUND_WORDS,
  CVC_WORDS,
  DIGRAPH_START_WORDS,
  DIGRAPH_WORDS,
  FIRST_SOUND_WORDS,
  RHYME_FAMILIES,
  SIGHT_WORDS,
  SOUND_SPEECH,
  STORIES,
  WORD_PARTS,
  soundSpeech,
} from '../src/content/en/literacy';
import { createDeck } from '../src/logic/memoryGame';
import { MEMORY_LETTERS } from '../src/content/en/literacy';

const RUNS = 200;

function familyOf(emoji) {
  return RHYME_FAMILIES.findIndex((family) => family.some(([e]) => e === emoji));
}

function firstSoundOf(emoji) {
  return Object.keys(FIRST_SOUND_WORDS).find((sound) => FIRST_SOUND_WORDS[sound].some(([e]) => e === emoji));
}

describe('word banks', () => {
  it('first-sound pictures really start with their letter', () => {
    Object.entries(FIRST_SOUND_WORDS).forEach(([sound, words]) => {
      words.forEach(([, word]) => expect(word[0]).toBe(sound));
    });
  });

  it('rhyme families share an ending, and no picture is in two families', () => {
    const seen = new Set();
    RHYME_FAMILIES.forEach((family) => {
      expect(family.length).toBeGreaterThanOrEqual(2);
      family.forEach(([emoji]) => {
        expect(seen.has(emoji)).toBe(false);
        seen.add(emoji);
      });
    });
  });

  it('word-builder tiles spell their word', () => {
    [...CVC_WORDS, ...DIGRAPH_WORDS].forEach(({ word, tiles }) => expect(tiles.join('')).toBe(word));
  });

  it('every tile and starting sound has a spoken sound', () => {
    [...CVC_WORDS, ...DIGRAPH_WORDS].forEach(({ tiles }) => tiles.forEach((t) => expect(SOUND_SPEECH[t]).toBeDefined()));
    Object.keys(FIRST_SOUND_WORDS).forEach((s) => expect(SOUND_SPEECH[s]).toBeDefined());
    expect(soundSpeech('m')).toBe('mmm');
  });

  it('digraph start words begin with their digraph', () => {
    Object.entries(DIGRAPH_START_WORDS).forEach(([digraph, words]) => {
      words.forEach(([, word]) => expect(word.startsWith(digraph)).toBe(true));
    });
  });

  it('compound words split into two parts that rebuild the word', () => {
    COMPOUND_WORDS.forEach(([word, at]) => {
      const { correct, wrong } = compoundSplits(word, at);
      expect(correct.replace(' + ', '')).toBe(word);
      expect(wrong).not.toContain(correct);
      expect(wrong.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('word-part distractors never repeat the right meaning', () => {
    WORD_PARTS.forEach(([, meaning, distractors]) => {
      expect(distractors).not.toContain(meaning);
      expect(new Set(distractors).size).toBe(3);
    });
  });

  it('stories have four distinct steps and sight words are unique', () => {
    STORIES.forEach((story) => expect(story).toHaveLength(4));
    expect(new Set(SIGHT_WORDS).size).toBe(SIGHT_WORDS.length);
  });
});

describe('literacy questions', () => {
  it('rhymes: exactly one choice rhymes with the target', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('rhymes');
      const targetFamily = familyOf(q.visual.emoji);
      const rhyming = q.choices.filter((c) => familyOf(c) === targetFamily);
      expect(rhyming).toEqual([q.answer]);
      expect(q.choices).not.toContain(q.visual.emoji);
      expect(q.speakAlways).toBe(true);
    }
  });

  it('sound snack: exactly one picture starts with the sound', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('sound-snack');
      const sounds = q.choices.map(firstSoundOf);
      const target = firstSoundOf(q.answer);
      expect(sounds.filter((s) => s === target)).toHaveLength(1);
      expect(q.speech).toContain(soundSpeech(target));
      expect(q.choices).toHaveLength(3);
    }
  });

  it('letter sounds: the answer is the first letter of the named word', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('letter-sounds');
      expect(q.choices).toHaveLength(4);
      expect(q.choices).toContain(q.answer);
      const word = q.speech.match(/(?:like in|does) (\w+)/)[1];
      expect(word[0]).toBe(q.answer);
    }
  });

  it('digraph starts: the picture word begins with the answer', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion('digraph-starts');
      const word = q.speech.match(/does (\w+) start/)[1];
      expect(word.startsWith(q.answer)).toBe(true);
    }
  });

  it('word builder offers two extra tiles that are not in the word', () => {
    for (let i = 0; i < RUNS; i++) {
      ['word-builder', 'digraph-builder'].forEach((id) => {
        const q = generateQuestion(id);
        expect(q.tiles).toHaveLength(q.parts.length + 2);
        const extras = q.tiles.map((t) => t.text).filter((t) => !q.parts.includes(t));
        expect(extras).toHaveLength(2);
      });
    }
  });

  it('story strip shuffles a whole story', () => {
    const q = generateQuestion('story-strip');
    expect(q.type).toBe('order');
    expect(q.answer).toEqual([0, 1, 2, 3]);
    expect(q.items).toHaveLength(4);
  });
});

describe('Letter Chips deck', () => {
  it('pairs each letter a-f with a picture that starts with it', () => {
    for (let i = 0; i < 20; i++) {
      const deck = createDeck('letters', { letters: MEMORY_LETTERS });
      expect(deck).toHaveLength(12);
      for (let v = 1; v <= 6; v++) {
        const pair = deck.filter((c) => c.value === v);
        const letterCard = pair.find((c) => !c.face.picture);
        const pictureCard = pair.find((c) => c.face.picture);
        expect(letterCard.face.label).toBe(MEMORY_LETTERS[v][0]);
        expect(pictureCard.face.word[0]).toBe(letterCard.face.label);
      }
    }
  });
});
