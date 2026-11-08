import * as en from '../src/content/en/literacy';
import * as he from '../src/content/he/literacy';
import { LEVELS, bubblePool, catchTile, makeTargets, nextBubble, touches } from '../src/logic/letterCatcher';

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
});
