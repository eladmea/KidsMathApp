import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import NumberBlock from '../ui/NumberBlock';
import { celebrate } from '../ui/Juice';
import { COLORS } from '../ui/theme';
import { play } from '../services/audio';
import { speak } from '../services/speech';
import { getLevel, isBalanced, isTooHeavy, makePuzzle, tilt } from '../logic/balanceScale';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Balance Scale (ages 7-10): a block weighs as much as its number. The left
// pan is set; drag or tap blocks from the tray onto the right pan until the
// beam is level. It tips towards the heavier side as each block lands. Tap a
// block on the pan to take it back. A point for each puzzle balanced without
// ever making the right side too heavy.
//   data: { skillId }
const PIVOT = { x: 640, y: 250 };
const HALF = 300;
const ROPE = 150;
const PAN_WIDTH = 330;
const UNIT = 30;
// A block in the tray takes a tap at least this big.
const TOUCH = 60;
const TRAY = { x: 640, y: 630, width: 1140, height: 150 };
const TILT_MS = 520;
const NEXT_PUZZLE_MS = 1800;

export default class BalanceScaleScene extends BaseScene {
  static key = 'BalanceScale';
  static plays = ['BalanceScale'];

  build({ skillId = 'math-balance' } = {}) {
    this.skill = getSkill(skillId);
    this.levelId = this.skill.scaleLevel || 'sum';
    this.level = getLevel(this.levelId);
    this.index = 0;
    this.score = 0;
    this.puzzle = null;
    this.trayBlocks = [];
    this.busy = false;
    this.heavy = false;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xeef4ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);

    // The stand, the beam and two pans hanging from its ends.
    this.add.rectangle(PIVOT.x, (PIVOT.y + 540) / 2, 24, 540 - PIVOT.y, 0x8a6a44).setRounded(8);
    this.add.rectangle(PIVOT.x, 545, 220, 24, 0x8a6a44).setRounded(12);
    this.ropes = this.add.graphics();
    this.beam = this.add.container(PIVOT.x, PIVOT.y);
    this.beam.add(this.add.rectangle(0, 0, HALF * 2 + 40, 18, 0x5f4b32).setRounded(9));
    this.add.circle(PIVOT.x, PIVOT.y, 16, COLORS.yellow).setStrokeStyle(4, 0x5f4b32);
    this.pans = [0, 1].map(() => {
      const pan = this.add.container(0, 0);
      pan.add(this.add.rectangle(0, 0, PAN_WIDTH, 16, 0xc9a26b).setRounded(8));
      return pan;
    });
    this.tray = this.add.rectangle(TRAY.x, TRAY.y, TRAY.width, TRAY.height, 0xdde6f7).setRounded(28);

    this.input.dragDistanceThreshold = 10;
    this.input.on('dragstart', (pointer, block) => this.grab(block));
    this.input.on('drag', (pointer, block, x, y) => block.setPosition(x, y));
    this.input.on('dragend', (pointer, block) => this.drop(block, pointer));

    this.narrator.say(t(this.levelId === 'times' ? 'balance.introTimes' : 'balance.introSum'), { show: t('balance.instructions'), force: true });
    this.newPuzzle();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // ---- a puzzle ----
  newPuzzle() {
    this.pans.forEach((pan) => pan.list.filter((o) => o instanceof NumberBlock).forEach((block) => block.destroy()));
    this.trayBlocks.forEach((block) => {
      this.tweens.killTweensOf(block);
      block.destroy();
    });
    this.puzzle = makePuzzle(this.levelId, this.index);
    this.heavy = false;
    this.busy = false;
    this.puzzle.left.forEach((weight) => this.pans[0].add(this.makeBlock(weight, true)));
    this.puzzle.fixed.forEach((weight) => this.pans[1].add(this.makeBlock(weight, true)));
    this.trayBlocks = this.puzzle.tray.map((weight, i) => {
      const block = this.makeBlock(weight, false);
      block.blockId = i;
      block.on('pointerdown', () => (block.dragged = false));
      block.on('pointerup', () => !block.dragged && this.tap(block));
      this.tag(`weight:${i}`, block);
      return block;
    });
    this.placeTray();
    this.pans.forEach((pan) => this.stackPan(pan));
    this.tweens.killTweensOf(this.beam);
    this.beam.angle = tilt(this.puzzle.left, this.rightWeights());
    this.placePans();
    this.setCounter(this.index + 1, this.level.puzzles, this.score, '⚖️');
    this.report({ step: 'play', puzzle: this.index, total: this.level.puzzles, level: this.levelId, score: this.score, left: this.puzzle.left, answer: this.puzzle.answer });
    this.refresh();
  }

  makeBlock(weight, locked) {
    const block = new NumberBlock(this, 0, 0, { length: weight, unit: UNIT, number: true, rowLength: 10, minHeight: TOUCH });
    block.weight = weight;
    if (locked) {
      block.locked = true;
      block.disableInteractive();
    }
    return block;
  }

