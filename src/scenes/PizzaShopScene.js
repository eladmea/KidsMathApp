import Phaser from 'phaser';
import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import PaintLayer, { DragSurface } from '../ui/PaintLayer';
import TraceLayer from '../ui/TraceLayer';
import { countPanel } from '../ui/CountPanel';
import { IdleHint } from '../ui/HintArrow';
import { art, glyph } from '../ui/Art';
import { COLORS, textStyle } from '../ui/theme';
import { texture } from '../services/assets';
import { session } from '../services/session';
import { play } from '../services/audio';
import { content } from '../content/index';
import { getRecord, hasPassed } from '../logic/progress';
import { digitCheckpoints, numberPool, pickDistinct } from '../logic/tracing';
import {
  CHEESE_COVERED,
  CUSTOMERS,
  CUTS_NEEDED,
  MAX_ON_TRAY_TARGET,
  PIZZAS_PER_ROUND,
  ROLL_TOUCH,
  ROLL_WIDTHS,
  SAUCE_COVERED,
  SLICES,
  STATIONS,
  TOPPINGS,
  checkCount,
  cheeseShreds,
  clampToCircle,
  coverAt,
  coverageRatio,
  isCut,
  makeCoverage,
  meltedCheese,
  roundPoint,
  stationStatus,
} from '../logic/writingGames';
import { getSkill } from '../curriculum/skills';
import { skillTitle } from '../i18n/names';
import { t } from '../i18n/index';

// Pizza Shop: an animal orders a pizza with a number of toppings. Roll the
// dough, write the number in sauce (any stroke order, judged by the result),
// spread the sauce and the cheese, pick a topping and put that many on, bake
// it in the oven, cut it into 4 slices and feed them to the customer.
// A pizza earns a point when the writing needed at most one restart and the
// first count was right. 2 pizzas make a round, then Results.
//   data: { skillId }

const SIZE = 380;
const CX = 620;
const CY = 430;
const LEFT = CX - SIZE / 2;
const TOP = CY - SIZE / 2;
// The old app's pizza was 280 wide; its pixel sizes scale with this.
const K = SIZE / 280;
const CRUST = 9 * K;
const SAUCE_DAB = SIZE * 0.06;
const CHEESE_REACH = SIZE * 0.075;
const MAX_SAUCE_DABS = 180;
const MAX_CHEESE_DABS = 160;
const PAINT_GAP = SIZE * 0.035;
const BAKE_MS = 2400;
const NEXT_MS = 2600;
const TRACE_WIDTH = SIZE * 0.5;
const SAUCE_LOOK = { dot: 19, guide: 0xebcb9c, guideCurrent: 0xe2b47a, done: COLORS.sauce, trail: COLORS.sauce, trailSize: 22, demo: '🥄' };
const CUSTOMER_AT = { x: 170, y: 300, size: 110 };
const PANEL_X = 1030;
const OVEN = { x: PANEL_X, y: 430, width: 260, height: 190 };
const CHEESE = { color: 0xffd84d, edge: 0xedb92e, bakedColor: 0xffe38a, bakedEdge: 0xf2b441 };

export default class PizzaShopScene extends BaseScene {
  static key = 'PizzaShop';
  static plays = ['PizzaShop'];

