import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { showGameEnd } from '../ui/GameEnd';
import { glyph } from '../ui/Art';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { play } from '../services/audio';
import { miniGameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Dance Tap (Fun Break): one of four animal pads glows on each beat; tap it
// before the next beat. The beat speeds up with every hit. 30 beats.
const TOTAL_BEATS = 30;
const START_BEAT_MS = 1200;
const FASTEST_BEAT_MS = 600;
const SPEED_UP_MS = 25;
const PADS = [
  { id: 0, emoji: '🐻', color: '#FF6B6B' },
  { id: 1, emoji: '🐰', color: '#4A9DFF' },
  { id: 2, emoji: '🐧', color: '#3DDC84' },
  { id: 3, emoji: '🐸', color: '#FFC93D' },
];

export default class DanceTapScene extends BaseScene {
  static key = 'DanceTap';

  build() {
    this.beat = 0;
    this.lit = null;
    this.hits = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.pose = 0;
    this.hitThisBeat = false;
    this.beatMs = START_BEAT_MS;
    this.over = false;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xf3ecff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addHeader('🕺', miniGameTitle('dance-tap'));
    this.dancer = glyph(this, 640, 300, '🕺', 140);
    this.beatText = this.add.text(640, 410, '', textStyle(26, COLORS.gray)).setOrigin(0.5);
    this.pads = PADS.map((pad, i) => {
      const x = 640 + (i - 1.5) * 230;
      const box = this.add.rectangle(x, 580, 200, 170, 0xefeae2).setRounded(32).setStrokeStyle(6, colorOf(pad.color)).setInteractive({ useHandCursor: true });
      const face = glyph(this, x, 580, pad.emoji, 90).setAlpha(0.45);
      box.on('pointerdown', () => this.tapPad(pad.id));
      this.tag(`pad:${pad.id}`, box);
      return { ...pad, box, face };
    });
    this.narrator.say(t('mini.dance.intro'));
    this.showCounter();
    this.time.delayedCall(800, () => this.nextBeat());
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  showCounter() {
    this.headerCounter.setText(`🎵 ${this.hits}   🔥 ${this.combo}`);
    this.beatText.setText(t('mini.dance.beat', { beat: Math.min(this.beat, TOTAL_BEATS), total: TOTAL_BEATS }));
  }

  light(id) {
    this.lit = id;
    this.pads.forEach((pad) => {
      const on = pad.id === id;
      pad.box.setFillStyle(on ? colorOf(pad.color) : 0xefeae2).setScale(on ? 1.06 : 1);
      pad.face.setAlpha(on ? 1 : 0.45);
    });
  }

  nextBeat() {
    if (this.beat > 0 && !this.hitThisBeat) this.combo = 0;
    this.hitThisBeat = false;
    this.beat += 1;
    if (this.beat > TOTAL_BEATS) return this.end();
    const options = PADS.filter((pad) => pad.id !== this.lit);
    this.light(options[Math.floor(Math.random() * options.length)].id);
    this.showCounter();
    this.report({ step: 'play', beat: this.beat, lit: this.lit, hits: this.hits, combo: this.combo });
    this.time.delayedCall(this.beatMs, () => this.nextBeat());
  }

  tapPad(id) {
    if (this.over) return;
    if (id === this.lit && !this.hitThisBeat) {
      this.hitThisBeat = true;
      this.hits += 1;
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.pose = 1 - this.pose;
      this.dancer.destroy();
      this.dancer = glyph(this, 640, 300, this.pose ? '💃' : '🕺', 140);
      this.tweens.add({ targets: this.dancer, scale: { from: 1.3, to: 1 }, duration: 210 });
      this.light(null);
      this.beatMs = Math.max(FASTEST_BEAT_MS, this.beatMs - SPEED_UP_MS);
      play(this, 'correct');
    } else if (id !== this.lit && this.lit !== null) {
      this.combo = 0;
      play(this, 'wrong');
    }
    this.showCounter();
    this.report({ hits: this.hits, combo: this.combo, lit: this.lit });
  }

  end() {
    this.over = true;
    this.light(null);
    this.report({ step: 'over', hits: this.hits, bestCombo: this.bestCombo });
    showGameEnd(this, { emoji: '🪩', headline: t('mini.dance.end', { hits: this.hits, total: TOTAL_BEATS }), detail: t('mini.dance.best', { combo: this.bestCombo }), say: t('mini.dance.sayEnd') });
  }
}
