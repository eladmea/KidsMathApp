import Phaser from 'phaser';
import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import TraceLayer from '../ui/TraceLayer';
import { IdleHint } from '../ui/HintArrow';
import { countPanel } from '../ui/CountPanel';
import DragTray from '../ui/DragTray';
import { art, glyph } from '../ui/Art';
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

// The cake picture (src/assets/images/cake/cake.svg, 480 x 470 units) drawn
// 460 wide: its top is an ellipse the candles stand on, and the age is
// written on its front.
const CX = 620;
const CAKE_TOP = 250;
const CAKE_WIDTH = 460;
const U = CAKE_WIDTH / 480;
const CAKE_HEIGHT = 470 * U;
const TOP = { y: CAKE_TOP + 118 * U, rx: 200 * U, ry: 48 * U };
const FRONT = { top: CAKE_TOP + 166 * U, bottom: CAKE_TOP + 384 * U };
const CY = (FRONT.top + FRONT.bottom) / 2;
// Candles may be dropped anywhere on the cake; dragging one off it puts it
// back in the box.
const ON_CAKE = new Phaser.Geom.Rectangle(CX - CAKE_WIDTH / 2, CAKE_TOP - 40, CAKE_WIDTH, FRONT.bottom - CAKE_TOP + 40);
const TRACE_WIDTH = 150;
const ICING_LOOK = { dot: 15, guide: 0xf7d2e2, guideCurrent: 0xf3b5cf, done: 0xff4f93, trail: 0xff4f93, trailSize: 26, road: 0xfbd0e1, demo: '🧁' };
const CANDLE = '🕯️';
const CANDLE_HEIGHT = 84;
const FLAME_HEIGHT = 36;
// Where the two rows of candles stand on the top, and how wide a row is.
const ROW_Y = [TOP.y + TOP.ry * 0.35, TOP.y - TOP.ry * 0.3];
const ROW_WIDTH = TOP.rx * 1.6;
const PARTY_MS = 2800;
const FRIEND_AT = { x: 170, y: 330, size: 110 };
const PANEL_X = 1030;

