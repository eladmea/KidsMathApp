import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { celebrate } from '../ui/Juice';
import { COLORS } from '../ui/theme';
import { play } from '../services/audio';
import { speak } from '../services/speech';
import { content } from '../content/index';
import { bounds, cellKey, cellsOf, fits, getLevel, isCovered, makeRound, sizeOf, turn } from '../logic/blockFit';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Block Fit: a digit (Number Island) or a letter (Word Woods) is drawn as a
// shape of squares; drag the blocks from the tray to cover it exactly. A
// near miss snaps to the closest spot that fits; a block on the shape can be
// dragged back off. Ages 3-4 see faint outlines of where blocks go; ages 7-8
// tap a block to turn it. A point for each shape filled without a block
// dropped where it doesn't fit.
//   data: { skillId }
const S = 64;
const BOARD = { x: 330, y: 450 };
const TRAY = { left: 620, top: 215, width: 600, height: 480, gap: 26 };
const COLOURS = [0xff6b6b, 0x4a8cff, 0xffd23f, 0x7ed957, 0x8e5ce0, 0xff9a3d, 0x3ccfcf, 0xff6fa8, 0xa0785a];
const NEXT_MS = 1700;

export default class BlockFitScene extends BaseScene {
  static key = 'BlockFit';
  static plays = ['BlockFit'];

  build({ skillId = 'math-block-fit' } = {}) {
    this.skill = getSkill(skillId);
    this.levelId = this.skill.fitLevel || 'small';
    this.level = getLevel(this.levelId);
    this.round = makeRound(this.levelId, content('literacy').BLOCK_LETTERS || {});
    this.index = 0;
    this.score = 0;
    this.misses = 0;
    this.pieces = [];
    this.boardParts = [];
    this.busy = true;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfdf3e3).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.add.rectangle(TRAY.left + TRAY.width / 2, TRAY.top + TRAY.height / 2, TRAY.width, TRAY.height, 0xf3e2c4).setRounded(30);

    this.input.dragDistanceThreshold = 10;
    this.input.on('dragstart', (pointer, piece) => this.grab(piece, pointer));
    this.input.on('drag', (pointer, piece, x, y) => piece.setPosition(x, y));
    this.input.on('dragend', (pointer, piece) => this.drop(piece, pointer));

    const intro = this.level.turn ? 'blockFit.introTurn' : this.level.source === 'digits' ? 'blockFit.introDigit' : 'blockFit.introLetter';
    this.narrator.say(t(intro), { show: this.instructions(), force: true });
    this.newShape();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  instructions() {
    return t(this.level.turn ? 'blockFit.instructionsTurn' : 'blockFit.instructions');
  }

  // ---- a shape ----
  newShape() {
    [...this.pieces, ...this.boardParts].forEach((o) => {
      this.tweens.killTweensOf(o);
      o.destroy();
    });
    this.shape = this.round[this.index];
    this.cells = cellsOf(this.shape.rows);
    const size = sizeOf(this.shape.rows);
    this.board = { left: BOARD.x - (size.cols * S) / 2, top: BOARD.y - (size.rows * S) / 2 };
    this.misses = 0;
    // The shape: a square outline for each square to cover.
    this.boardParts = this.cells.map(({ r, c }) => this.add.rectangle(this.cellX(c), this.cellY(r), S - 6, S - 6, COLORS.white).setRounded(12).setStrokeStyle(4, 0xd9b88f));
    this.pieces = this.shape.pieces.map((info, i) => this.makePiece(info, COLOURS[i % COLOURS.length]));
    // Ages 3-4: faint outlines of where each block goes.
    if (this.level.ghosts) {
      this.pieces.forEach((piece) => {
        piece.info.solved.forEach(({ r, c }) => {
          const ghost = this.add.rectangle(this.cellX(c + piece.info.at.c), this.cellY(r + piece.info.at.r), S - 14, S - 14, piece.colour, 0.22).setRounded(10);
          this.boardParts.push(ghost);
        });
      });
    }
    this.placeTray();
    this.busy = false;
    this.setCounter(this.index + 1, this.level.shapes, this.score, '🧩');
    this.report({ step: 'play', shape: this.shape.id, index: this.index, total: this.level.shapes, level: this.levelId, score: this.score });
    this.refresh();
  }

  cellX(c) {
    return this.board.left + c * S + S / 2;
  }

  cellY(r) {
    return this.board.top + r * S + S / 2;
  }

  makePiece(info, colour) {
    const piece = this.add.container(0, 0);
    piece.info = info;
    piece.colour = colour;
    piece.cells = info.cells;
    piece.turns = info.turns;
    piece.at = null;
    this.drawPiece(piece);
    piece.setInteractive({ draggable: true, useHandCursor: true });
    piece.on('pointerdown', () => (piece.dragged = false));
    piece.on('pointerup', () => !piece.dragged && this.tap(piece));
    this.tag(`piece:${info.id}`, piece);
    return piece;
  }

  // The squares of a piece around its middle (so it grows and turns in place).
  drawPiece(piece) {
    piece.removeAll(true);
    const b = bounds(piece.cells);
    piece.cells.forEach(({ r, c }) => {
      piece.add(this.add.rectangle((c - (b.cols - 1) / 2) * S, (r - (b.rows - 1) / 2) * S, S - 6, S - 6, piece.colour).setRounded(12).setStrokeStyle(3, 0xffffff));
    });
    piece.setSize(b.cols * S, b.rows * S);
    if (piece.input) piece.input.hitArea.setTo(0, 0, b.cols * S, b.rows * S);
  }

