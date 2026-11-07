import { LEVELS, afterWrong, canPlace, isComplete, makeTower } from '../src/logic/blockTower';

describe('Block Tower', () => {
  it('makes towers of different-length blocks within the level', () => {
    Object.entries(LEVELS).forEach(([id, level]) => {
      for (let tower = 0; tower < level.towers; tower++) {
        for (let n = 0; n < 30; n++) {
          const blocks = makeTower(id, tower);
          expect(blocks).toHaveLength(level.blocks[tower]);
          expect(new Set(blocks).size).toBe(blocks.length);
          blocks.forEach((length) => expect(length >= 1 && length <= level.longest).toBe(true));
        }
      }
    });
  });

  it('keeps two neighbouring sizes in the later big towers, so counting matters', () => {
    for (let n = 0; n < 50; n++) {
      const blocks = makeTower('big', 3);
      expect(blocks.some((b) => blocks.includes(b + 1))).toBe(true);
    }
  });

  it('lets a block sit only on a bigger one', () => {
    expect(canPlace([], 2)).toBe(true);
    expect(canPlace([5], 3)).toBe(true);
    expect(canPlace([5, 3], 4)).toBe(false);
    expect(canPlace([5, 3], 3)).toBe(false);
  });

  it('is done when every block is on the tower', () => {
    expect(isComplete([5, 3, 1], [1, 3, 5])).toBe(true);
    expect(isComplete([5, 3], [1, 3, 5])).toBe(false);
  });

  it('knocks down only the wrong block for ages 3-4, the whole tower for 5-6', () => {
    expect(afterWrong('small', [5, 2])).toEqual([5, 2]);
    expect(afterWrong('big', [9, 6])).toEqual([]);
  });
});
