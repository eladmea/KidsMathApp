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
import { CAKES_PER_ROUND, CUSTOMERS, MAX_ON_TRAY_TARGET, candleSlots, checkCount, roundPoint } from '../logic/writingGames';
import { getSkill } from '../curriculum/skills';
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
const TRACE_WIDTH = WIDTH * 0.5;
const ICING_LOOK = { dot: 17, guide: 0xf7d2e2, guideCurrent: 0xf3b5cf, done: 0xff4f93, trail: 0xff4f93, trailSize: 30, road: 0xfbd0e1, demo: '🧁' };
const CANDLE = '🕯️';
// How much higher the back row of candles stands.
const ROW_LIFT = 46 * K;
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
    this.addGameHeader(this.skill);
    glyph(this, FRIEND_AT.x + 50, FRIEND_AT.y - 50, '🥳', 44).setDepth(1);

    // The cake: sponge, an icing band on top, a layer of cream.
    this.add.rectangle(CX, CY + 8, WIDTH, HEIGHT, 0x000000, 0.12).setRounded(26);
    this.cake = this.add.rectangle(CX, CY, WIDTH, HEIGHT, 0xc98b5a).setRounded(26).setStrokeStyle(5, 0xa8693b);
    this.add.rectangle(CX, TOP + HEIGHT * 0.11 + 3, WIDTH - 10, HEIGHT * 0.22, 0xfff3f8).setRounded(20);
    this.add.rectangle(CX, TOP + HEIGHT * 0.62, WIDTH - 10, 12, 0xffd1e3);
    this.holder = this.add.rectangle(CX, CY, TRACE_WIDTH + 16, TRACE_WIDTH * 1.4 + 16, COLORS.white, 0.85).setRounded(20);
    this.age = this.add.text(CX, CY, '', textStyle(HEIGHT * 0.55, 0xff4f93)).setOrigin(0.5);
    this.tag('cake', this.cake);
    // Blowing: a tap on the cake blows the lit candle nearest to it.
    this.cake.setInteractive().on('pointerup', (pointer) => this.blowNearest(pointer.worldX));
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
    this.setCounter(this.index + 1, this.ages.length, this.points);
    this.layer = new TraceLayer(this, CX - TRACE_WIDTH / 2, CY - (TRACE_WIDTH * 1.4) / 2, TRACE_WIDTH, {
      strokes: digitCheckpoints(this.number),
      look: ICING_LOOK,
      onHint: (kind) => this.traceHint(kind),
      onComplete: () => this.iced(),
      onTouch: () => this.hint.reset(),
    });
    this.setStep('icing');
    this.say(this.words.say.cake.intro({ friend: this.friendName, number: this.number, word: this.numberWord }));
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
      spots: this.candles.map((candle) => [Math.round(candle.x), Math.round(candle.stick.y)]),
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
      onDrop: () => this.addCandle(),
      onTakeOne: () => this.takeOne(),
      onDone: () => this.check(),
    });
  }

  // Candles line up evenly on the cake wherever they are dropped (two rows
  // when there are many), so each one can be tapped to blow it out.
  addCandle() {
    if (this.step !== 'candles' || this.candles.length >= MAX_ON_TRAY_TARGET) return;
    const i = this.candles.length;
    const stick = glyph(this, 0, 0, CANDLE, 40 * K);
    const flame = glyph(this, 0, 0, '🔥', 26 * K).setVisible(false);
    const puff = glyph(this, 0, 0, '💨', 26 * K).setVisible(false);
    // A tap anywhere in the candle's column (stick and flame) blows it.
    const zone = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this.blow(i));
    this.tag(`candle:${i}`, zone);
    this.candles.push({ x: 0, puffY: 0, stick, flame, puff, zone, lit: false });
    this.arrangeCandles();
    this.candlesChanged(true);
  }

  arrangeCandles() {
    const slots = candleSlots(this.candles.length, WIDTH - 20);
    this.candles.forEach((candle, i) => {
      const { x, row, spacing } = slots[i];
      const left = LEFT + 10 + x;
      const lift = row * ROW_LIFT;
      candle.x = left;
      candle.stick.setPosition(left, TOP - 34 * K - lift).setDepth(2 - row);
      candle.flame.setPosition(left, TOP - 82 * K - lift).setDepth(2 - row);
      candle.puff.setPosition(left, TOP - 82 * K - lift).setDepth(2 - row);
      candle.puffY = candle.puff.y;
      // Front row: from the flame down onto the cake. Back row: above that.
      const top = TOP - 100 * K - lift;
      const bottom = row === 0 ? TOP + 10 : TOP - 100 * K;
      candle.zone.setPosition(left, (top + bottom) / 2).setSize(spacing, bottom - top).setDepth(3);
    });
  }

  takeOne() {
    const candle = this.candles.pop();
    if (!candle) return;
    [candle.stick, candle.flame, candle.puff, candle.zone].forEach((object) => object.destroy());
    this.arrangeCandles();
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
    this.candles.forEach(({ stick, flame, puff, zone }) => [stick, flame, puff, zone].forEach((object) => object.destroy()));
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
  blowNearest(x) {
    if (this.step !== 'blow') return;
    const lit = this.candles.map((candle, i) => ({ candle, i })).filter(({ candle }) => candle.lit);
    if (!lit.length) return;
    const nearest = lit.reduce((best, c) => (Math.abs(c.candle.x - x) < Math.abs(best.candle.x - x) ? c : best));
    this.blow(nearest.i);
  }

  blow(i) {
    const candle = this.candles[i];
    if (this.step !== 'blow' || !candle || !candle.lit) return;
    candle.lit = false;
    candle.flame.setVisible(false);
    candle.puff.setVisible(true);
    this.tweens.add({ targets: candle.puff, y: candle.puffY - 20, alpha: { from: 1, to: 0.4 }, duration: 500 });
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
      return candle ? { x: candle.x, y: candle.flame.y - 18 * K } : null;
    }
    return null;
  }

  finish() {
    this.finishRound(this.skill.id, this.points, this.ages.length);
  }
}
