import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import NumberBlock, { blockUnit } from '../ui/NumberBlock';
import { celebrate, oops } from '../ui/Juice';
import { play } from '../services/audio';
import { speak } from '../services/speech';
import { afterWrong, canPlace, getLevel, isComplete, makeTower } from '../logic/blockTower';
import { getSkill } from '../curriculum/skills';
import { t } from '../i18n/index';

// Block Tower (ages 3-6): flat blocks made of unit squares wait in the tray.
// Drag one (or tap it) onto the tower; the biggest goes at the bottom. A
// block put on a smaller one falls: on its own for ages 3-4, the whole tower
// for ages 5-6. The top block can be dragged or tapped back off. A point
// for each tower built without a fall.
//   data: { skillId }
const TRAY = { x: 300, y: 465, width: 520, height: 440 };
const TOWER = { x: 920, ground: 668, left: 600 };
const PLACE_MS = 260;
const NEXT_TOWER_MS = 1700;

export default class BlockTowerScene extends BaseScene {
  static key = 'BlockTower';
  static plays = ['BlockTower'];

  build({ skillId = 'math-block-tower' } = {}) {
    this.skill = getSkill(skillId);
    this.levelId = this.skill.towerLevel || 'small';
    this.level = getLevel(this.levelId);
    this.unit = blockUnit(this.level.longest);
    this.towerIndex = 0;
    this.score = 0;
    this.blocks = [];
    this.stack = [];
    this.busy = false;
    this.fell = false;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff3e0).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addGameHeader(this.skill);
    this.add.rectangle(TRAY.x, TRAY.y, TRAY.width, TRAY.height, 0xf6e3c4).setRounded(32).setStrokeStyle(4, 0xe2c08f);
    this.add.rectangle(TOWER.x, TOWER.ground + 14, 560, 28, 0x8bd17c).setRounded(14);

    this.input.dragDistanceThreshold = 10;
    this.input.on('dragstart', (pointer, block) => this.grab(block));
    this.input.on('drag', (pointer, block, x, y) => block.setPosition(x, y));
    this.input.on('dragend', (pointer, block) => this.drop(block, pointer));

    this.narrator.say(t(this.level.numbers ? 'blockTower.introBig' : 'blockTower.introSmall'), { show: t('blockTower.instructions'), force: true });
    this.newTower();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // ---- a tower ----
  newTower() {
    this.blocks.forEach((block) => {
      this.tweens.killTweensOf(block);
      block.destroy();
    });
    const lengths = makeTower(this.levelId, this.towerIndex);
    const gap = Math.min(100, (TRAY.height - 40) / lengths.length);
    this.blocks = lengths.map((length, i) => {
      const block = new NumberBlock(this, 0, 0, { length, unit: this.unit, number: this.level.numbers });
      block.blockId = i;
      block.home = { x: TRAY.x, y: TRAY.y - ((lengths.length - 1) / 2) * gap + i * gap };
      block.setPosition(block.home.x, block.home.y);
      block.on('pointerdown', () => (block.dragged = false));
      block.on('pointerup', () => !block.dragged && this.tap(block));
      this.tag(`block:${i}`, block);
      return block;
    });
    this.stack = [];
    this.fell = false;
    this.busy = false;
    this.refresh();
    this.setCounter(this.towerIndex + 1, this.level.towers, this.score, '🧱');
    this.report({ step: 'build', tower: this.towerIndex, total: this.level.towers, level: this.levelId, score: this.score });
  }

  // Where block number `index` (from the bottom) sits on the tower.
  slot(index) {
    return { x: TOWER.x, y: TOWER.ground - this.unit * (index + 0.5) - 2 };
  }

  top() {
    return this.stack[this.stack.length - 1] || null;
  }

  // Only blocks in the tray and the top block of the tower can move.
  refresh() {
    this.blocks.forEach((block) => block.setMovable(!this.busy && (!this.stack.includes(block) || block === this.top())));
    this.report({
      blocks: this.blocks.map((block) => ({ id: block.blockId, length: block.units, place: this.stack.includes(block) ? 'tower' : 'tray' })),
      stack: this.stack.map((block) => block.units),
      drop: this.slot(this.stack.length),
    });
  }