  // The tray's blocks in a row (two rows if they don't fit), each with a home.
  placeTray() {
    const gap = 24;
    const rows = [[]];
    let width = 0;
    this.trayBlocks.forEach((block) => {
      if (width + block.blockWidth > TRAY.width - 60 && rows[rows.length - 1].length) {
        rows.push([]);
        width = 0;
      }
      rows[rows.length - 1].push(block);
      width += block.blockWidth + gap;
    });
    rows.forEach((row, r) => {
      const rowWidth = row.reduce((sum, block) => sum + block.blockWidth, 0) + gap * (row.length - 1);
      let x = TRAY.x - rowWidth / 2;
      const y = TRAY.y + (r - (rows.length - 1) / 2) * 66;
      row.forEach((block) => {
        block.home = { x: x + block.blockWidth / 2, y };
        block.setPosition(block.home.x, block.home.y);
        x += block.blockWidth + gap;
      });
    });
  }

  // Blocks on a pan stand on each other, bottom up.
  stackPan(pan) {
    let y = -8;
    pan.list.filter((o) => o instanceof NumberBlock).forEach((block) => {
      block.setPosition(0, y - block.blockHeight / 2 - 2);
      y -= block.blockHeight + 4;
    });
  }

  // The pans hang from the beam's ends, whatever its angle.
  placePans() {
    const angle = (this.beam.angle * Math.PI) / 180;
    this.ropes.clear().lineStyle(4, 0x5f4b32, 1);
    this.pans.forEach((pan, i) => {
      const side = i === 0 ? -1 : 1;
      const end = { x: PIVOT.x + side * HALF * Math.cos(angle), y: PIVOT.y + side * HALF * Math.sin(angle) };
      pan.setPosition(end.x, end.y + ROPE);
      this.ropes.lineBetween(end.x, end.y, pan.x - PAN_WIDTH / 2 + 20, pan.y);
      this.ropes.lineBetween(end.x, end.y, pan.x + PAN_WIDTH / 2 - 20, pan.y);
    });
  }

  onPan(block) {
    return block.parentContainer === this.pans[1];
  }

  rightWeights() {
    return this.pans[1].list.filter((o) => o instanceof NumberBlock).map((block) => block.weight);
  }

  refresh() {
    this.trayBlocks.forEach((block) => {
      block.setMovable(!this.busy);
      if (block.input) block.input.draggable = !this.onPan(block);
    });
    this.report({
      right: this.rightWeights(),
      tray: this.trayBlocks.map((block) => ({ id: block.blockId, weight: block.weight, place: this.onPan(block) ? 'pan' : 'tray' })),
      drop: { x: PIVOT.x + HALF, y: this.pans[1].y - 60 },
    });
  }

  // ---- moving blocks ----
  grab(block) {
    block.dragged = true;
    this.tweens.killTweensOf(block);
    block.setDepth(20).setScale(1.05);
  }

  drop(block, pointer) {
    block.setScale(1).setDepth(0);
    if (pointer.worldX > PIVOT.x && pointer.worldY < TRAY.y - TRAY.height / 2) this.putOn(block);
    else this.tweens.add({ targets: block, x: block.home.x, y: block.home.y, duration: 220, ease: 'Back.easeOut' });
  }

  tap(block) {
    if (this.busy) return;
    if (this.onPan(block)) this.takeBack(block);
    else this.putOn(block);
  }

  putOn(block) {
    // Stacked tight on the pan: only the block itself takes a tap.
    block.setTouchSize(0);
    this.pans[1].add(block);
    speak(String(block.weight));
    this.changed();
  }

  takeBack(block) {
    this.pans[1].remove(block);
    this.add.existing(block);
    block.setTouchSize(TOUCH).setPosition(block.home.x, block.home.y).setAngle(0);
    this.changed();
  }

  // After a block goes on or comes off: the beam tips, and is it level?
  changed() {
    const right = this.rightWeights();
    this.stackPan(this.pans[1]);
    this.tweens.killTweensOf(this.beam);
    this.tweens.add({ targets: this.beam, angle: tilt(this.puzzle.left, right), duration: TILT_MS, ease: 'Back.easeOut', onUpdate: () => this.placePans() });
    this.refresh();
    if (isBalanced(this.puzzle.left, right)) return this.solved();
    if (isTooHeavy(this.puzzle.left, right)) {
      this.heavy = true;
      play(this, 'wrong');
      this.narrator.say(t('balance.tooHeavy'), { show: t('balance.instructions') });
      this.report({ step: 'heavy' });
    } else {
      this.report({ step: 'play' });
    }
  }

  solved() {
    this.busy = true;
    this.refresh();
    if (!this.heavy) this.score += 1;
    play(this, 'correct');
    this.time.delayedCall(TILT_MS / 2, () => celebrate(this, PIVOT.x, PIVOT.y));
    this.narrator.say(t('balance.balanced'), { show: t('balance.instructions') });
    this.setCounter(this.index + 1, this.level.puzzles, this.score, '⚖️');
    this.report({ step: 'solved', score: this.score, clean: !this.heavy });
    this.time.delayedCall(NEXT_PUZZLE_MS, () => {
      this.index += 1;
      if (this.index >= this.level.puzzles) this.finishRound(this.skill.id, this.score, this.level.puzzles);
      else this.newPuzzle();
    });
  }
}