  // The tray: blocks in rows, smaller than on the shape, each with a home.
  placeTray() {
    const free = this.pieces.filter((p) => !p.at);
    for (const scale of [0.9, 0.8, 0.7, 0.6, 0.5]) {
      let x = TRAY.left + TRAY.gap;
      let y = TRAY.top + TRAY.gap;
      let rowHeight = 0;
      const homes = free.map((piece) => {
        const w = piece.width * scale;
        const h = piece.height * scale;
        if (x + w > TRAY.left + TRAY.width - TRAY.gap) {
          x = TRAY.left + TRAY.gap;
          y += rowHeight + TRAY.gap;
          rowHeight = 0;
        }
        const home = { x: x + w / 2, y: y + h / 2, scale };
        x += w + TRAY.gap;
        rowHeight = Math.max(rowHeight, h);
        return home;
      });
      if (y + rowHeight <= TRAY.top + TRAY.height - TRAY.gap || scale === 0.5) {
        free.forEach((piece, i) => {
          piece.home = homes[i];
          this.tweens.add({ targets: piece, x: piece.home.x, y: piece.home.y, scale: piece.home.scale, duration: 220, ease: 'Back.easeOut' });
        });
        return;
      }
    }
  }

  covered(except = null) {
    const set = new Set();
    this.pieces.forEach((p) => p !== except && p.at && p.cells.forEach(({ r, c }) => set.add(cellKey({ r: r + p.at.r, c: c + p.at.c }))));
    return set;
  }

  refresh() {
    this.report({
      board: { ...this.board, size: S },
      misses: this.misses,
      pieces: this.pieces.map((p) => {
        const b = bounds(p.info.solved);
        return {
          id: p.info.id,
          turns: ((p.turns % 4) + 4) % 4,
          placed: Boolean(p.at),
          // Where its middle goes, turned back the way it was cut.
          target: { x: this.board.left + p.info.at.c * S + (b.cols * S) / 2, y: this.board.top + p.info.at.r * S + (b.rows * S) / 2 },
        };
      }),
    });
  }

  // ---- moving and turning ----
  grab(piece, pointer) {
    if (this.busy) return;
    piece.dragged = true;
    this.tweens.killTweensOf(piece);
    piece.setDepth(20).setScale(1);
    // A drag starts once the finger has moved a little; keep the block where
    // the finger first touched it, not that far behind (so it lands where
    // the finger lets go).
    const down = this.cameras.main.getWorldPoint(pointer.downX, pointer.downY);
    piece.input.dragX = down.x - piece.x;
    piece.input.dragY = down.y - piece.y;
    piece.setPosition(pointer.worldX - piece.input.dragX, pointer.worldY - piece.input.dragY);
  }

  tap(piece) {
    if (this.busy || !this.level.turn || piece.at) return;
    piece.cells = turn(piece.cells);
    piece.turns += 1;
    this.drawPiece(piece);
    this.tweens.add({ targets: piece, angle: { from: -90, to: 0 }, duration: 180, ease: 'Back.easeOut' });
    this.placeTray();
    this.refresh();
  }

  drop(piece, pointer) {
    if (this.busy) return;
    piece.setDepth(piece.at ? 5 : 1);
    if (pointer.worldX >= TRAY.left - 20) {
      // Back to the tray (off the shape, if it was on it).
      piece.at = null;
      this.placeTray();
      return this.refresh();
    }
    const b = bounds(piece.cells);
    const r0 = Math.round((piece.y - (b.rows * S) / 2 - this.board.top) / S);
    const c0 = Math.round((piece.x - (b.cols * S) / 2 - this.board.left) / S);
    const covered = this.covered(piece);
    // The nearest spot that fits, within a square of where it was dropped.
    const spot = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]
      .map(([dr, dc]) => ({ r: r0 + dr, c: c0 + dc }))
      .find(({ r, c }) => fits(this.cells, covered, piece.cells, r, c));
    if (!spot) {
      this.misses += 1;
      piece.at = null;
      this.narrator.say(t('blockFit.noFit'), { show: this.instructions() });
      this.placeTray();
      this.report({ step: 'play', lastDrop: 'miss' });
      return this.refresh();
    }
    piece.at = spot;
    piece.setDepth(5);
    this.tweens.add({ targets: piece, x: this.board.left + spot.c * S + (b.cols * S) / 2, y: this.board.top + spot.r * S + (b.rows * S) / 2, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.placeTray();
    this.report({ step: 'play', lastDrop: 'fit' });
    this.refresh();
    if (isCovered(this.cells, this.covered())) this.done();
  }

  // ---- filled ----
  done() {
    this.busy = true;
    if (this.misses === 0) this.score += 1;
    play(this, 'correct');
    this.time.delayedCall(200, () => celebrate(this, BOARD.x, BOARD.y));
    // Say what it was: the digit's word, or the letter.
    const name = this.level.source === 'digits' ? content('math').NUMBER_WORDS[Number(this.shape.id)] : this.shape.id;
    speak(name, { force: true });
    this.narrator.say(t('blockFit.done'), { show: this.instructions() });
    this.setCounter(this.index + 1, this.level.shapes, this.score, '🧩');
    this.report({ step: 'done', score: this.score, clean: this.misses === 0 });
    this.time.delayedCall(NEXT_MS, () => {
      this.index += 1;
      if (this.index >= this.level.shapes) this.finishRound(this.skill.id, this.score, this.level.shapes);
      else this.newShape();
    });
  }
}
