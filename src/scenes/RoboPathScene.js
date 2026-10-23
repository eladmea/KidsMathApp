import BaseScene from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { session, updateProfileById } from '../services/session';
import { DIRECTIONS, clampStage, makePuzzle, makeStagePuzzle, nextStage, runProgram } from '../logic/roboPath';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Robo Path (ages 5-6) and Robot Loops (7-8): build a program of arrow
// blocks to take the robot to the cookie, then run it. In loop mode a block
// can repeat (➡️×3) and the number of blocks is limited. A puzzle solved
// with no failed run scores a point; after 2 failed runs it can be skipped.
// Robo Path climbs 8 levels (logic/roboPath.js STAGES), saved per player:
// a first-run win goes up a level, 2 failed runs go down.
//   data: { skillId }
const PUZZLES_PER_ROUND = 6;
const STEP_MS = 350;
const MAX_TIMES = 4;
const SKIP_AFTER_FAILS = 2;
const NEXT_MS = 1300;
const GRID = { x: 360, y: 440, size: 440 };
// Steps mode: small blocks, 9 to a row, so an 18-step program fits.
const STEP_BLOCK = { width: 58, height: 42, perRow: 9, top: 207, gap: 46 };
const PANEL_X = 960;

export default class RoboPathScene extends BaseScene {
  static key = 'RoboPath';
  static plays = ['RoboPath'];

