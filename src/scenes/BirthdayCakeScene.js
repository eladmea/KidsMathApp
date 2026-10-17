import Phaser from 'phaser';
import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import TraceLayer from '../ui/TraceLayer';
import { IdleHint } from '../ui/HintArrow';
import { countPanel } from '../ui/CountPanel';
import { emojiItem } from '../ui/DragTray';
import { glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { play } from '../services/audio';
import { content } from '../content/index';
import { getRecord, hasPassed } from '../logic/progress';
import { digitCheckpoints, numberPool, pickDistinct } from '../logic/tracing';
import { CAKES_PER_ROUND, CUSTOMERS, MAX_ON_TRAY_TARGET, checkCount, roundPoint } from '../logic/writingGames';
import { getSkill } from '../curriculum/skills';
import { skillTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Birthday Cake: a friend turns 1 to 5 (1 to 9 once Write 1 to 5 is passed).
// Write their age on the cake in icing (stroke by stroke, from the green
// dot), put that many candles on, then blow them out one by one.
// A cake earns a point when the writing needed at most one restart and the
// first count was right. 3 cakes make a round, then Results.
//   data: { skillId }

const WIDTH = 360;
const HEIGHT = 300;
const CX = 620;
const CY = 480;
const LEFT = CX - WIDTH / 2;
const TOP = CY - HEIGHT / 2;
const K = WIDTH / 300;
const TRACE_WIDTH = WIDTH * 0.42;
const ICING_LOOK = { dot: 17, guide: 0xf7d2e2, guideCurrent: 0xf3b5cf, done: 0xff4f93, trail: 0xff4f93, trailSize: 19, demo: '🧁' };
const CANDLE = '🕯️';
const CANDLE_WIDTH = 34 * K;
const PARTY_MS = 2800;
const FRIEND_AT = { x: 170, y: 330, size: 110 };
const PANEL_X = 1030;

export default class BirthdayCakeScene extends BaseScene {
  static key = 'BirthdayCake';
  static plays = ['BirthdayCake'];

  build({ skillId = 'math-birthday-cake' } = {}) {
    this.skill = getSkill(skillId);
    const bigNumbers = hasPassed(getRecord(session.progress, 'math-write-1-5'));
    this.ages = pickDistinct(numberPool({ bigNumbers }), CAKES_PER_ROUND);
    this.friends = pickDistinct(CUSTOMERS, CAKES_PER_ROUND);
    this.words = content('math');
    this.index = 0;
    this.points = 0;
    this.panel = [];
    this.candles = [];
    this.layer = null;
    this.friendArt = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff0f6).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.add.text(30, 150, t('quiz.title', { emoji: this.skill.emoji, title: skillTitle(this.skill) }), textStyle(24, COLORS.gray)).setOrigin(0, 0.5);
    this.counter = this.add.text(1250, 150, '', textStyle(28)).setOrigin(1, 0.5);
    glyph(this, FRIEND_AT.x + 50, FRIEND_AT.y - 50, '🥳', 44).setDepth(1);

    // The cake: sponge, an icing band on top, a layer of cream.
    this.add.rectangle(CX, CY + 8, WIDTH, HEIGHT, 0x000000, 0.12).setRounded(26);
    this.cake = this.add.rectangle(CX, CY, WIDTH, HEIGHT, 0xc98b5a).setRounded(26).setStrokeStyle(5, 0xa8693b);
    this.add.rectangle(CX, TOP + HEIGHT * 0.11 + 3, WIDTH - 10, HEIGHT * 0.22, 0xfff3f8).setRounded(20);
    this.add.rectangle(CX, TOP + HEIGHT * 0.62, WIDTH - 10, 12, 0xffd1e3);
    this.holder = this.add.rectangle(CX, CY, TRACE_WIDTH + 16, TRACE_WIDTH * 1.4 + 16, COLORS.white, 0.85).setRounded(20);
    this.age = this.add.text(CX, CY, '', textStyle(HEIGHT * 0.55, 0xff4f93)).setOrigin(0.5);
    this.tag('cake', this.cake);
    this.message = this.add.text(PANEL_X, 660, '', textStyle(24, COLORS.red, { wordWrap: { width: 380 } })).setOrigin(0.5);
    this.party = [];

    this.hint = new IdleHint(this, () => this.hintPoint(), { onShow: () => this.report({ reminder: this.step }) });
    this.startCake();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  startCake() {
    this.number = this.ages[this.index];
    this.friend = this.friends[this.index];
    this.friendName = this.words.CUSTOMER_NAMES[this.friend.id];
    this.numberWord = this.words.NUMBER_WORDS[this.number];
    this.restarts = 0;
    this.firstCheck = null;
    this.clearCandles();
    this.party.forEach((object) => object.destroy());
    this.party = [];
    if (this.friendArt) this.friendArt.destroy();
    this.friendArt = glyph(this, FRIEND_AT.x, FRIEND_AT.y, this.friend.emoji, FRIEND_AT.size);
    this.age.setText('');
    this.holder.setVisible(true);
    this.counter.setText(t('tracing.progress', { index: this.index + 1, total: this.ages.length }) + `   ⭐ ${this.points}`);
    this.layer = new TraceLayer(this, CX - TRACE_WIDTH / 2, CY - (TRACE_WIDTH * 1.4) / 2, TRACE_WIDTH, {
      strokes: digitCheckpoints(this.number),
      look: ICING_LOOK,
      onHint: (kind) => this.traceHint(kind),
      onComplete: () => this.iced(),
      onTouch: () => this.hint.reset(),
    });
    this.setStep('icing');
    this.say(this.words.say.cake.intro({ friend: this.friendName, word: this.numberWord }));
  }

  setStep(step) {
    this.step = step;
    this.showPanel();
    this.narrator.text.setText(this.bubble());
    if (step === 'party') this.hint.pause();
    else this.hint.resume();
    this.report(this.snapshot());
  }

  bubble() {
    const lit = this.candles.filter((candle) => candle.lit).length;
    return this.words.say.cake.show[this.step]({ friend: this.friendName, number: this.number, lit });
  }

  say(line) {
    this.narrator.say(line, { show: this.bubble(), force: true });
  }

  snapshot() {
    return {
      step: this.step,
      index: this.index,
      total: this.ages.length,
      number: this.number,
      points: this.points,
      restarts: this.restarts,
      firstCheck: this.firstCheck,
      candles: this.candles.length,
      lit: this.candles.filter((candle) => candle.lit).length,
      cake: { x: CX, y: CY, width: WIDTH, height: HEIGHT },
      guide: this.layer ? this.layer.guidePoints() : null,
      ...(this.layer ? { strokeIndex: this.layer.strokeIndex } : {}),
    };
  }

  // ---- icing ----
  traceHint(kind) {
    if (kind === 'start') this.say(t('tracing.sayStartDot'));
    else if (kind === 'next') this.say(t('tracing.sayNextLine'));
    else {
      this.restarts += 1;
      play(this, 'wrong');
      this.say(t('tracing.sayAlmostDigit'));
    }
    this.report({ hint: kind, restarts: this.restarts });
  }

  iced() {
    play(this, 'correct');
    this.layer.destroy();
    this.layer = null;
    this.holder.setVisible(false);
    this.age.setText(String(this.number));
    this.setStep('candles');
    this.say(this.words.say.cake.iced({ number: this.number, word: this.numberWord }));
  }

  // ---- candles ----
  showPanel() {
    this.panel.forEach((object) => object.destroy());
    this.panel = [];
    if (this.step !== 'candles') return;
    this.panel = countPanel(this, PANEL_X, {
      count: this.candles.length,
      draw: emojiItem(CANDLE),
      target: () => new Phaser.Geom.Rectangle(LEFT, TOP, WIDTH, HEIGHT),
      onDrop: (x) => this.addCandle(x),
      onTakeOne: () => this.takeOne(),
      onDone: () => this.check(),
    });
  }

  addCandle(x) {
    if (this.step !== 'candles' || this.candles.length >= MAX_ON_TRAY_TARGET) return;
    const left = LEFT + Math.min(WIDTH - CANDLE_WIDTH / 2, Math.max(CANDLE_WIDTH / 2, x));
    const i = this.candles.length;
    const stick = glyph(this, left, TOP - 34 * K, CANDLE, 40 * K);
    const flame = glyph(this, left, TOP - 82 * K, '🔥', 26 * K).setVisible(false);
    const puff = glyph(this, left, TOP - 82 * K, '💨', 26 * K).setVisible(false);
    stick.setInteractive({ useHandCursor: true }).on('pointerup', () => this.blow(i));
    this.tag(`candle:${i}`, stick);
    this.candles.push({ x: left, stick, flame, puff, lit: false });
    this.candlesChanged(true);
  }

  takeOne() {
    const candle = this.candles.pop();
    if (!candle) return;
    [candle.stick, candle.flame, candle.puff].forEach((object) => object.destroy());
    this.candlesChanged(false);
  }

  candlesChanged(clearMessage) {
    const message = this.message.text;
    this.showPanel();
    this.message.setText(clearMessage ? '' : message);
    this.hint.reset();
    this.narrator.say(String(this.candles.length), { show: this.bubble(), force: true });
    this.report(this.snapshot());
  }

  clearCandles() {
    this.candles.forEach(({ stick, flame, puff }) => [stick, flame, puff].forEach((object) => object.destroy()));
    this.candles = [];
  }

  check() {
    const result = checkCount(this.candles.length, this.number);
    if (this.firstCheck === null) this.firstCheck = result;
    const words = this.words.say.cake;
    const values = { friend: this.friendName, number: this.number, placed: this.candles.length };
    if (result === 'right') {
      play(this, 'correct');
      this.message.setText('');
      this.candles.forEach((candle) => {
        candle.lit = true;
        candle.flame.setVisible(true);
      });
      this.setStep('blow');
      this.say(words.right({ number: this.number }));
      return;
    }
    play(this, 'wrong');
    this.message.setText(result === 'more' ? words.tooFewShow(values) : words.tooManyShow(values));
    this.narrator.say(result === 'more' ? words.tooFew(values) : words.tooMany(values), { show: this.bubble(), force: true });
    this.report({ firstCheck: this.firstCheck, checked: result });
  }

  // ---- blowing out ----
  blow(i) {
    const candle = this.candles[i];
    if (this.step !== 'blow' || !candle || !candle.lit) return;
    candle.lit = false;
    candle.flame.setVisible(false);
    candle.puff.setVisible(true);
    this.tweens.add({ targets: candle.puff, y: candle.puff.y - 20, alpha: { from: 1, to: 0.4 }, duration: 500 });
    const lit = this.candles.filter((c) => c.lit).length;
    if (lit > 0) {
      this.narrator.say(String(lit), { show: this.bubble(), force: true });
      this.report({ lit });
      return;
    }
    this.points += roundPoint({ restarts: this.restarts, firstCheck: this.firstCheck });
    play(this, 'correct');
    this.setStep('party');
    this.say(this.words.say.cake.party({ friend: this.friendName }));
    this.party = ['🎈', '🎉', '🎁', '🎉', '🎈'].map((emoji, n) => glyph(this, CX - 120 + n * 60, TOP + HEIGHT + 40, emoji, 40));
    this.tweens.add({ targets: this.friendArt, scale: { from: 1, to: 1.2 }, duration: 220, yoyo: true, repeat: 2 });
    this.time.delayedCall(PARTY_MS, () => {
      this.index += 1;
      if (this.index < this.ages.length) this.startCake();
      else this.finish();
    });
  }

  hintPoint() {
    if (this.step === 'icing' && this.layer) {
      const [x, y] = this.layer.startPoint();
      return { x, y: y - 22 };
    }
    if (this.step === 'candles') return this.candles.length >= this.number ? { x: PANEL_X, y: 510 } : { x: PANEL_X - 60, y: 395 };
    if (this.step === 'blow') {
      const candle = this.candles.find((c) => c.lit);
      return candle ? { x: candle.x, y: TOP - 100 * K } : null;
    }
    return null;
  }

  finish() {
    const total = this.ages.length;
    this.swap('Results', {
      skillIds: [this.skill.id],
      mode: 'practice',
      score: this.points,
      total,
      tallies: { [this.skill.id]: { correct: this.points, total } },
      replay: { key: this.scene.key, data: this.startData },
    });
  }
}