  build({ skillId = 'math-pizza' } = {}) {
    this.skill = getSkill(skillId);
    const bigNumbers = hasPassed(getRecord(session.progress, 'math-write-1-5'));
    this.numbers = pickDistinct(numberPool({ bigNumbers }), PIZZAS_PER_ROUND);
    this.customers = pickDistinct(CUSTOMERS, PIZZAS_PER_ROUND);
    this.words = content('math');
    this.index = 0;
    this.points = 0;
    this.panel = [];
    this.layer = null;
    this.timer = null;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff3e0).setOrigin(0, 0);
    this.addBackButton();
    this.narrator = new Narrator(this, 660, 70, { width: 800, fontSize: 30 });
    this.title = this.add.text(30, 150, t('quiz.title', { emoji: this.skill.emoji, title: skillTitle(this.skill) }), textStyle(24, COLORS.gray)).setOrigin(0, 0.5);
    this.counter = this.add.text(1250, 150, '', textStyle(28)).setOrigin(1, 0.5);
    this.buildStations();
    this.buildTicket();
    this.buildPizza();
    this.buildOven();
    this.meter = this.add.container(CX, TOP + SIZE + 34);
    this.meterBack = this.add.rectangle(0, 0, 300, 20, COLORS.white).setRounded(10);
    this.meterFill = this.add.rectangle(-150, 0, 0, 20, COLORS.sauce).setOrigin(0, 0.5).setRounded(10);
    this.meter.add([this.meterBack, this.meterFill]);
    this.message = this.add.text(PANEL_X, 660, '', textStyle(24, COLORS.red, { wordWrap: { width: 380 } })).setOrigin(0.5);

    this.surface = new DragSurface(this, LEFT, TOP, SIZE, SIZE, {
      onStart: (x, y) => this.touch(x, y, true),
      onMove: (x, y) => this.touch(x, y, false),
      onEnd: (x, y) => this.lift(x, y),
    });
    this.hint = new IdleHint(this, () => this.hintPoint(), { onShow: () => this.sayIdle() });
    this.startPizza();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // ---- building the screen ----
  buildStations() {
    this.stations = STATIONS.map((station, i) => {
      const x = 440 + i * 190;
      const box = this.add.rectangle(0, 0, 160, 62, 0xfffdf7).setRounded(20).setStrokeStyle(3, 0xe5d3b3);
      const icon = glyph(this, -54, 0, station.emoji, 30);
      const label = this.add.text(-30, 0, t(`pizza.stations.${station.id}`), textStyle(20, COLORS.gray)).setOrigin(0, 0.5);
      const badge = this.add.circle(72, -28, 14, COLORS.greenDark);
      const tick = this.add.text(72, -28, '✓', textStyle(18, COLORS.white)).setOrigin(0.5);
      const container = this.add.container(x, 150, [box, icon, label, badge, tick]);
      const arrow = i > 0 ? this.add.text(x - 95, 150, '›', textStyle(34, COLORS.gray)).setOrigin(0.5) : null;
      return { station, container, box, label, badge, tick, arrow };
    });
  }

  buildTicket() {
    this.add.rectangle(CUSTOMER_AT.x, 500, 190, 170, 0xfffdf5).setRounded(20).setStrokeStyle(3, 0xe5d3b3);
    this.add.text(CUSTOMER_AT.x, 440, t('pizza.order'), textStyle(20, COLORS.gray)).setOrigin(0.5);
    this.orderNumber = this.add.text(CUSTOMER_AT.x, 515, '', textStyle(90, COLORS.sauce)).setOrigin(0.5);
    this.customerArt = null;
  }

  buildPizza() {
    this.pizza = this.add.container(CX, CY);
    this.shadow = this.add.circle(0, 10, SIZE / 2, 0x000000, 0.12);
    this.dough = this.add.circle(0, 0, SIZE / 2, 0xf3d9a4).setStrokeStyle(4 * K, 0xe2bd78);
    this.crust = this.add.circle(0, 0, SIZE / 2, 0xe2b26b);
    this.base = this.add.circle(0, 0, SIZE / 2 - CRUST, 0xf6dfb0);
    this.sauce = new PaintLayer(this, -SIZE / 2, -SIZE / 2, SIZE, SIZE, { color: COLORS.sauce, radius: SAUCE_DAB });
    this.sauceDisc = this.add.circle(0, 0, SIZE / 2 - 13 * K, COLORS.sauce);
    this.cheese = this.add.renderTexture(-SIZE / 2, -SIZE / 2, SIZE, SIZE).setOrigin(0, 0);
    this.toppingsLayer = this.add.container(0, 0);
    this.cuts = this.add.graphics();
    this.pizza.add([this.shadow, this.dough, this.crust, this.base, this.sauce.rt, this.sauceDisc, this.cheese, this.toppingsLayer, this.cuts]);
    this.rollingPin = glyph(this, LEFT + SIZE - 30, TOP + SIZE - 30, '🥖', 64);
    this.slices = [];
    this.makeShredTextures();
    this.tag('pizza', this.crust);
  }