  build({ skillId = 'logic-robo-path' } = {}) {
    this.skill = getSkill(skillId);
    this.level = skillId === 'logic-loops' ? 'loops' : 'steps';
    this.stage = this.level === 'steps' ? clampStage(session.profile && session.profile.roboLevel) : null;
    this.stars = [];
    this.index = 0;
    this.score = 0;
    this.board = [];
    this.controls = [];
    this.robot = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xeef0ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.add.rectangle(GRID.x, GRID.y, GRID.size + 16, GRID.size + 16, 0x9aa3d6).setRounded(20);
    this.program = this.add.container(0, 0);
    this.limitText = this.add.text(PANEL_X, 280, '', textStyle(24, COLORS.gray)).setOrigin(0.5);
    this.message = this.add.text(PANEL_X, 380, '', textStyle(30, COLORS.ink, { wordWrap: { width: 520 } })).setOrigin(0.5);
    this.stageText = this.add.text(GRID.x, GRID.y + GRID.size / 2 + 32, '', textStyle(24, COLORS.primaryDark)).setOrigin(0.5);
    this.startPuzzle();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  startPuzzle() {
    this.puzzle = this.stage ? makeStagePuzzle(this.stage) : makePuzzle(this.level);
    this.blocks = [];
    this.fails = 0;
    this.position = this.puzzle.start;
    this.cell = GRID.size / this.puzzle.size;
    this.setCounter(this.index + 1, PUZZLES_PER_ROUND, this.score);
    this.drawBoard();
    this.setStatus('edit');
    this.stageText.setText(this.stage ? t('roboPath.level', { level: this.stage }) : '');
    const { loops, blockLimit, stars } = this.puzzle;
    this.narrator.say(t(loops ? 'roboPath.introLoops' : stars.length ? 'roboPath.introStars' : 'roboPath.intro', { limit: blockLimit }), { force: true });
  }

  cellAt([r, c]) {
    const left = GRID.x - GRID.size / 2;
    const top = GRID.y - GRID.size / 2;
    return { x: left + (c + 0.5) * this.cell, y: top + (r + 0.5) * this.cell };
  }

  drawBoard() {
    this.board.forEach((object) => object.destroy());
    this.board = [];
    const { size, goal, rocks } = this.puzzle;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const { x, y } = this.cellAt([r, c]);
        this.board.push(this.add.rectangle(x, y, this.cell - 6, this.cell - 6, (r + c) % 2 ? 0xffffff : 0xf3f4ff).setRounded(10));
      }
    }
    const goalAt = this.cellAt(goal);
    this.board.push(glyph(this, goalAt.x, goalAt.y, '🍪', this.cell * 0.6));
    rocks.forEach((rock) => {
      const at = this.cellAt(rock);
      this.board.push(glyph(this, at.x, at.y, '🪨', this.cell * 0.6));
    });
    // Stars to collect on the way: each fades when the robot passes it.
    this.stars = this.puzzle.stars.map((cell) => {
      const at = this.cellAt(cell);
      const art = glyph(this, at.x, at.y, '⭐', this.cell * 0.55);
      this.board.push(art);
      return { cell: String(cell), art };
    });
    this.placeRobot(this.puzzle.start, '🤖');
  }

  placeRobot(position, face) {
    if (this.robot) this.robot.destroy();
    this.position = position;
    const { x, y } = this.cellAt(position);
    this.robot = glyph(this, x, y, face, this.cell * 0.6).setDepth(5);
  }

  // ---- the controls on the right, by status ----
  setStatus(status, outcome) {
    this.status = status;
    this.controls.forEach((object) => object.destroy());
    this.controls = [];
    this.message.setText('');
    this.drawProgram();
    if (status === 'edit') this.showEditor();
    if (status === 'goal') this.message.setText(t('roboPath.success')).setColor('#2e7d32');
    if (status === 'failed') this.showFailed(outcome);
    this.report(this.snapshot());
  }

  snapshot() {
    const { size, start, goal, rocks, loops, blockLimit, solution } = this.puzzle;
    return {
      step: this.status,
      index: this.index,
      total: PUZZLES_PER_ROUND,
      score: this.score,
      fails: this.fails,
      stage: this.stage,
      puzzle: { size, start, goal, rocks, stars: this.puzzle.stars, loops, blockLimit, solution },
      blocks: this.blocks.map(({ dir, times }) => ({ dir, times })),
      robot: this.position,
    };
  }

  drawProgram() {
    this.program.removeAll(true);
    if (!this.blocks.length) {
      this.program.add(this.add.text(PANEL_X, 215, t('roboPath.programHint'), textStyle(24, COLORS.gray)).setOrigin(0.5));
    }
    const { loops: repeats } = this.puzzle;
    const look = repeats ? { width: 86, height: 60, perRow: 6, top: 215, gap: 70 } : STEP_BLOCK;
    const start = PANEL_X - ((Math.min(this.blocks.length, look.perRow) - 1) * look.width) / 2;
    this.blocks.forEach((block, i) => {
      const x = start + (i % look.perRow) * look.width;
      const y = look.top + Math.floor(i / look.perRow) * look.gap;
      this.program.add(this.add.rectangle(x, y, look.width - 8, look.height, COLORS.primary).setRounded(12));
      this.program.add(glyph(this, x - (this.puzzle.loops ? 12 : 0), y, DIRECTIONS[block.dir].arrow, repeats ? 34 : 28));
      if (this.puzzle.loops) this.program.add(this.add.text(x + 22, y, `×${block.times}`, textStyle(22, COLORS.white)).setOrigin(0.5));
    });
    const { loops, blockLimit } = this.puzzle;
    this.limitText.setText(loops ? t('roboPath.blocks', { count: this.blocks.length, limit: blockLimit }) : '');
  }

  button(name, x, y, options) {
    const button = new Button(this, x, y, { height: 96, fontSize: 40, ...options });
    this.tag(name, button.box);
    this.controls.push(button);
    return button;
  }

  showEditor() {
    const full = this.puzzle.blockLimit !== null && this.blocks.length >= this.puzzle.blockLimit;
    Object.entries(DIRECTIONS).forEach(([dir], i) => {
      const button = this.button(`arrow:${dir}`, PANEL_X - 195 + i * 130, 392, { label: '', width: 110, color: COLORS.white, onTap: () => this.addBlock(dir) });
      button.add(glyph(this, 0, 0, DIRECTIONS[dir].arrow, 50));
      button.setAlpha(full ? 0.4 : 1);
    });
    if (this.puzzle.loops) {
      for (let times = 2; times <= MAX_TIMES; times++) {
        this.button(`times:${times}`, PANEL_X - 260 + (times - 1) * 130, 480, { label: `×${times}`, width: 110, height: 80, fontSize: 34, color: COLORS.orange, onTap: () => this.setTimes(times) });
      }
    }
    this.button('undo', PANEL_X - 150, 600, { label: '⌫', width: 140, color: COLORS.gray, onTap: () => this.undo() });
    this.button('run', PANEL_X + 80, 600, { label: t('roboPath.run'), width: 260, color: COLORS.green, onTap: () => this.run() });
  }

  showFailed(outcome) {
    const fix = { crash: 'roboPath.bonkFix', stars: 'roboPath.starsFix' }[outcome] || 'roboPath.shortFix';
    this.message.setText(t(fix)).setColor('#e53935');
    const skip = this.fails >= SKIP_AFTER_FAILS;
    this.button('try-again', PANEL_X - (skip ? 90 : 0), 500, { label: t('roboPath.tryAgain'), width: 260, color: COLORS.primary, onTap: () => this.retry() });
    if (skip) this.button('skip', PANEL_X + 150, 500, { label: t('roboPath.skip'), width: 180, color: COLORS.gray, onTap: () => this.nextPuzzle() });
  }

  // ---- editing and running ----
  addBlock(dir) {
    const { blockLimit } = this.puzzle;
    if (this.status !== 'edit' || (blockLimit !== null && this.blocks.length >= blockLimit)) return;
    this.blocks.push({ dir, times: 1 });
    this.setStatus('edit');
  }

  setTimes(times) {
    if (this.status !== 'edit' || !this.blocks.length) return;
    this.blocks[this.blocks.length - 1].times = times;
    this.setStatus('edit');
  }

  undo() {
    this.blocks.pop();
    this.setStatus('edit');
  }

  run() {
    if (this.status !== 'edit' || !this.blocks.length) return;
    const { path, outcome } = runProgram(this.puzzle, this.blocks);
    this.setStatus('running');
    path.forEach((position, i) =>
      this.time.delayedCall(i * STEP_MS, () => {
        this.placeRobot(position, '🤖');
        this.stars.filter((star) => star.cell === String(position)).forEach((star) => star.art.setAlpha(0.25));
      })
    );
    this.time.delayedCall(Math.max(1, path.length) * STEP_MS + 150, () => this.finishRun(outcome));
  }

  finishRun(outcome) {
    if (outcome === 'goal') {
      if (this.fails === 0) this.score += 1;
      play(this, 'correct');
      const levelUp = this.stage !== null && nextStage(this.stage, this.fails) > this.stage;
      this.narrator.say(levelUp ? `${t('roboPath.yum')} ${t('roboPath.levelUp')}` : t('roboPath.yum'), { force: true });
      this.setStatus('goal');
      this.time.delayedCall(NEXT_MS, () => this.nextPuzzle());
      return;
    }
    this.fails += 1;
    play(this, 'wrong');
    if (outcome === 'crash') this.placeRobot(this.position, '😵');
    this.narrator.say(t({ crash: 'roboPath.bonk', stars: 'roboPath.stars' }[outcome] || 'roboPath.short'), { force: true });
    this.setStatus('failed', outcome);
  }

  retry() {
    this.placeRobot(this.puzzle.start, '🤖');
    this.stars.forEach((star) => star.art.setAlpha(1));
    this.setStatus('edit');
  }

  nextPuzzle() {
    if (this.stage !== null) {
      this.stage = nextStage(this.stage, this.fails);
      if (session.profile) updateProfileById(session.profile.id, { roboLevel: this.stage });
    }
    this.index += 1;
    if (this.index >= PUZZLES_PER_ROUND) this.finishRound(this.skill.id, this.score, PUZZLES_PER_ROUND);
    else this.startPuzzle();
  }
}