// A candle (art 'cake/candle', or the emoji) standing with its bottom at (x, y).
const drawCandle = (scene, x, y, height) => art(scene, x, y, { key: 'cake/candle', emoji: CANDLE, size: height / 1.15 }).setOrigin(0.5, 1);

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

    // The cake (a picture: swap src/assets/images/cake/cake.svg to change it).
    this.cake = art(this, CX, CAKE_TOP + CAKE_HEIGHT / 2, { key: 'cake/cake', emoji: '🎂', size: CAKE_WIDTH / 1.15 });
    this.holder = this.add.rectangle(CX, CY, TRACE_WIDTH + 16, TRACE_WIDTH * 1.4 + 16, COLORS.white, 0.85).setRounded(20);
    this.age = this.add.text(CX, CY, '', textStyle(170, 0xff4f93, { stroke: '#ffffff', strokeThickness: 10 })).setOrigin(0.5);
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
      cake: { x: CX, y: CY, width: CAKE_WIDTH, height: FRONT.bottom - FRONT.top },
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
    // No "Take one off": a candle is dragged off the cake back to the box.
    this.panel = countPanel(this, PANEL_X, {
      count: this.candles.length,
      draw: (scene, x, y, size) => drawCandle(scene, x, y + size * 0.6, size * 1.2),
      target: () => ON_CAKE,
      onDrop: () => this.addCandle(),
      onDone: () => this.check(),
    });
  }

  // Candles line up evenly on the top of the cake wherever they are dropped
  // (two rows when there are many), so each one can be tapped to blow it out.
  // While putting them on, one can be dragged off the cake back to the box.
  addCandle() {
    if (this.step !== 'candles' || this.candles.length >= MAX_ON_TRAY_TARGET) return;
    const stick = drawCandle(this, 0, 0, CANDLE_HEIGHT);
    const flame = art(this, 0, 0, { key: 'cake/flame', emoji: '🔥', size: FLAME_HEIGHT / 1.15 }).setOrigin(0.5, 0.93).setVisible(false);
    const puff = glyph(this, 0, 0, '💨', 26).setVisible(false);
    // A tap anywhere in the candle's column (stick and flame) blows it.
    const zone = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0.001).setInteractive({ useHandCursor: true, draggable: true });
    const candle = { x: 0, base: 0, puffY: 0, stick, flame, puff, zone, lit: false, flicker: null };
    zone.on('pointerup', () => this.blow(this.candles.indexOf(candle)));
    zone.on('drag', (pointer) => this.dragCandle(candle, pointer));
    zone.on('dragend', (pointer) => this.dropCandle(candle, pointer));
    this.candles.push(candle);
    this.arrangeCandles();
    this.candlesChanged(true);
  }

  arrangeCandles() {
    const slots = candleSlots(this.candles.length, ROW_WIDTH);
    this.candles.forEach((candle, i) => {
      const { x, row, spacing } = slots[i];
      this.standCandle(candle, CX - ROW_WIDTH / 2 + x, ROW_Y[row], 4 - row);
      // The candle's column, from above the flame down to the cake.
      const top = candle.base - CANDLE_HEIGHT - FLAME_HEIGHT - 6;
      const bottom = candle.base + (row === 0 ? 24 : 0);
      candle.zone.setPosition(candle.x, (top + bottom) / 2).setSize(Math.min(spacing, 70), bottom - top).setDepth(6);
      this.tag(`candle:${i}`, candle.zone);
    });
  }

  // Puts a candle's stick, flame and smoke with the stick's bottom at (x, base).
  standCandle(candle, x, base, depth) {
    candle.x = x;
    candle.base = base;
    candle.stick.setPosition(x, base).setDepth(depth);
    candle.flame.setPosition(x, base - CANDLE_HEIGHT + 4).setDepth(depth);
    candle.puff.setPosition(x, base - CANDLE_HEIGHT - 14).setDepth(depth);
    candle.puffY = candle.puff.y;
  }

  // Dragging a candle (only while putting candles on): it follows the finger.
  dragCandle(candle, pointer) {
    if (this.step !== 'candles') return;
    candle.dragging = true;
    this.standCandle(candle, pointer.worldX, pointer.worldY + CANDLE_HEIGHT / 2, 20);
    candle.zone.setPosition(pointer.worldX, pointer.worldY);
  }

  // Let go on the cake: it goes back in line. Anywhere else: back to the box.
  dropCandle(candle, pointer) {
    if (!candle.dragging) return;
    candle.dragging = false;
    if (this.step !== 'candles' || ON_CAKE.contains(pointer.worldX, pointer.worldY)) {
      this.arrangeCandles();
      return;
    }
    this.candles.splice(this.candles.indexOf(candle), 1);
    candle.zone.destroy();
    const tray = this.panel.find((object) => object instanceof DragTray);
    const box = tray ? tray.box.getBounds() : { centerX: PANEL_X, centerY: 440 };
    this.tweens.add({
      targets: candle.stick,
      x: box.centerX - 60,
      y: box.centerY + 24,
      scale: candle.stick.scale * 0.6,
      alpha: 0.3,
      duration: 280,
      ease: 'Quad.easeIn',
      onComplete: () => [candle.stick, candle.flame, candle.puff].forEach((object) => object.destroy()),
    });
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

  // A lit flame sways a little, each at its own pace.
  light(candle) {
    candle.lit = true;
    candle.flame.setVisible(true);
    const scale = candle.flame.scale;
    candle.flicker = this.tweens.add({ targets: candle.flame, scaleY: scale * 1.12, scaleX: scale * 0.92, angle: { from: -4, to: 4 }, duration: 260 + Math.random() * 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  check() {
    const result = checkCount(this.candles.length, this.number);
    if (this.firstCheck === null) this.firstCheck = result;
    const words = this.words.say.cake;
    const values = { friend: this.friendName, number: this.number, placed: this.candles.length };
    if (result === 'right') {
      play(this, 'correct');
      this.message.setText('');
      this.candles.forEach((candle) => this.light(candle));
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
    if (candle.flicker) candle.flicker.stop();
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
    this.party = ['🎈', '🎉', '🎁', '🎉', '🎈'].map((emoji, n) => glyph(this, CX - 300 + n * 150, CAKE_TOP + CAKE_HEIGHT - 10, emoji, 44).setDepth(8));
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
    if (this.step === 'candles') {
      // Too many: show that one can be dragged off the cake.
      const last = this.candles[this.candles.length - 1];
      if (this.candles.length > this.number) return { x: last.x, y: last.base - CANDLE_HEIGHT - 10 };
      return this.candles.length === this.number ? { x: PANEL_X, y: 510 } : { x: PANEL_X - 60, y: 395 };
    }
    if (this.step === 'blow') {
      const candle = this.candles.find((c) => c.lit);
      return candle ? { x: candle.x, y: candle.flame.y - FLAME_HEIGHT - 6 } : null;
    }
    return null;
  }

  finish() {
    this.finishRound(this.skill.id, this.points, this.ages.length);
  }
}
