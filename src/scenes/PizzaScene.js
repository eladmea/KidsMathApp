import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import Narrator from '../ui/Narrator';
import PaintLayer, { DragSurface } from '../ui/PaintLayer';
import { IdleHint } from '../ui/HintArrow';
import { COLORS, textStyle } from '../ui/theme';
import { recordRound } from '../services/session';
import { BOX, digitCheckpoints, freeTraceAdd, freeTraceResult, freeTraceStart, numberPool, pickDistinct } from '../logic/tracing';
import {
  CUSTOMERS,
  PIZZAS_PER_ROUND,
  SAUCE_COVERED,
  clampToCircle,
  coverAt,
  coverageRatio,
  makeCoverage,
} from '../logic/writingGames';
import { pick } from '../curriculum/random';

// P0 spike of Pizza Shop: write the order's number in sauce on the dough (any
// stroke order counts, judged by the result), then spread the rest of the
// sauce all over. Cheese, toppings, oven and slicing come in P3.
const SIZE = 460;
const CENTER = { x: 700, y: 420 };
const LEFT = CENTER.x - SIZE / 2;
const TOP = CENTER.y - SIZE / 2;
// The 100 x 140 tracing box, scaled onto the middle of the pizza.
const BOX_SCALE = 2.2;
const BOX_LEFT = (SIZE - BOX.width * BOX_SCALE) / 2;
const BOX_TOP = (SIZE - BOX.height * BOX_SCALE) / 2;
const TRACE_BRUSH = 18;
// The spreading brush, as a share of the pizza's size.
const SAUCE_DAB = 0.12;
const SPREAD_BRUSH = Math.round((SIZE * SAUCE_DAB) / 2);
const DOUGH = 0.9;
// Sauce stays on the dough: the brush's centre keeps a brush width inside it.
const marginFor = (brush) => 1 - (DOUGH * (SIZE / 2) - brush) / (SIZE / 2);

const toBox = (x, y) => [(x - BOX_LEFT) / BOX_SCALE, (y - BOX_TOP) / BOX_SCALE];
const fromBox = ([x, y]) => [BOX_LEFT + x * BOX_SCALE, BOX_TOP + y * BOX_SCALE];

export default class PizzaScene extends BaseScene {
  constructor() {
    super('Pizza');
  }

  build() {
    this.numbers = pickDistinct(numberPool(), PIZZAS_PER_ROUND);
    this.pizzaIndex = 0;
    this.points = 0;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xffe9c7).setOrigin(0, 0);
    this.counter = this.add.rectangle(0, 0, 10, 10, 0xc98b4f).setOrigin(0, 0);
    this.back = new Button(this, 0, 0, { label: '←', width: 84, height: 84, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.go('Home') });
    this.tag('back', this.back.box);
    this.narrator = new Narrator(this, SAFE.width / 2, 70, { width: 860 });

    // The order ticket.
    this.ticket = this.add.container(190, 400);
    this.ticketCard = this.add.rectangle(0, 0, 230, 300, COLORS.white).setRounded(24).setStrokeStyle(4, 0xe0c9a6);
    this.customer = this.add.text(0, -80, '', textStyle(96)).setOrigin(0.5);
    this.orderNumber = this.add.text(0, 60, '', textStyle(120, COLORS.sauce)).setOrigin(0.5);
    this.ticket.add([this.ticketCard, this.customer, this.orderNumber]);
    this.tag('ticket', this.ticketCard);

    // The pizza: crust, dough, then the sauce painted on top.
    this.add.circle(CENTER.x, CENTER.y + 10, SIZE / 2, 0x000000, 0.15);
    this.add.circle(CENTER.x, CENTER.y, SIZE / 2, COLORS.crust);
    this.dough = this.add.circle(CENTER.x, CENTER.y, (SIZE / 2) * DOUGH, COLORS.dough);
    this.tag('pizza', this.dough);
    this.paint = new PaintLayer(this, LEFT, TOP, SIZE, SIZE, { color: COLORS.sauce, radius: TRACE_BRUSH });
    this.smooth = this.add.circle(CENTER.x, CENTER.y, (SIZE / 2) * DOUGH - 2, COLORS.sauce).setAlpha(0);
    this.guide = this.add.graphics();

    // Sauce meter under the pizza while spreading.
    this.meter = this.add.container(CENTER.x, TOP + SIZE + 30).setVisible(false);
    this.meterBack = this.add.rectangle(0, 0, 360, 26, COLORS.white).setRounded(13);
    this.meterFill = this.add.rectangle(-180, 0, 0, 26, COLORS.sauce).setOrigin(0, 0.5).setRounded(13);
    this.meter.add([this.meterBack, this.meterFill]);

    this.surface = new DragSurface(this, LEFT, TOP, SIZE, SIZE, {
      onStart: (x, y) => this.stroke(x, y, true),
      onMove: (x, y) => this.stroke(x, y, false),
      onEnd: () => this.lift(),
    });
    this.hint = new IdleHint(this, () => this.hintPoint(), {
      onShow: () => this.narrator.say(this.step === 'trace' ? `Start at the green dot and write ${this.number}.` : 'Rub the sauce all over the pizza!'),
    });

