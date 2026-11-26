import fs from 'fs';
import * as en from '../src/content/en/literacy';
import * as he from '../src/content/he/literacy';
import { HIDES, PLACES, PLACE_IDS, THINGS_SHOWN, allLines, firstLetter, foundLine, letterSpeech, makeRound, movedAway, nextPlace, pickThings, placeThings, soundsAlike, spots } from '../src/logic/letterHide';
import { splitSentences } from '../src/logic/voices';
import { clipUrl } from '../src/services/voiceClips';
import { raw, setLanguage } from '../src/i18n/index';

const PACKS = [
  ['en', en],
  ['he', he],
];

describe('Letter Hide and Seek', () => {
  it('names every thing in every language, and nothing else', () => {
    const ids = PLACE_IDS.flatMap((placeId) => PLACES[placeId].things.map((thing) => thing.id));
    PACKS.forEach(([, pack]) => expect(Object.keys(pack.HIDE_WORDS).sort()).toEqual([...ids].sort()));
  });

  it('gives every thing a way to hide the letter and a picture to draw', () => {
    PLACE_IDS.forEach((placeId) => PLACES[placeId].things.forEach((thing) => {
      expect(HIDES).toContain(thing.hide);
      expect(thing.emoji).toBeTruthy();
      expect(fs.existsSync(`src/assets/images/${thing.key}.webp`), thing.key).toBe(true);
    }));
    PLACE_IDS.forEach((placeId) => expect(fs.existsSync(`src/assets/backdrops/LetterHide-${placeId}.webp`), placeId).toBe(true));
  });

  it('hides a letter under the first letter of the word', () => {
    expect(firstLetter('ספר')).toBe('ס');
    expect(firstLetter('Book')).toBe('b');
    expect(placeThings('room', he).find((thing) => thing.id === 'book')).toMatchObject({ word: 'ספר', letter: 'ס' });
  });

  it('knows letters that sound alike in Hebrew', () => {
    expect(soundsAlike('ס', 'ש', he)).toBe(true);
    expect(soundsAlike('כ', 'ק', he)).toBe(true);
    expect(soundsAlike('ס', 'ד', he)).toBe(false);
    expect(soundsAlike('b', 'b', en)).toBe(true);
    expect(soundsAlike('b', 'd', en)).toBe(false);
  });

  it.each(PACKS)('%s: shows four things in every place, with letters that differ and do not sound alike', (_, pack) => {
    PLACE_IDS.forEach((placeId) => {
      for (let n = 0; n < 40; n++) {
        const things = pickThings(placeId, pack);
        expect(things).toHaveLength(THINGS_SHOWN);
        things.forEach((a, i) => things.slice(i + 1).forEach((b) => expect(soundsAlike(a.letter, b.letter, pack), `${a.word} ${b.word}`).toBe(false)));
      }
    });
  });

  it.each(PACKS)('%s: a round hides the letter once in each thing shown', (_, pack) => {
    PLACE_IDS.forEach((placeId) => {
      const round = makeRound(placeId, pack);
      expect(round.place).toBe(placeId);
      expect([...round.finds].sort()).toEqual(round.things.map((thing) => thing.id).sort());
    });
  });

  it('plays somewhere new each round', () => {
    const seen = [];
    let place;
    PLACE_IDS.forEach(() => seen.push((place = nextPlace(place))));
    expect([...seen].sort()).toEqual([...PLACE_IDS].sort());
    expect(nextPlace(PLACE_IDS[PLACE_IDS.length - 1])).toBe(PLACE_IDS[0]);
  });

  it('stands the things across the floor, inside the safe area', () => {
    const row = spots(THINGS_SHOWN);
    expect(row).toHaveLength(THINGS_SHOWN);
    row.forEach((spot, i) => {
      expect(spot.x).toBeGreaterThan(120);
      expect(spot.x).toBeLessThan(1160);
      expect(spot.y).toBeLessThan(620);
      if (i) expect(spot.x).toBeGreaterThan(row[i - 1].x);
    });
  });

  it('shows what was behind a thing only once it is moved away', () => {
    expect(movedAway({ x: 100, y: 100 }, 130, 120)).toBe(false);
    expect(movedAway({ x: 100, y: 100 }, 220, 100)).toBe(true);
  });

  it('says the thing, then its letter, as two sentences', () => {
    const book = placeThings('room', he).find((thing) => thing.id === 'book');
    expect(splitSentences(foundLine(he, book))).toEqual(['ספר.', 'סָמֶךְ.']);
    const sun = { word: 'robot', letter: 'r' };
    expect(foundLine(en, sun)).toBe('robot. rrr.');
    expect(letterSpeech(en, 'b')).toBe('buh');
  });

  it.each(PACKS)('%s: says every line from a recording, never the device voice', (language, pack) => {
    setLanguage(language);
    const keys = ['intro', 'hiding', 'where', 'look', 'notHere', 'found'].map((key) => raw(`letterHide.${key}`, language));
    const lines = [...allLines(pack), ...keys];
    const unrecorded = lines.flatMap((line) => splitSentences(line)).filter((sentence) => !clipUrl(sentence, language));
    setLanguage('en');
    expect(unrecorded).toEqual([]);
  });
});
