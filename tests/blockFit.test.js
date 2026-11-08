import { BLOCK_LETTERS as en } from '../src/content/en/literacy';
import { BLOCK_LETTERS as he } from '../src/content/he/literacy';
import { DIGIT_SHAPES, LEVELS, bounds, cellKey, cellsOf, cutShape, fits, isCovered, makeRound, normalise, turn, turned } from '../src/logic/blockFit';

// Puts every piece back as the solution says; returns the covered squares.
function solve(shape) {
  const cells = cellsOf(shape.rows);
  const covered = new Set();
  shape.pieces.forEach((piece) => {
    const solved = turned(piece.cells, 4 - piece.turns);
    expect(fits(cells, covered, solved, piece.at.r, piece.at.c)).toBe(true);
    solved.forEach((x) => covered.add(cellKey({ r: x.r + piece.at.r, c: x.c + piece.at.c })));
  });
  return { cells, covered };
}

describe('Block Fit', () => {
  it.each([
    ['digits', DIGIT_SHAPES],
    ['English letters', en],
    ['Hebrew letters', he],
  ])('cuts every %s shape, with and without big pieces', (_, shapes) => {
    Object.values(shapes).forEach((rows) => {
      [false, true].forEach((big) => {
        const sizes = [2, 4];
        for (let n = 0; n < 40; n++) {
          const pieces = cutShape(cellsOf(rows), sizes, Math.random, { big });
          expect(pieces, rows.join('/')).not.toBeNull();
          pieces.forEach((p) => expect(p.length >= sizes[0] && p.length <= sizes[1]).toBe(true));
          expect(pieces.flat().length).toBe(cellsOf(rows).length);
        }
      });
    });
  });

  it('cuts pieces that are each one connected block', () => {
    const pieces = cutShape(cellsOf(DIGIT_SHAPES[8]), [2, 4]);
    pieces.forEach((piece) => {
      const seen = new Set([cellKey(piece[0])]);
      let grew = true;
      while (grew) {
        grew = false;
        piece.forEach((x) => {
          if (seen.has(cellKey(x))) return;
          if ([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dr, dc]) => seen.has(cellKey({ r: x.r + dr, c: x.c + dc })))) {
            seen.add(cellKey(x));
            grew = true;
          }
        });
      }
      expect(seen.size).toBe(piece.length);
    });
  });

  it('deals rounds that can always be solved, in every level and language', () => {
    Object.keys(LEVELS).forEach((levelId) => {
      [en, he].forEach((letters) => {
        for (let n = 0; n < 20; n++) {
          makeRound(levelId, letters).forEach((shape) => {
            const { cells, covered } = solve(shape);
            expect(isCovered(cells, covered)).toBe(true);
          });
        }
      });
    });
  });

  it('turns pieces a quarter at a time, back to the start after four', () => {
    const l = normalise([{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }]);
    expect(bounds(turn(l))).toEqual({ rows: 2, cols: 3 });
    expect(turned(l, 4)).toEqual(l);
    expect(turned(turned(l, 3), 1)).toEqual(l);
  });

  it('only fits a piece on uncovered squares of the shape', () => {
    const seven = cellsOf(DIGIT_SHAPES[7]);
    const bar = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }];
    expect(fits(seven, new Set(), bar, 0, 0)).toBe(true);
    expect(fits(seven, new Set(), bar, 1, 0)).toBe(false);
    expect(fits(seven, new Set(['0,1']), bar, 0, 0)).toBe(false);
  });

  it('starts pieces turned only for the oldest', () => {
    makeRound('small').forEach((shape) => shape.pieces.forEach((p) => expect(p.turns).toBe(0)));
    expect(makeRound('turn', en).some((shape) => shape.pieces.some((p) => p.turns > 0))).toBe(true);
  });
});
