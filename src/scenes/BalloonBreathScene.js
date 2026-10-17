import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import { showGameEnd } from '../ui/GameEnd';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { BREATHS, IN_MS, MIN_SCALE, OUT_MS, balloonScale, countdown, judgeBreath } from '../logic/balloonBreath';
import { gameTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Balloon Breath (Fun Break, always free): hold the button to breathe in
// slowly and fill the balloon, let go to breathe out. Five slow breaths.
// Timed in real time, so a breath takes as long at any game speed.
//   data: { coolDown } (opened as a calm-down break: "Done" instead of
//   "Back to learning")
const BALLOON = 300;

export default class BalloonBreathScene extends BaseScene {
  static key = 'BalloonBreath';

  build({ coolDown = false } = {}) {
    this.coolDown = coolDown;
    this.phase = 'ready';
    this.breaths = 0;
    this.started = 0;
    this.releaseScale = MIN_SCALE;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xe8f6ff).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.addHeader('🎈', gameTitle('balloon-breath'));
    this.balloon = glyph(this, 640, 370, '🎈', BALLOON).setScale(MIN_SCALE);
    this.hint = this.add.text(640, 560, t('mini.breath.hint'), textStyle(26, COLORS.ink, { wordWrap: { width: 900 } })).setOrigin(0.5);
    this.button = this.add.rectangle(640, 650, 460, 100, COLORS.primary).setRounded(30).setStrokeStyle(4, COLORS.white).setInteractive({ useHandCursor: true });
    this.buttonLabel = this.add.text(640, 650, '', textStyle(32, COLORS.white)).setOrigin(0.5);
    this.tag('breathe', this.button);
    this.button.on('pointerdown', () => this.breatheIn());
    const release = () => this.breatheOut();
    this.input.on('pointerup', release);
    this.events.once('shutdown', () => this.input.off('pointerup', release));
    this.narrator.say(t('mini.breath.intro'), { show: t('mini.breath.ready') });
    this.showState();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  update() {
    if (this.phase === 'in') {
      const held = performance.now() - this.started;
      this.balloon.setScale(balloonScale(held));
      this.buttonLabel.setText(held >= IN_MS ? t('mini.breath.full') : t('mini.breath.in', { seconds: countdown(held) }));
    } else if (this.phase === 'out') {
      const elapsed = performance.now() - this.started;
      const shrink = Math.min(1, elapsed / OUT_MS);
      this.balloon.setScale(this.releaseScale - (this.releaseScale - MIN_SCALE) * shrink);
      this.buttonLabel.setText(t('mini.breath.out', { seconds: countdown(elapsed, OUT_MS) }));
      if (elapsed >= OUT_MS) this.breathDone();
    }
  }

  showState() {
    this.headerCounter.setText(`🌬️ ${this.breaths} / ${BREATHS}`);
    const colors = { ready: COLORS.primary, in: COLORS.green, out: COLORS.gray, done: COLORS.gray };
    this.button.setFillStyle(colors[this.phase]);
    if (this.phase === 'ready') this.buttonLabel.setText(t('mini.breath.ready'));
    if (this.phase === 'done') this.buttonLabel.setText(t('mini.breath.done'));
    this.report({ step: this.phase, breaths: this.breaths, total: BREATHS, inMs: IN_MS, outMs: OUT_MS });
  }

  breatheIn() {
    if (this.phase !== 'ready') return;
    this.phase = 'in';
    this.started = performance.now();
    this.narrator.say(t('mini.breath.sayIn'), { show: this.narrator.text.text });
    this.showState();
  }

  breatheOut() {
    if (this.phase !== 'in') return;
    const held = performance.now() - this.started;
    this.releaseScale = balloonScale(held);
    const good = judgeBreath(held) === 'good';
    if (good) this.breaths += 1;
    this.hint.setText(t(good ? 'mini.breath.good' : 'mini.breath.quick'));
    this.narrator.say(t(good ? 'mini.breath.sayGood' : 'mini.breath.sayQuick'), { show: this.narrator.text.text });
    this.phase = 'out';
    this.started = performance.now();
    this.showState();
    this.report({ breath: good ? 'good' : 'quick' });
  }

  breathDone() {
    this.balloon.setScale(MIN_SCALE);
    if (this.breaths < BREATHS) {
      this.phase = 'ready';
      this.showState();
      return;
    }
    this.phase = 'done';
    this.showState();
    showGameEnd(this, {
      say: t('mini.breath.sayDone'),
      emoji: '😌',
      headline: t('mini.breath.endHeadline'),
      detail: t('mini.breath.endDetail'),
      label: this.coolDown ? t('mini.breath.doneButton') : t('mini.backToLearning'),
    });
  }
}
