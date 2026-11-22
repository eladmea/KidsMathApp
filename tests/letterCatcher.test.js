import * as en from '../src/content/en/literacy';
import * as he from '../src/content/he/literacy';
import { LEVELS, allLines, bubblePool, catchTile, makeTargets, nextBubble, touches, touchesOnTheWay, wordLine } from '../src/logic/letterCatcher';
import { splitSentences } from '../src/logic/voices';
import { clipUrl } from '../src/services/voiceClips';

describe('Letter Catcher', () => {
  it.each([
    ['en', en],
    ['he', he],
  ])('%s: makes targets whose tiles can all float in a bubble', (_, pack) => {
    Object.entries(LEVELS).forEach(([id, level]) => {
      for (let n = 0; n < 30; n++) {
        const targets = makeTargets(id, pack);
        expect(targets).toHaveLength(level.words);
        expect(new Set(targets.map((tg) => tg.word)).size).toBe(level.words);
        const pool = bubblePool(id, pack);
        targets.forEach((tg) => {
          expect(tg.emoji && tg.word).toBeTruthy();
          tg.tiles.forEach((tile) => expect(pool).toContain(tile));
        });
      }
    });
  });

  it('one-letter targets show a picture that starts with the letter', () => {
    makeTargets('letter', en).forEach((tg) => {
      expect(tg.tiles).toHaveLength(1);
      expect(tg.word.startsWith(tg.tiles[0])).toBe(true);
    });
  });

  it('always puts the needed letter in a bubble when none shows it', () => {
    const pool = bubblePool('word', en);
    expect(nextBubble('a', ['c', 't'], pool)).toBe('a');
    for (let n = 0; n < 50; n++) {
      const tile = nextBubble('a', ['a', 'c', 't'], pool);
      expect(['a', 'c', 't']).not.toContain(tile);
    }
  });

  it('catches the letters of a word only in order', () => {
    const cat = ['c', 'a', 't'];
    expect(catchTile(cat, 0, 'a')).toEqual({ right: false, caught: 0, done: false });
    expect(catchTile(cat, 0, 'c')).toEqual({ right: true, caught: 1, done: false });
    expect(catchTile(cat, 2, 't')).toEqual({ right: true, caught: 3, done: true });
    expect(catchTile(['sh', 'i', 'p'], 0, 'sh').right).toBe(true);
  });

  it('knows when the ball touches a bubble', () => {
    expect(touches({ x: 100, y: 100 }, { x: 130, y: 120 }, 60)).toBe(true);
    expect(touches({ x: 100, y: 100 }, { x: 200, y: 100 }, 60)).toBe(false);
  });

  it('catches a bubble the ball passed in one slow frame', () => {
    // The ball jumped from y 506 to 326: it went through the bubble at 468.
    const ball = { x: 900, y: 326 };
    expect(touches(ball, { x: 905, y: 468 }, 54)).toBe(false);
    expect(touchesOnTheWay(ball, 506, { x: 905, y: 468 }, 54)).toBe(true);
    // Not one off to the side, nor one still above the ball.
    expect(touchesOnTheWay(ball, 506, { x: 1000, y: 468 }, 54)).toBe(false);
    expect(touchesOnTheWay(ball, 506, { x: 900, y: 200 }, 54)).toBe(false);
  });

  it.each([
    ['en', en],
    ['he', he],
  ])('%s: says every word and letter sound from a recording, never the device voice', (language, pack) => {
    const lines = allLines(pack);
    Object.keys(LEVELS).forEach((id) => makeTargets(id, pack).forEach((target) => expect(lines).toContain(wordLine(id, target, pack))));
    const unrecorded = lines.flatMap((line) => splitSentences(line)).filter((sentence) => !clipUrl(sentence, language));
    expect(unrecorded).toEqual([]);
  });

  it('says a one-letter word and then its sound, as two sentences', () => {
    expect(wordLine('letter', { word: 'sun', tiles: ['s'] }, en)).toBe('sun. sss.');
    expect(splitSentences(wordLine('letter', { word: 'sun', tiles: ['s'] }, en))).toEqual(['sun.', 'sss.']);
    expect(wordLine('word', { word: 'cat', tiles: ['c', 'a', 't'] }, en)).toBe('cat');
  });
});