  // ---- moving blocks ----
  grab(block) {
    block.dragged = true;
    this.tweens.killTweensOf(block);
    block.setDepth(20).setScale(1.05);
  }

  drop(block, pointer) {
    block.setScale(1);
    const onTower = pointer.worldX > TOWER.left;
    if (this.stack.includes(block)) {
      if (onTower) this.moveTo(block, this.slot(this.stack.indexOf(block)));
      else this.takeOff(block);
    } else if (onTower) {
      this.place(block);
    } else {
      this.moveTo(block, block.home);
    }
  }

  tap(block) {
    if (this.busy) return;
    if (block === this.top()) this.takeOff(block);
    else if (!this.stack.includes(block)) this.place(block);
  }

  moveTo(block, { x, y }, onComplete) {
    this.tweens.add({ targets: block, x, y, angle: 0, duration: PLACE_MS, ease: 'Back.easeOut', onComplete: () => {
      block.setDepth(this.stack.includes(block) ? 10 + this.stack.indexOf(block) : 0);
      if (onComplete) onComplete();
    } });
  }

  takeOff(block) {
    this.stack.pop();
    this.moveTo(block, block.home);
    this.refresh();
  }

  place(block) {
    const lengths = this.stack.map((b) => b.units);
    const at = this.slot(this.stack.length);
    if (!canPlace(lengths, block.units)) return this.wrong(block, at);
    this.stack.push(block);
    speak(String(block.units));
    this.moveTo(block, at, () => {
      if (isComplete(this.stack, this.blocks)) this.towerDone();
    });
    this.refresh();
  }

  // ---- a block on a smaller one: it wobbles and falls ----
  wrong(block, at) {
    this.busy = true;
    this.fell = true;
    this.refresh();
    play(this, 'wrong');
    const keep = afterWrong(this.levelId, this.stack.map((b) => b.units));
    const falling = keep.length ? [block] : [...this.stack, block];
    this.stack = this.stack.slice(0, keep.length);
    this.narrator.say(t(keep.length ? 'blockTower.tooBig' : 'blockTower.fell'), { show: t('blockTower.instructions') });
    this.report({ step: 'wrong', fell: falling.length });
    this.tweens.add({
      targets: block,
      x: at.x,
      y: at.y,
      duration: PLACE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        oops(this, at.x, at.y);
        falling.forEach((piece, i) => {
          const side = i % 2 === 0 ? 1 : -1;
          // In front of what is still standing, so the child sees it fall.
          piece.setDepth(30 + i);
          this.tweens.chain({
            targets: piece,
            tweens: [
              { angle: side * 8, duration: 90, yoyo: true, repeat: 1 },
              // Tumbles over and lands flat on the ground beside the tower.
              { angle: side * 360, x: TOWER.x + side * (90 + i * 45), y: TOWER.ground - this.unit / 2, duration: 560, ease: 'Bounce.easeOut' },
              { alpha: 0.4, duration: 200, delay: 250 },
              { x: piece.home.x, y: piece.home.y, angle: 0, alpha: 1, duration: 380, ease: 'Sine.easeInOut' },
            ],
            onComplete: () => {
              piece.setDepth(0);
              if (piece === block) {
                this.busy = false;
                this.refresh();
                this.report({ step: 'build' });
              }
            },
          });
        });
      },
    });
  }

  towerDone() {
    this.busy = true;
    this.refresh();
    if (!this.fell) this.score += 1;
    play(this, 'correct');
    const top = this.slot(this.stack.length - 1);
    celebrate(this, top.x, top.y);
    this.narrator.say(t(this.fell ? 'blockTower.doneAgain' : 'blockTower.done'), { show: t('blockTower.instructions') });
    this.setCounter(this.towerIndex + 1, this.level.towers, this.score, '🧱');
    this.report({ step: 'done', score: this.score, clean: !this.fell });
    this.time.delayedCall(NEXT_TOWER_MS, () => {
      this.towerIndex += 1;
      if (this.towerIndex >= this.level.towers) this.finishRound(this.skill.id, this.score, this.level.towers);
      else this.newTower();
    });
  }
}
