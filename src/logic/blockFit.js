// Block Fit: a digit or a letter is drawn as a shape of grid squares, and the
// child drags blocks onto it until it is covered exactly. The game cuts the
// shape itself into random pieces of 2-4 squares, so every puzzle can be
// solved. Digits are on Number Island; letters (from each language's pack,
// BLOCK_LETTERS) on Word Woods. The oldest turn the pieces too.

// Digits on a 3 x 5 grid ('#' = a square).
export const DIGIT_SHAPES = {
  0: ['###', '#.#', '#.#', '#.#', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['###', '..#', '###', '#..', '###'],
  3: ['###', '..#', '###', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'],
  7: ['###', '..#', '..#', '..#', '..#'],
  8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '###'],
};

// Per level: digits or letters, which ones, how many shapes, whether to
// prefer big pieces (fewer of them), whether faint outlines show where pieces
// go, and whether pieces start turned (tap to turn them). Pieces are 2-4
// squares: some shapes (a 4, an F) can't be cut into 3s and 4s only.
export const SIZES = [2, 4];
export const LEVELS = {
  small: { source: 'digits', pool: ['0', '1', '4', '7'], shapes: 4, big: true, ghosts: true, turn: false },
  digits: { source: 'digits', pool: null, shapes: 5, big: false, ghosts: false, turn: false },
  letters: { source: 'letters', pool: null, shapes: 5, big: false, ghosts: false, turn: false },
  turn: { source: 'letters', pool: null, shapes: 5, big: true, ghosts: false, turn: true },
};

export function getLevel(levelId) {
  return LEVELS[levelId] || LEVELS.small;
}

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const key = ({ r, c }) => `${r},${c}`;

// The squares of a shape: [{ r, c }].
export function cellsOf(rows) {
  return rows.flatMap((row, r) => [...row].map((ch, c) => (ch === '#' ? { r, c } : null)).filter(Boolean));
}

export const sizeOf = (rows) => ({ rows: rows.length, cols: Math.max(...rows.map((row) => row.length)) });

const neighbours = ({ r, c }) => [{ r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }];

// Cuts the shape's squares into connected pieces of sizes[0]..sizes[1]
// squares (mostly the biggest, with `big`). Tries random cuts until one
// works; null if none does.
export function cutShape(cells, [min, max], rng = Math.random, { big = false, tries = 400 } = {}) {
  const all = new Set(cells.map(key));
  for (let attempt = 0; attempt < tries; attempt++) {
    const free = new Set(all);
    const pieces = [];
    let ok = true;
    while (free.size && ok) {
      // Start from the free square with the fewest free neighbours, so no
      // square is left stranded on its own.
      const start = [...free]
        .map((k) => {
          const [r, c] = k.split(',').map(Number);
          return { r, c, n: neighbours({ r, c }).filter((x) => free.has(key(x))).length, tie: rng() };
        })
        .sort((a, b) => a.n - b.n || a.tie - b.tie)[0];
      const target = big && rng() < 0.8 ? max : min + Math.floor(rng() * (max - min + 1));
      const piece = [{ r: start.r, c: start.c }];
      free.delete(key(start));
      while (piece.length < target) {
        const options = piece.flatMap(neighbours).filter((x) => free.has(key(x)));
        if (!options.length) break;
        const next = options[Math.floor(rng() * options.length)];
        piece.push(next);
        free.delete(key(next));
      }
      if (piece.length < min) ok = false;
      else pieces.push(piece);
    }
    if (ok) return pieces;
  }
  return null;
}

// A piece's squares moved so its top-left corner is (0, 0).
export function normalise(cells) {
  const r0 = Math.min(...cells.map((x) => x.r));
  const c0 = Math.min(...cells.map((x) => x.c));
  return cells.map(({ r, c }) => ({ r: r - r0, c: c - c0 })).sort((a, b) => a.r - b.r || a.c - b.c);
}

// A quarter turn clockwise.
export function turn(cells) {
  return normalise(cells.map(({ r, c }) => ({ r: c, c: -r })));
}

export function turned(cells, times) {
  let out = normalise(cells);
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) out = turn(out);
  return out;
}

export const bounds = (cells) => ({ rows: Math.max(...cells.map((x) => x.r)) + 1, cols: Math.max(...cells.map((x) => x.c)) + 1 });

// Can `piece` (normalised squares) go with its top-left at (r, c)? Every
// square must be on the shape and not already covered.
export function fits(shapeCells, covered, piece, r, c) {
  const shape = new Set(shapeCells.map(key));
  return piece.every((x) => {
    const k = key({ r: x.r + r, c: x.c + c });
    return shape.has(k) && !covered.has(k);
  });
}

// The shapes of a round and their pieces: [{ id, rows, pieces: [{ id,
// cells (normalised, as dealt), turns, at: { r, c } }] }]. `at` is where the
// piece goes when turned back to `turns` 0.
export function makeRound(levelId, letters = {}, rng = Math.random) {
  const level = getLevel(levelId);
  const shapes = level.source === 'digits' ? DIGIT_SHAPES : letters;
  const pool = level.pool || Object.keys(shapes);
  return shuffle(pool, rng)
    .slice(0, level.shapes)
    .map((id) => {
      const rows = shapes[id];
      const cut = cutShape(cellsOf(rows), SIZES, rng, { big: level.big });
      const pieces = shuffle(cut, rng).map((cells, i) => {
        const solved = normalise(cells);
        const r0 = Math.min(...cells.map((x) => x.r));
        const c0 = Math.min(...cells.map((x) => x.c));
        const turns = level.turn ? 1 + Math.floor(rng() * 3) : 0;
        return { id: i, solved, cells: turned(solved, turns), turns, at: { r: r0, c: c0 } };
      });
      return { id, rows, pieces };
    });
}

export const isCovered = (shapeCells, covered) => shapeCells.every((x) => covered.has(key(x)));

export { key as cellKey };
