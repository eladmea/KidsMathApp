// Number Path Race: a linear number board game. Siegler & Ramani found that
// playing a *linear* 1-10 board game (moving a token while saying the numbers)
// improves young children's number sense. Position 0 is the Start square.

export const BOARDS = {
  10: { length: 10, spinnerMax: 2, rowLength: 10 },
  20: { length: 20, spinnerMax: 3, rowLength: 10 },
};

export function getBoard(length) {
  return BOARDS[length] || BOARDS[10];
}

export function spin(board, rng = Math.random) {
  return Math.floor(rng() * board.spinnerMax) + 1;
}

// Where a token ends up; it stops on the last square rather than overshooting.
export function targetSquare(position, steps, board) {
  return Math.min(position + steps, board.length);
}

// The squares a token passes through, which the child taps (and hears) in order.
export function stepSquares(position, steps, board) {
  const target = targetSquare(position, steps, board);
  return Array.from({ length: target - position }, (_, i) => position + i + 1);
}

export function hasWon(position, board) {
  return position >= board.length;
}
