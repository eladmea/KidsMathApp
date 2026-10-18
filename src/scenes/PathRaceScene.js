import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { speak } from '../services/speech';
import { play } from '../services/audio';
import { getBoard, hasWon, spin, stepSquares } from '../logic/pathRace';
import { buildPlayers } from '../logic/players';
import { otherPlayer } from '../logic/memoryGame';
import { t } from '../i18n/index';

// Number Path Race: a straight 1-10 (or 1-20) board. Spin, then hop your
// token one square at a time, tapping and hearing each number (playing a
// linear number board game builds number sense). Against the buddy or a
// friend; first to the end wins.
//   data: { board: 10 | 20, mode: 'solo' | 'duo' }
const BUDDY_STEP_MS = 750;
const BUDDY_SPIN_DELAY_MS = 900;
const TURN_PAUSE_MS = 700;
const BOARD = { left: 110, top: 290, width: 1060, rowGap: 16 };

export default class PathRaceScene extends BaseScene {
  static key = 'PathRace';

  build({ board = 10, mode = 'solo' } = {}) {
    this.board = getBoard(Number(board));
    this.solo = mode !== 'duo';
    this.players = buildPlayers(session.profile, this.solo ? 'solo' : 'duo');
    Object.values(this.players).forEach((player) => {
      if (!player.name) player.name = t(`twoPlayer.${player.id}`);
    });
    this.positions = { 1: 0, 2: 0 };
    this.current = 1;
    this.spun = null;
    this.pending = [];
    this.winner = null;
    this.tokens = [];
    this.buddyTimer = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff8e1).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.add.text(30, 150, t('pathRace.title', { max: this.board.length }), textStyle(24, COLORS.gray)).setOrigin(0, 0.5);
    this.startBox = this.add.rectangle(BOARD.left + 120, 210, 240, 70, COLORS.white).setRounded(20).setStrokeStyle(3, 0xe0c9a6);
    this.add.text(BOARD.left + 50, 210, t('pathRace.start'), textStyle(24, COLORS.gray)).setOrigin(0.5);
    this.drawBoard();
    this.spinner = this.add.circle(500, 645, 50, COLORS.white).setStrokeStyle(5, COLORS.orange);
    this.spinnerText = this.add.text(500, 645, '?', textStyle(48)).setOrigin(0.5);
    this.status = this.add.text(760, 645, '', textStyle(28, COLORS.ink)).setOrigin(0.5);
    this.spinButton = new Button(this, 760, 645, { label: t('pathRace.spin'), width: 260, height: 90, color: COLORS.primary, onTap: () => this.doSpin() });
    this.tag('spin', this.spinButton.box);
    this.startTurn();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  get buddyTurn() {
    return this.solo && this.current === 2;
  }

  drawBoard() {
    const { length, rowLength } = this.board;
    const size = BOARD.width / rowLength - 8;
    this.squareSize = size;
    this.squares = {};
    for (let square = 1; square <= length; square++) {
      const i = square - 1;
      const x = BOARD.left + (i % rowLength) * (size + 8) + size / 2;
      const y = BOARD.top + Math.floor(i / rowLength) * (size * 1.3 + BOARD.rowGap) + (size * 1.3) / 2;
      const box = this.add.rectangle(x, y, size, size * 1.3, square === length ? 0xffe08a : COLORS.white).setRounded(16).setStrokeStyle(3, 0xd9c7a1).setInteractive({ useHandCursor: true });
      box.on('pointerup', () => this.tapSquare(square));
      this.tag(`square:${square}`, box);
      this.add.text(x, y - size * 0.28, String(square), textStyle(Math.round(size * 0.38))).setOrigin(0.5);
      this.squares[square] = { box, x, y };
    }
  }

  drawTokens() {
    this.tokens.forEach((token) => token.destroy());
    this.tokens = [1, 2].map((p) => {
      const at = this.positions[p];
      const offset = p === 1 ? -22 : 22;
      if (at === 0) return glyph(this, BOARD.left + 175 + offset * 1.7, 210, this.players[p].icon, 40);
      const { x, y } = this.squares[at];
      return glyph(this, x + offset * (this.positions[1] === this.positions[2] ? 1 : 0), y + this.squareSize * 0.25, this.players[p].icon, this.squareSize * 0.4);
    });
    const next = this.pending[0];
    Object.entries(this.squares).forEach(([square, { box }]) => {
      const n = Number(square);
      const isNext = n === next && !this.buddyTurn;
      box.setStrokeStyle(isNext ? 6 : 3, isNext ? colorOf(this.players[this.current].main) : n === this.hint ? COLORS.orange : 0xd9c7a1);
    });
  }

