import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { showGameEnd } from '../ui/GameEnd';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { miniGameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Chip Toss (Fun Break): a cup slides back and forth; tap to toss a chip
// straight up and land it in the cup. 10 chips; the cup speeds up every 3
// catches.
const TOTAL_CHIPS = 10;
const CUP_WIDTH = 130;
const CHIP_SIZE = 56;
const FLIGHT_MS = 550;
const START_SWEEP_MS = 2200;
const FASTEST_SWEEP_MS = 1000;
const LANE = { left: 160, right: 1120, cupY: 260, chipY: 620 };
const CENTER = 640;

export default class ChipTossScene extends BaseScene {
  static key = 'ChipToss';

  build() {
    this.left = TOTAL_CHIPS;
    this.score = 0;
    this.flying = false;
    this.over = false;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff1e0).setOrigin(0, 0).setInteractive();
    this.bg.on('pointerdown', () => this.toss());
    this.tag('toss', this.bg);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addHeader('🥤', miniGameTitle('chip-toss'));
    this.add.rectangle(CENTER, LANE.cupY + 50, LANE.right - LANE.left + CUP_WIDTH, 12, 0xd9b88f).setRounded(6);
    this.cup = glyph(this, LANE.left, LANE.cupY, '🥤', CUP_WIDTH * 0.9);
    this.chip = glyph(this, CENTER, LANE.chipY, '🪙', CHIP_SIZE);
    this.result = this.add.text(CENTER, 420, '', textStyle(34, COLORS.greenDark)).setOrigin(0.5);
    this.add.text(CENTER, 690, t('mini.toss.tapHint'), textStyle(24, COLORS.gray)).setOrigin(0.5);
    this.narrator.say(t('mini.toss.intro'));
    this.sweep();
    this.showCounter();
    this.report({ step: 'play', score: 0, left: this.left });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  showCounter() {
    this.headerCounter.setText(`🥤 ${this.score}   🪙 ${this.left}`);
  }

  // The cup slides faster as the catches add up.
  sweep() {
    if (this.sweepTween) this.sweepTween.remove();
    const ms = Math.max(FASTEST_SWEEP_MS, START_SWEEP_MS - Math.floor(this.score / 3) * 300);
    const from = this.cup.x;
    const to = from < CENTER ? LANE.right : LANE.left;
    this.sweepTween = this.tweens.add({
      targets: this.cup,
      x: to,
      duration: (ms * Math.abs(to - from)) / (LANE.right - LANE.left),
      ease: 'Quad.easeInOut',
      onComplete: () => this.sweep(),
    });
  }

  toss() {
    if (this.flying || this.left === 0 || this.over) return;
    this.flying = true;
    this.result.setText('');
    this.tweens.add({
      targets: this.chip,
      y: LANE.cupY + 10,
      duration: FLIGHT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => this.land(),
    });
    this.report({ step: 'flying', cupX: this.cup.x });
  }

  land() {
    const caught = Math.abs(this.cup.x - CENTER) <= CUP_WIDTH / 2 - CHIP_SIZE / 4;
    if (caught) {
      this.score += 1;
      play(this, 'correct');
      this.sweep();
    } else {
      play(this, 'wrong');
    }
    this.result.setText(t(caught ? 'mini.toss.catch' : 'mini.toss.miss')).setColor(caught ? '#2e7d32' : '#ff9a3d');
    this.chip.setY(LANE.chipY);
    this.left -= 1;
    this.flying = false;
    this.showCounter();
    this.chip.setVisible(this.left > 0);
    this.report({ step: 'play', caught, score: this.score, left: this.left });
    if (this.left === 0) this.end();
  }

  end() {
    this.over = true;
    if (this.sweepTween) this.sweepTween.remove();
    this.report({ step: 'over', score: this.score });
    showGameEnd(this, { emoji: '🏆', headline: t('mini.toss.end', { score: this.score, total: TOTAL_CHIPS }), detail: t(this.score >= 7 ? 'mini.toss.super' : 'mini.toss.great') });
  }
}
