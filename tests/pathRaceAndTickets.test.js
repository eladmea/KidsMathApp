import { BOARDS, getBoard, hasWon, spin, stepSquares, targetSquare } from '../src/logic/pathRace';
import { applyFinishedRound, canSpendTicket, roundsUntilNextTicket, ROUNDS_PER_TICKET } from '../src/logic/funTickets';
import { buildPlayers, BUDDY } from '../src/logic/players';

describe('number path race', () => {
  it('spins within the board spinner range', () => {
    const board = getBoard(10);
    for (let i = 0; i < 100; i++) {
      const s = spin(board);
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(board.spinnerMax);
    }
    expect(spin(board, () => 0)).toBe(1);
    expect(spin(board, () => 0.999)).toBe(2);
  });

  it('lists every square hopped through, in order', () => {
    expect(stepSquares(0, 2, BOARDS[10])).toEqual([1, 2]);
    expect(stepSquares(4, 3, BOARDS[20])).toEqual([5, 6, 7]);
  });

  it('stops on the last square instead of overshooting', () => {
    expect(targetSquare(9, 2, BOARDS[10])).toBe(10);
    expect(stepSquares(9, 2, BOARDS[10])).toEqual([10]);
    expect(hasWon(10, BOARDS[10])).toBe(true);
    expect(hasWon(9, BOARDS[10])).toBe(false);
  });

  it('falls back to the 1-10 board', () => {
    expect(getBoard(undefined)).toBe(BOARDS[10]);
    expect(getBoard(20).length).toBe(20);
  });
});

describe('fun break tickets', () => {
  it(`earns a ticket every ${ROUNDS_PER_TICKET} rounds`, () => {
    let profile = {};
    const earned = [];
    for (let i = 0; i < 4; i++) {
      const result = applyFinishedRound(profile);
      earned.push(result.earnedTicket);
      profile = { ...profile, ...result.changes };
    }
    expect(earned).toEqual([false, true, false, true]);
    expect(profile.funTickets).toBe(2);
    expect(profile.roundsCompleted).toBe(4);
  });

  it('reports rounds to go and whether a ticket can be spent', () => {
    expect(roundsUntilNextTicket({})).toBe(ROUNDS_PER_TICKET);
    expect(roundsUntilNextTicket({ roundsCompleted: 1 })).toBe(1);
    expect(canSpendTicket({ funTickets: 0 })).toBe(false);
    expect(canSpendTicket({ funTickets: 1 })).toBe(true);
  });
});

describe('players', () => {
  const profile = { name: 'Mia', avatar: '🐸' };

  it('makes the child player 1 and the buddy player 2 in solo mode', () => {
    const players = buildPlayers(profile, 'solo');
    expect(players[1]).toMatchObject({ name: 'Mia', icon: '🐸' });
    expect(players[2]).toMatchObject(BUDDY);
  });

  it('gives a friend a different icon from the child in duo mode', () => {
    const players = buildPlayers(profile, 'duo');
    expect(players[2]).toMatchObject({ id: 'player2', name: null });
    expect(players[2].icon).not.toBe('🐸');
  });
});