  makeShredTextures() {
    const shred = (key, width, height, color, edge) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(edge, 1).fillRoundedRect(0, 0, width + 2, height + 2, 3);
      g.fillStyle(color, 1).fillRoundedRect(1, 1, width, height, 3);
      g.generateTexture(key, width + 2, height + 2);
      g.destroy();
    };
    shred('cheese-shred', 14 * K, 5 * K, CHEESE.color, CHEESE.edge);
    shred('cheese-melted', 18 * K, 7 * K, CHEESE.bakedColor, CHEESE.bakedEdge);
  }

  buildOven() {
    const { x, y, width, height } = OVEN;
    this.oven = this.add.container(x, y);
    this.ovenBox = this.add.rectangle(0, 0, width, height, 0x5b5552).setRounded(24).setStrokeStyle(6, 0x3e3936);
    this.ovenWindow = this.add.rectangle(0, 10, width * 0.72, height * 0.48, 0x2a2624).setRounded(16);
    const knobs = [this.add.circle(width / 2 - 26, -height / 2 + 22, 8, 0xc8c2be), this.add.circle(width / 2 - 52, -height / 2 + 22, 8, 0xc8c2be)];
    this.flames = glyph(this, 0, height / 2 - 26, '🔥', 26);
    this.ovenPizza = glyph(this, 0, 10, '🍕', 56).setVisible(false);
    this.oven.add([this.ovenBox, this.ovenWindow, ...knobs, this.flames, this.ovenPizza]);
    this.tag('oven', this.ovenBox);
  }

  // ---- one pizza ----
  startPizza() {
    this.number = this.numbers[this.index];
    this.friend = this.customers[this.index];
    this.friendName = this.words.CUSTOMER_NAMES[this.friend.id];
    this.numberWord = this.words.NUMBER_WORDS[this.number];
    this.restarts = 0;
    this.firstCheck = null;
    this.rolled = 0;
    this.lastPaint = null;
    this.dabs = 0;
    this.coverage = makeCoverage(SIZE);
    this.waitForLift = false;
    this.topping = null;
    this.placed = [];
    this.cutCount = 0;
    this.eaten = [];
    this.swipeStart = null;
    this.grabbed = null;

    this.setCustomer(this.friend.emoji);
    this.orderNumber.setText(String(this.number));
    this.pizza.setPosition(CX, CY).setScale(1).setAlpha(1).setVisible(true).setDepth(0);
    this.sauce.clear();
    this.cheese.clear();
    this.cheese.render();
    this.toppingsLayer.removeAll(true);
    this.cuts.clear();
    this.slices.forEach((slice) => slice.destroy());
    this.slices = [];
    this.ovenPizza.setVisible(false);
    this.counter.setText(t('tracing.progress', { index: this.index + 1, total: this.numbers.length }) + `   ⭐ ${this.points}`);
    this.setStep('dough');
    this.say(this.words.say.pizza.order({ friend: this.friendName, number: this.number, word: this.numberWord }));
  }

  setCustomer(emoji) {
    if (this.customerArt) this.customerArt.destroy();
    this.customerArt = glyph(this, CUSTOMER_AT.x, CUSTOMER_AT.y, emoji, CUSTOMER_AT.size);
    this.tag('customer', this.customerArt);
  }

  setStep(step) {
    this.step = step;
    const baked = ['slice', 'feed', 'done'].includes(step);
    this.dough.setVisible(step === 'dough');
    this.shadow.setVisible(step !== 'dough');
    this.rollingPin.setVisible(step === 'dough');
    if (step === 'dough') this.dough.setScale(0.35);
    this.crust.setVisible(step !== 'dough').setFillStyle(baked ? 0xc9873a : 0xe2b26b);
    this.base.setVisible(step !== 'dough');
    this.sauce.rt.setVisible(['trace', 'sauce'].includes(step));
    this.sauceDisc.setVisible(!['dough', 'trace', 'sauce'].includes(step));
    this.meter.setVisible(step === 'sauce' || step === 'cheese');
    this.meterFill.setFillStyle(step === 'cheese' ? 0xf2c230 : COLORS.sauce);
    this.updateMeter();
    this.oven.setVisible(['oven', 'baking'].includes(step));
    this.ovenBox.setStrokeStyle(6, step === 'baking' ? 0xff7a1a : 0x3e3936);
    this.ovenWindow.setFillStyle(step === 'baking' ? 0xe86a1c : 0x2a2624);
    this.surface.setEnabled(!['trace', 'topping', 'place', 'baking', 'done'].includes(step));
    this.updateStations();
    this.showPanel();
    this.showBubble();
    if (step === 'trace') this.showTrace();
    if (step === 'baking' || step === 'done') this.hint.pause();
    else this.hint.resume();
    this.report(this.snapshot());
  }

  updateStations() {
    this.stations.forEach(({ station, container, box, label, badge, tick, arrow }) => {
      const status = this.step === 'dough' ? 'hidden' : stationStatus(station, this.step);
      container.setVisible(status !== 'hidden');
      if (arrow) arrow.setVisible(status !== 'hidden');
      container.setAlpha(status === 'later' ? 0.3 : 1).setScale(status === 'active' ? 1.12 : 1);
      box.setStrokeStyle(status === 'active' ? 5 : 3, status === 'active' ? COLORS.orange : 0xe5d3b3).setFillStyle(status === 'active' ? COLORS.white : 0xfffdf7);
      label.setColor(status === 'active' ? '#2d3142' : '#9e9e9e');
      badge.setVisible(status === 'done');
      tick.setVisible(status === 'done');
    });
  }

  showBubble(line) {
    const show = this.words.say.pizza.show[this.step]({ number: this.number, cuts: this.cutCount, eaten: this.eaten.length });
    if (line) this.narrator.say(line, { show, force: true });
    else this.narrator.text.setText(show);
  }

  say(line) {
    this.showBubble(line);
  }

  // What this test hook and a browser test need to know.
  snapshot() {
    return {
      step: this.step,
      index: this.index,
      total: this.numbers.length,
      number: this.number,
      points: this.points,
      restarts: this.restarts,
      firstCheck: this.firstCheck,
      rolled: this.rolled,
      cover: coverageRatio(this.coverage),
      topping: this.topping && this.topping.id,
      placed: this.placed.length,
      cuts: this.cutCount,
      eaten: this.eaten.length,
      pizza: { x: CX, y: CY, size: SIZE },
      oven: { x: OVEN.x, y: OVEN.y },
      customer: { x: CUSTOMER_AT.x, y: CUSTOMER_AT.y },
      guide: this.layer ? this.layer.guidePoints() : null,
    };
  }

  // ---- the panel on the right: toppings, the tray, Done ----
  clearPanel() {
    this.panel.forEach((object) => object.destroy());
    this.panel = [];
  }

  showPanel() {
    this.clearPanel();
    this.message.setText('');
    if (this.step === 'topping') this.showToppings();
    if (this.step === 'place') this.showTray();
  }

  showToppings() {
    TOPPINGS.forEach((topping, i) => {
      const x = PANEL_X - 75 + (i % 2) * 150;
      const y = 330 + Math.floor(i / 2) * 160;
      const card = this.add.rectangle(x, y, 130, 140, COLORS.white).setRounded(24).setStrokeStyle(4, COLORS.orange).setInteractive({ useHandCursor: true });
      const picture = this.drawTopping(topping)(this, x, y - 16, 56);
      const label = this.add.text(x, y + 44, this.words.TOPPING_NAMES[topping.id].card, textStyle(20)).setOrigin(0.5);
      card.on('pointerup', () => this.pickTopping(topping));
      this.tag(`topping:${topping.id}`, card);
      this.panel.push(card, picture, label);
    });
  }

  // A topping's picture: art for `toppings/<id>` if added, else its emoji;
  // olives are drawn slices.
  drawTopping(topping) {
    return (scene, x, y, size) => {
      if (topping.emoji || texture(scene, `toppings/${topping.id}`)) return art(scene, x, y, { key: `toppings/${topping.id}`, emoji: topping.emoji || '', size });
      const ring = scene.add.graphics({ x, y });
      ring.lineStyle(size * 0.22, 0x2f2b26, 1).strokeCircle(0, 0, size * 0.3);
      return ring;
    };
  }

  showTray() {
    this.panel.push(
      ...countPanel(this, PANEL_X, {
        count: this.placed.length,
        draw: this.drawTopping(this.topping),
        target: () => new Phaser.Geom.Rectangle(LEFT, TOP, SIZE, SIZE),
        onDrop: (x, y) => this.dropTopping(x, y),
        onTakeOne: () => this.takeOne(),
        onDone: () => this.check(),
      })
    );
  }

  pickTopping(topping) {
    if (this.step !== 'topping') return;
    this.topping = topping;
    this.setStep('place');
    this.say(this.words.say.pizza.picked({ number: this.number, word: this.numberWord, topping: this.toppingName() }));
  }

  toppingName() {
    return this.words.TOPPING_NAMES[this.topping.id];
  }

  dropTopping(x, y) {
    if (this.step !== 'place' || this.placed.length >= MAX_ON_TRAY_TARGET) return;
    const [px, py] = clampToCircle(x, y, SIZE, 0.16);
    this.placed.push([px, py]);
    this.toppingsLayer.add(this.drawTopping(this.topping)(this, px - SIZE / 2, py - SIZE / 2, 36 * K));
    this.placedChanged(true);
  }

  takeOne() {
    if (!this.placed.length) return;
    this.placed.pop();
    const last = this.toppingsLayer.list[this.toppingsLayer.list.length - 1];
    if (last) last.destroy();
    this.placedChanged(false);
  }

  placedChanged(clearMessage) {
    const message = this.message.text;
    this.showPanel();
    if (!clearMessage) this.message.setText(message);
    this.hint.reset();
    this.narrator.say(String(this.placed.length), { show: this.narrator.text.text, force: true });
    this.report(this.snapshot());
  }

  check() {
    const result = checkCount(this.placed.length, this.number);
    if (this.firstCheck === null) this.firstCheck = result;
    const words = this.words.say.pizza;
    const values = { friend: this.friendName, number: this.number, placed: this.placed.length };
    if (result === 'right') {
      play(this, 'correct');
      this.setStep('oven');
      this.say(words.right({ number: this.number, topping: this.toppingName() }));
      return;
    }
    play(this, 'wrong');
    const show = result === 'more' ? words.tooFewShow(values) : words.tooManyShow(values);
    this.message.setText(show);
    this.narrator.say(result === 'more' ? words.tooFew(values) : words.tooMany(values), { show: this.narrator.text.text, force: true });
    this.report({ firstCheck: this.firstCheck, checked: result });
  }

  // ---- writing the number in sauce ----
  showTrace() {
    this.layer = new TraceLayer(this, CX - TRACE_WIDTH / 2, CY - (TRACE_WIDTH * 1.4) / 2, TRACE_WIDTH, {
      strokes: digitCheckpoints(this.number),
      look: SAUCE_LOOK,
      freeOrder: true,
      onHint: (kind) => this.traceHint(kind),
      onComplete: () => this.traceDone(),
      onTouch: () => this.hint.reset(),
    });
  }

  traceHint(kind) {
    const words = this.words.say.pizza;
    if (kind === 'messy') {
      this.restarts += 1;
      play(this, 'wrong');
      this.say(words.messy({ word: this.numberWord }));
    } else {
      this.say(words.more({ word: this.numberWord }));
    }
    this.report({ hint: kind, restarts: this.restarts });
  }

  traceDone() {
    play(this, 'correct');
    // The written number stays as sauce, and counts towards covering it.
    this.layer.guidePoints().forEach((stroke) =>
      stroke.forEach(([x, y], i) => {
        if (i % 2) return;
        this.sauce.begin(x - LEFT, y - TOP);
        this.sauce.end();
        this.coverage = coverAt(this.coverage, x - LEFT, y - TOP, SAUCE_DAB);
      })
    );
    this.layer.destroy();
    this.layer = null;
    this.setStep('sauce');
    this.say(this.words.say.pizza.written({ word: this.numberWord }));
  }

  // ---- rubbing: dough, sauce, cheese; dragging: oven, slices; swiping ----
  touch(x, y, isStart) {
    if (this.step === 'dough') return this.roll(x, y, isStart);
    if (this.step === 'sauce' || this.step === 'cheese') return this.spread(x, y, isStart);
    if (this.step === 'oven') return this.dragPizza(x, y, isStart);
    if (this.step === 'slice' && isStart) this.swipeStart = [x, y];
    if (this.step === 'feed') return this.dragSlice(x, y, isStart);
  }

  lift(x, y) {
    this.lastPaint = null;
    this.sauce.end();
    if (this.step === 'oven') return this.dropPizza();
    if (this.step === 'slice' && this.swipeStart) return this.swipe([x, y]);
    if (this.step === 'feed') return this.dropSlice();
    if (this.waitForLift) this.waitForLift = false;
  }

  roll(x, y, isStart) {
    const total = ROLL_WIDTHS * SIZE;
    if (isStart) this.rolled += ROLL_TOUCH;
    else if (this.lastPaint) this.rolled += Math.hypot(x - this.lastPaint[0], y - this.lastPaint[1]) / total;
    this.lastPaint = [x, y];
    this.rolled = Math.min(1, this.rolled);
    this.dough.setScale(0.35 + 0.65 * this.rolled);
    this.report({ rolled: this.rolled });
    if (this.rolled >= 1) {
      play(this, 'correct');
      this.setStep('trace');
      this.say(this.words.say.pizza.rolled({ word: this.numberWord }));
    }
  }

  spread(rawX, rawY, isStart) {
    if (this.waitForLift) return;
    if (!isStart && this.lastPaint && Math.hypot(rawX - this.lastPaint[0], rawY - this.lastPaint[1]) < PAINT_GAP) return;
    this.lastPaint = [rawX, rawY];
    const [x, y] = clampToCircle(rawX, rawY, SIZE, 0.12);
    if (this.step === 'sauce') {
      if (this.dabs < MAX_SAUCE_DABS) {
        if (isStart) this.sauce.begin(x, y);
        else this.sauce.to(x, y);
      }
      this.coverage = coverAt(this.coverage, x, y, SAUCE_DAB);
    } else {
      if (this.dabs < MAX_CHEESE_DABS) this.sprinkle(x, y);
      this.coverage = coverAt(this.coverage, x, y, CHEESE_REACH);
    }
    this.dabs += 1;
    this.updateMeter();
    const ratio = coverageRatio(this.coverage);
    this.report({ cover: ratio });
    if (this.step === 'sauce' && ratio >= SAUCE_COVERED) this.sauceDone();
    else if (this.step === 'cheese' && ratio >= CHEESE_COVERED) this.cheeseDone();
  }

  sprinkle(x, y) {
    cheeseShreds(this.dabs).forEach(({ dx, dy, angle }) => this.cheese.stamp('cheese-shred', null, x + dx * SIZE, y + dy * SIZE, { angle }));
    this.cheese.render();
  }

  updateMeter() {
    const goal = this.step === 'cheese' ? CHEESE_COVERED : SAUCE_COVERED;
    this.meterFill.width = 300 * Math.min(1, coverageRatio(this.coverage) / goal);
  }

  sauceDone() {
    play(this, 'correct');
    this.coverage = makeCoverage(SIZE);
    this.dabs = 0;
    this.waitForLift = true;
    this.setStep('cheese');
    this.say(this.words.say.pizza.sauced());
  }

  cheeseDone() {
    play(this, 'correct');
    // All the cheese on: melt it into an even layer.
    this.cheese.clear();
    meltedCheese().forEach(({ dx, dy, angle }) => this.cheese.stamp('cheese-shred', null, SIZE / 2 + dx * SIZE, SIZE / 2 + dy * SIZE, { angle }));
    this.cheese.render();
    this.setStep('topping');
    this.say(this.words.say.pizza.cheesed({ friend: this.friendName, word: this.numberWord }));
  }

  // ---- the oven ----
  dragPizza(x, y, isStart) {
    if (isStart) this.grabbed = { from: [x, y] };
    if (!this.grabbed) return;
    const [fx, fy] = this.grabbed.from;
    this.pizza.setPosition(CX + x - fx, CY + y - fy).setScale(0.6).setDepth(20);
    this.grabbed.at = [LEFT + x, TOP + y];
  }

  dropPizza() {
    const at = this.grabbed && this.grabbed.at;
    this.grabbed = null;
    const { x, y, width, height } = OVEN;
    const inOven = at && Math.abs(at[0] - x) <= width / 2 + 30 && Math.abs(at[1] - y) <= height / 2 + 30;
    if (!inOven) {
      this.pizza.setPosition(CX, CY).setScale(1).setDepth(0);
      if (at) this.say(this.words.say.pizza.ovenMiss());
      return;
    }
    this.pizza.setVisible(false);
    this.ovenPizza.setVisible(true);
    this.setStep('baking');
    this.say(this.words.say.pizza.baking());
    this.timer = this.time.delayedCall(BAKE_MS, () => this.baked());
  }

  baked() {
    this.ovenPizza.setVisible(false);
    // Baked: browner crust, melted cheese.
    this.cheese.clear();
    meltedCheese().forEach(({ dx, dy, angle }) => this.cheese.stamp('cheese-melted', null, SIZE / 2 + dx * SIZE, SIZE / 2 + dy * SIZE, { angle }));
    this.cheese.render();
    this.pizza.setPosition(CX, CY).setScale(1).setDepth(0).setVisible(true);
    play(this, 'correct');
    this.setStep('slice');
    this.say(this.words.say.pizza.ready());
  }

  // ---- slicing ----
  swipe(end) {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!isCut(start, end, SIZE)) {
      this.say(this.words.say.pizza.cutMiss());
      return;
    }
    this.cutCount += 1;
    play(this, 'correct');
    this.cuts.lineStyle(4 * K, 0x462814, 0.7);
    if (this.cutCount === 1) this.cuts.lineBetween(0, -SIZE / 2, 0, SIZE / 2);
    else this.cuts.lineBetween(-SIZE / 2, 0, SIZE / 2, 0);
    if (this.cutCount < CUTS_NEEDED) {
      this.say(this.words.say.pizza.cutOne());
      this.report({ cuts: this.cutCount });
      return;
    }
    this.makeSlices();
    this.setStep('feed');
    this.say(this.words.say.pizza.cutTwo({ friend: this.friendName }));
  }

  // The baked pizza becomes 4 slices: one picture of it, cropped 4 ways.
  makeSlices() {
    const key = 'pizza-baked';
    if (this.textures.exists(key)) this.textures.remove(key);
    const picture = this.textures.addDynamicTexture(key, SIZE, SIZE);
    this.cuts.setVisible(false);
    this.shadow.setVisible(false);
    picture.capture(this.pizza, { x: SIZE / 2, y: SIZE / 2, scale: 1, transform: 'local' });
    picture.render();
    this.cuts.clear().setVisible(true);
    this.shadow.setVisible(true);
    this.pizza.setVisible(false);
    const gap = 6 * K;
    this.slices = Array.from({ length: SLICES }, (_, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const image = this.add.image(CX + (col ? gap : -gap), CY + (row ? gap : -gap), key).setCrop(col * (SIZE / 2), row * (SIZE / 2), SIZE / 2, SIZE / 2);
      image.home = { x: image.x, y: image.y };
      return image;
    });
  }

  sliceAt(x, y) {
    const i = (x >= SIZE / 2 ? 1 : 0) + (y >= SIZE / 2 ? 2 : 0);
    return this.eaten.includes(i) ? null : i;
  }

  dragSlice(x, y, isStart) {
    if (isStart) {
      const i = this.sliceAt(x, y);
      this.grabbed = i === null ? null : { slice: i, from: [x, y] };
    }
    if (!this.grabbed) return;
    const slice = this.slices[this.grabbed.slice];
    const [fx, fy] = this.grabbed.from;
    slice.setPosition(slice.home.x + x - fx, slice.home.y + y - fy).setAlpha(0.9).setDepth(10);
    this.grabbed.at = [LEFT + x, TOP + y];
  }

  dropSlice() {
    const grabbed = this.grabbed;
    this.grabbed = null;
    if (!grabbed) return;
    const slice = this.slices[grabbed.slice];
    const reach = CUSTOMER_AT.size / 2 + 30;
    const at = grabbed.at;
    if (!at || Math.abs(at[0] - CUSTOMER_AT.x) > reach || Math.abs(at[1] - CUSTOMER_AT.y) > reach) {
      slice.setPosition(slice.home.x, slice.home.y).setAlpha(1).setDepth(0);
      return;
    }
    slice.setVisible(false);
    this.eaten.push(grabbed.slice);
    this.setCustomer('😋');
    play(this, 'correct');
    if (this.eaten.length < SLICES) {
      this.showBubble(this.words.say.pizza.ate({ eaten: this.eaten.length }));
      this.report({ eaten: this.eaten.length });
      return;
    }
    this.points += roundPoint({ restarts: this.restarts, firstCheck: this.firstCheck });
    this.setStep('done');
    this.say(this.words.say.pizza.allGone());
    this.report({ points: this.points });
    this.timer = this.time.delayedCall(NEXT_MS, () => {
      this.index += 1;
      if (this.index < this.numbers.length) this.startPizza();
      else this.finish();
    });
  }

  // ---- idle hints ----
  hintPoint() {
    switch (this.step) {
      case 'dough':
      case 'sauce':
      case 'cheese':
      case 'slice':
        return { x: CX, y: TOP + 20 };
      case 'trace': {
        const [x, y] = this.layer.startPoint();
        return { x, y: y - 22 };
      }
      case 'topping':
        return { x: PANEL_X, y: 250 };
      case 'place':
        return this.placed.length >= this.number ? { x: PANEL_X, y: 510 } : { x: PANEL_X - 60, y: 395 };
      case 'oven':
        return { x: OVEN.x, y: OVEN.y - OVEN.height / 2 - 10 };
      case 'feed':
        return { x: CUSTOMER_AT.x, y: CUSTOMER_AT.y - CUSTOMER_AT.size / 2 - 10 };
      default:
        return null;
    }
  }

  sayIdle() {
    const idle = this.words.say.pizza.idle;
    const values = { word: this.numberWord, number: this.number, friend: this.friendName, topping: this.topping && this.toppingName() };
    const key = this.step === 'place' && this.placed.length >= this.number ? 'placed' : this.step;
    if (idle[key]) this.narrator.say(idle[key](values), { show: this.narrator.text.text, force: true });
    if (this.step === 'trace' && this.layer) this.layer.pointAtStart(false);
    this.report({ reminder: this.step });
  }

  finish() {
    const total = this.numbers.length;
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