  refresh() {
    const player = this.players[this.current];
    this.drawTokens();
    this.spinnerText.setText(this.spun === null ? '?' : String(this.spun));
    const canSpin = !this.winner && !this.buddyTurn && this.spun === null;
    this.spinButton.setVisible(canSpin).setColor(colorOf(player.main));
    let status = '';
    if (!this.winner && this.buddyTurn) status = t('twoPlayer.buddyPlaying', { name: player.icon });
    else if (!this.winner && this.spun !== null) status = this.pending.length ? t('pathRace.tap', { square: this.pending[0] }) : t('pathRace.nice');
    this.status.setText(status);
    if (!this.winner) this.narrator.text.setText(this.buddyTurn ? t('twoPlayer.buddyPlaying', { name: player.name }) : t('twoPlayer.turn', { name: `${player.icon} ${player.name}` }));
    this.report({
      step: this.winner ? 'over' : this.spun === null ? 'spin' : 'hop',
      board: this.board.length,
      current: this.current,
      buddyTurn: this.buddyTurn,
      positions: { ...this.positions },
      spun: this.spun,
      pending: [...this.pending],
      winner: this.winner,
    });
    this.scheduleBuddy();
  }

  startTurn() {
    this.spun = null;
    this.pending = [];
    this.hint = null;
    this.narrator.say(t('pathRace.saySpin'), { show: t('twoPlayer.turn', { name: this.players[this.current].name }), force: true });
    this.refresh();
  }

  doSpin() {
    if (this.spun !== null || this.winner) return;
    this.spun = spin(this.board);
    this.pending = stepSquares(this.positions[this.current], this.spun, this.board);
    this.tweens.add({ targets: this.spinner, angle: { from: 0, to: 360 }, duration: 400 });
    speak(t('pathRace.hop', { count: this.spun }), { force: true });
    this.refresh();
  }

  tapSquare(square) {
    if (this.buddyTurn || this.winner || !this.pending.length) return;
    if (square === this.pending[0]) {
      this.hint = null;
      this.hop(square);
    } else {
      this.hint = this.pending[0];
      play(this, 'wrong');
      speak(t('pathRace.hopTo', { square: this.pending[0] }), { force: true });
      this.refresh();
    }
  }

  hop(square) {
    this.positions[this.current] = square;
    this.pending = this.pending.slice(1);
    speak(String(square), { force: true });
    if (hasWon(square, this.board)) {
      this.winner = this.current;
      play(this, 'correct');
      this.refresh();
      this.time.delayedCall(600, () => this.showWinner());
      return;
    }
    if (!this.pending.length) {
      this.time.delayedCall(TURN_PAUSE_MS, () => {
        this.current = otherPlayer(this.current);
        this.startTurn();
      });
    }
    this.refresh();
  }

  scheduleBuddy() {
    if (!this.buddyTurn || this.winner || this.buddyTimer) return;
    if (this.spun === null) this.buddyTimer = this.time.delayedCall(BUDDY_SPIN_DELAY_MS, () => this.buddyDone(() => this.doSpin()));
    else if (this.pending.length) this.buddyTimer = this.time.delayedCall(BUDDY_STEP_MS, () => this.buddyDone(() => this.hop(this.pending[0])));
  }

  buddyDone(action) {
    this.buddyTimer = null;
    action();
  }

  showWinner() {
    const { icon, name } = this.players[this.winner];
    const title = t('twoPlayer.wins', { name: `${icon} ${name}` });
    speak(t('twoPlayer.sayWin'), { force: true });
    const dialog = new Dialog(this, { width: 620, height: 380, title });
    dialog.add(glyph(this, 0, -30, '🏆', 90));
    const again = new Button(this, -140, 110, { label: t('twoPlayer.playAgain'), width: 250, height: 84, fontSize: 30, color: COLORS.green, onTap: () => this.replay() });
    const map = new Button(this, 140, 110, { label: t('common.map'), width: 250, height: 84, fontSize: 30, color: COLORS.primary, onTap: () => this.back() });
    dialog.add([again, map]);
    this.tag('again', again.box);
    this.tag('map', map.box);
  }
}