    this.startPizza();
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
    this.counter.setPosition(v.x, v.bottom - 70).setSize(v.width, 70);
    this.back.setPosition(v.x + 70, v.y + 70);
  }

  startPizza() {
    this.number = this.numbers[this.pizzaIndex];
    this.strokes = digitCheckpoints(this.number);
    this.free = freeTraceStart(this.strokes);
    this.written = [];
    this.restarts = 0;
    this.friend = pick(CUSTOMERS);
    this.customer.setText(this.friend.emoji);
    this.orderNumber.setText(String(this.number));
    this.paint.clear();
    this.paint.setBrush(COLORS.sauce, TRACE_BRUSH);
    this.smooth.setAlpha(0);
    this.meter.setVisible(false);
    this.surface.setEnabled(true);
    this.drawGuide();
    this.setStep('trace');
    this.narrator.say(`${this.friend.name} wants pizza number ${this.number}! Write ${this.number} with sauce.`, { show: `Write ${this.number} with sauce!` });
  }

  drawGuide() {
    this.guide.clear();
    this.guide.fillStyle(0xb5651d, 0.35);
    this.strokes.flat().forEach((point, i) => {
      if (i % 2) return;
      const [x, y] = fromBox(point);
      this.guide.fillCircle(LEFT + x, TOP + y, 6);
    });
    const [sx, sy] = fromBox(this.strokes[0][0]);
    this.guide.fillStyle(COLORS.green, 1).fillCircle(LEFT + sx, TOP + sy, 16);
    this.guide.lineStyle(4, COLORS.white, 1).strokeCircle(LEFT + sx, TOP + sy, 16);
  }

  setStep(step) {
    this.step = step;
    // `guide`: the number's dots in game coordinates (for browser tests).
    const guide = this.strokes.map((stroke) => stroke.map((point) => fromBox(point)).map(([x, y]) => [LEFT + x, TOP + y]));
    this.report({ step, number: this.number, pizza: this.pizzaIndex, restarts: this.restarts, cover: 0, guide });
    this.hint.resume();
  }

  hintPoint() {
    if (this.step === 'trace') {
      const [x, y] = fromBox(this.strokes[0][0]);
      return { x: LEFT + x, y: TOP + y - 20 };
    }
    if (this.step === 'spread') return { x: CENTER.x, y: CENTER.y - 20 };
    return null;
  }

  stroke(rawX, rawY, isStart) {
    if (this.step !== 'trace' && this.step !== 'spread') return;
    const [x, y] = clampToCircle(rawX, rawY, SIZE, marginFor(this.paint.radius));
    if (isStart) this.paint.begin(x, y);
    else this.paint.to(x, y);

    if (this.step === 'trace') {
      this.free = freeTraceAdd(this.free, toBox(x, y));
      this.written.push([x, y]);
      return;
    }
    this.coverage = coverAt(this.coverage, x, y, SPREAD_BRUSH);
    const ratio = coverageRatio(this.coverage);
    this.meterFill.width = 360 * Math.min(1, ratio / SAUCE_COVERED);
    this.report({ cover: ratio });
    if (ratio >= SAUCE_COVERED) this.sauceDone();
  }

  lift() {
    this.paint.end();
    if (this.step !== 'trace') return;
    const result = freeTraceResult(this.free);
    this.report({ traceCover: result.cover, onNumber: result.onNumber });
    if (result.done) {
      this.traceDone();
    } else if (result.messy) {
      this.restarts += 1;
      this.paint.clear();
      this.free = freeTraceStart(this.strokes);
      this.written = [];
      this.report({ restarts: this.restarts });
      this.narrator.say(`Oops, keep the sauce on the number. Let's write ${this.number} again!`);
    } else if (result.cover > 0.15) {
      this.narrator.say(`Keep going! Cover the whole ${this.number}.`);
    }
  }

  traceDone() {
    this.guide.clear();
    this.narrator.say(`That's ${this.number}! Now spread the sauce all over the pizza.`, { show: 'Spread the sauce all over!' });
    this.paint.setBrush(COLORS.sauce, SPREAD_BRUSH);
    // What's already written counts towards covering the pizza.
    this.coverage = this.written.reduce((cover, [x, y]) => coverAt(cover, x, y, TRACE_BRUSH), makeCoverage(SIZE));
    this.meter.setVisible(true);
    this.meterFill.width = 360 * Math.min(1, coverageRatio(this.coverage) / SAUCE_COVERED);
    this.setStep('spread');
  }

  sauceDone() {
    this.setStep('done');
    this.surface.setEnabled(false);
    this.hint.pause();
    this.meter.setVisible(false);
    // Smooth out the last gaps.
    this.tweens.add({ targets: this.smooth, alpha: 1, duration: 500 });
    if (this.restarts <= 1) this.points += 1;
    this.narrator.say(`Yummy! ${this.friend.name} loves pizza number ${this.number}!`);
    this.tweens.add({ targets: this.customer, scale: 1.25, duration: 200, yoyo: true, repeat: 2 });
    this.time.delayedCall(2600, () => {
      this.pizzaIndex += 1;
      if (this.pizzaIndex < this.numbers.length) this.startPizza();
      else this.finish();
    });
  }

  async finish() {
    await recordRound({ 'math-pizza': { correct: this.points, total: this.numbers.length } });
    this.narrator.say(`You made ${this.numbers.length} pizzas! Great job, chef!`);
    this.report({ step: 'results', points: this.points });
    const again = new Button(this, 1110, 330, { label: '🔁 Again', width: 260, color: COLORS.primary, onTap: () => this.scene.restart() });
    const home = new Button(this, 1110, 470, { label: '🏠 Home', width: 260, color: COLORS.green, onTap: () => this.go('Home') });
    this.tag('again', again.box);
    this.tag('home', home.box);
  }
}
