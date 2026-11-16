import Phaser from 'phaser';
import BaseScene from '../ui/BaseScene';
import Narrator from '../ui/Narrator';
import Button from '../ui/Button';
import DragTray from '../ui/DragTray';
import { DragSurface } from '../ui/PaintLayer';
import { IdleHint } from '../ui/HintArrow';
import { glyph } from '../ui/Art';
import { celebrate, oops, popIn, pulse } from '../ui/Juice';
import { COLORS, textStyle } from '../ui/theme';
import { drawAppliance, drawCounter, drawCupboard, drawFridge, drawSink } from '../ui/KitchenArt';
import { session } from '../services/session';
import { play } from '../services/audio';
import { content } from '../content/index';
import { profileBand } from '../logic/profiles';
import { CUSTOMERS } from '../logic/writingGames';
import {
  GROWN_UP,
  POINTS_PER_RECIPE,
  TIMED,
  addScoop,
  bestTool,
  gatherCheck,
  gatherDone,
  isMeasured,
  keptIn,
  kitchenLevel,
  leftovers,
  measureStatus,
  measured,
  pantryStock,
  pickCleanup,
  prepKind,
  shoppingList,
  stackCheck,
  startMeasure,
  target,
  timerStep,
  toolsFor,
  undoScoop,
  usedTools,
} from '../logic/kitchen';
import { RECIPES, getRecipe } from '../logic/recipes/index';
import { getSkill } from '../curriculum/skills';
import { isRtl, t } from '../i18n/index';

// Kitchen Cove: cook one healthy recipe from a recipe card.
//   wash hands -> gather (fridge and cupboard -> counter) -> measure (cups,
//   spoons, the jug in ml, the scale in grams) -> prepare (crack, stir, cut,
//   shape...) -> cook (the blender, or a grown-up and a timer) -> one
//   clean-up job (while it cooks) -> serve and decorate.
// The child's age band sets the level (logic/kitchen.js LEVELS): younger
// children are handed the right tool and their measuring stops by itself;
// older ones choose tools, tap ✓, and measure with fewer of them.
// Points (out of 4): gathering and measuring without a mistake, the clean-up
// job, and serving right.
//   data: { skillId }

const STATIONS = ['wash', 'gather', 'measure', 'prep', 'cook', 'clean', 'serve'];
const CARD = { x: 20, y: 192, width: 290, height: 510 };
const STAGE_X = 800;
const COUNTER_TOP = 540;
const FRIDGE_AT = { x: 455, y: 400 };
const CUPBOARD_AT = { x: 800, y: 310 };
const SINK_AT = { x: 800, y: 360 };
const CORNER = { x: 1150, y: 300 };
const RUB_GOAL = 1600;
const HOLD_MS = 1800;
const COOK_MS = 14000;
const SERVE_MS = 2600;
const ITEM = 56;

export default class KitchenScene extends BaseScene {
  static key = 'Kitchen';
  static plays = ['Kitchen'];

  build({ skillId = 'kitchen-smoothie' } = {}) {
    this.skill = getSkill(skillId);
    this.recipe = getRecipe(this.skill.recipe) || RECIPES[0];
    this.level = kitchenLevel(profileBand(session.profile).id);
    this.words = content('kitchen');
    this.points = 0;
    this.station = null;
    this.stageObjects = [];
    this.cardRows = {};
    this.counter = {};
    this.counterSlots = {};
    this.mistakes = { gather: 0, measure: 0, serve: 0 };
    this.measures = [];
    this.measure = null;
    this.prepIndex = 0;
    this.progress = 0;
    this.rubbed = 0;
    this.timerMinutes = 0;
    this.cooking = null;
    this.cookTimer = null;
    this.leftovers = [];
    this.dishes = [];
    this.crumbs = [];
    this.cornerDial = null;
    this.holdEvent = null;
    this.measureObjects = [];
    this.prepObjects = [];
    this.focus = null;
    this.cookFocus = null;
    this.cleanFocus = null;
    this.serveFocus = null;
    this.cleanupJob = pickCleanup(KitchenScene.lastCleanup);
    KitchenScene.lastCleanup = this.cleanupJob;
    this.cleanLeft = 0;
    this.cleaned = false;
    this.ding = false;
    this.selected = null;
    this.placed = [];
    this.surface = null;
    this.tray = null;
    this.holding = null;
    this.friendEmoji = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)].emoji;

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfdf0e2).setOrigin(0, 0);
    this.tiles = this.add.graphics();
    this.addBackButton();
    this.narrator = new Narrator(this, 690, 70, { width: 820, fontSize: 26 });
    this.addGameHeader(this.skill);
    this.showPoints();
    this.buildStepper();
    this.buildCard();
    this.hint = new IdleHint(this, () => this.hintPoint(), { delay: 7000 });
    this.say([this.words.say.kitchen.intro({ dish: this.words.DISHES[this.recipe.id] })]);
    this.time.delayedCall(400, () => this.startWash());
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
    // Wall tiles behind everything.
    this.tiles.clear().fillStyle(0xf6e3cf, 1);
    for (let y = Math.floor(v.y / 60) * 60; y < v.bottom; y += 60) for (let x = Math.floor(v.x / 60) * 60 + ((y / 60) % 2) * 30; x < v.right; x += 60) this.tiles.fillRect(x + 2, y + 2, 26, 26);
  }

  // ---- the frame: stations along the top, the recipe card on the left ----
  buildStepper() {
    // Read in order, so right to left in Hebrew.
    this.steps = STATIONS.map((id, i) => {
      const x = isRtl() ? 420 + (STATIONS.length - 1 - i) * 98 : 420 + i * 98;
      const box = this.add.rectangle(x, 150, 92, 36, COLORS.white).setRounded(18).setStrokeStyle(3, 0xe5d3b3);
      const label = this.add.text(x, 150, t(`kitchen.stations.${id}`), textStyle(16, COLORS.gray)).setOrigin(0.5);
      return { id, box, label };
    });
  }

  updateStepper() {
    const at = STATIONS.indexOf(this.station);
    this.steps.forEach(({ box, label }, i) => {
      box.setFillStyle(i < at ? 0xdff3e0 : COLORS.white).setStrokeStyle(i === at ? 4 : 3, i === at ? COLORS.orange : 0xe5d3b3);
      label.setColor(i === at ? '#2d3142' : i < at ? '#2e7d32' : '#9e9e9e');
    });
  }

  buildCard() {
    const { x, y, width, height } = CARD;
    this.add.rectangle(x, y, width, height, 0xfffdf6).setOrigin(0, 0).setRounded(18).setStrokeStyle(4, 0xe5d3b3);
    glyph(this, x + 34, y + 32, this.recipe.emoji, 38);
    this.add.text(x + 62, y + 32, t('kitchen.recipe'), textStyle(26, COLORS.ink)).setOrigin(0, 0.5);
    const rows = this.recipe.ingredients;
    const rowHeight = Math.min(58, (height - 110) / rows.length);
    rows.forEach((ingredient, i) => {
      const rowY = y + 82 + i * rowHeight;
      const back = this.add.rectangle(x + 8, rowY, width - 16, rowHeight - 4, 0xfff4dd, 0).setOrigin(0, 0.5).setRounded(10);
      const picture = glyph(this, x + 34, rowY, ingredient.emoji, Math.min(34, rowHeight - 14));
      const text = this.add.text(x + 60, rowY, this.words.cardLine(ingredient, this.ingredientWords(ingredient)), textStyle(18, COLORS.ink, { align: 'left', wordWrap: { width: width - 100 } })).setOrigin(0, 0.5);
      const tick = this.add.text(x + width - 24, rowY, '✓', textStyle(24, COLORS.greenDark)).setOrigin(0.5).setVisible(false);
      this.cardRows[ingredient.key] = { back, picture, text, tick, gathered: false, measured: false };
    });
    const cook = this.recipe.cook;
    const cookLine = [cook.celsius ? t('kitchen.celsius', { degrees: cook.celsius }) : null, cook.minutes ? t('kitchen.minutes', { minutes: cook.minutes }) : null].filter(Boolean).join('  ·  ');
    if (cookLine) this.add.text(x + width / 2, y + height - 46, cookLine, textStyle(18, COLORS.gray)).setOrigin(0.5);
    this.add.text(x + width / 2, y + height - 20, t('kitchen.sourceNote', { site: this.recipe.source.site }), textStyle(14, COLORS.gray)).setOrigin(0.5);
  }

  // Marks a card row: 'current' (highlighted), 'gathered' or 'measured' (ticked).
  markRow(key, mark) {
    const row = this.cardRows[key];
    if (!row) return;
    if (mark === 'current') {
      Object.values(this.cardRows).forEach((other) => other.back.setFillStyle(0xfff4dd, 0));
      row.back.setFillStyle(0xffe2b0, 1);
      return;
    }
    row[mark] = true;
    row.back.setFillStyle(0xfff4dd, 0);
    row.tick.setVisible(true);
    popIn(this, row.tick);
  }

  clearTicks() {
    Object.values(this.cardRows).forEach((row) => row.tick.setVisible(false));
  }

  ingredientWords(ingredient) {
    return this.words.INGREDIENTS[ingredient.key];
  }

  // ---- talking ----
  // Sentences said together; the bubble shows them too.
  say(lines, { show } = {}) {
    const line = lines.filter(Boolean).join(' ');
    this.narrator.say(line, { show: show || line, force: true });
  }

  // Everything drawn for one station, removed when the next starts.
  keep(...objects) {
    this.stageObjects.push(...objects);
    return objects[0];
  }

  clearStage() {
    this.stageObjects.forEach((object) => object && object.destroy());
    this.stageObjects = [];
    if (this.surface) this.surface.destroy();
    this.surface = null;
    if (this.tray) this.tray.destroy();
    this.tray = null;
  }

  setStation(station) {
    this.station = station;
    this.updateStepper();
    this.hint.resume();
    this.report(this.snapshot());
  }

  snapshot() {
    return {
      recipe: this.recipe.id,
      level: this.level.id,
      station: this.station,
      points: this.points,
      counter: { ...this.counter },
      shopping: shoppingList(this.recipe),
      measuring: this.measure ? { key: this.measure.ingredient.key, status: measureStatus(this.measure), amount: measured(this.measure), target: target(this.measure.ingredient), tools: this.toolChoices(this.measure.ingredient), valid: toolsFor(this.measure.ingredient, this.level), best: bestTool(this.measure.ingredient, this.level) } : null,
      prep: this.recipe.prep[this.prepIndex] ? { index: this.prepIndex, action: this.recipe.prep[this.prepIndex].action, kind: prepKind(this.recipe.prep[this.prepIndex]), progress: this.progress } : null,
      cook: { appliance: this.recipe.cook.appliance, minutes: this.recipe.cook.minutes || 0, set: this.timerMinutes, cooking: Boolean(this.cooking), ding: this.ding },
      cleanup: { job: this.cleanupJob, left: this.cleanLeft, done: this.cleaned, items: this.cleanItems() },
      serve: { kind: this.recipe.serve.kind, placed: this.placed.length, count: this.recipe.serve.kind === 'stack' ? this.recipe.serve.layers.length : this.recipe.serve.count },
      mistakes: { ...this.mistakes },
    };
  }

  // What is left to clean: things to put away (and where they go), dishes,
  // or crumbs on the counter (where they are).
  cleanItems() {
    if (this.station !== 'clean') return [];
    if (this.cleanupJob === 'putAway') return (this.leftovers || []).map(({ ingredient }) => ({ key: ingredient.key, kept: ingredient.kept }));
    if (this.cleanupJob === 'dishes') return (this.dishes || []).filter((entry) => !entry.washed).map((entry) => ({ key: entry.dish }));
    return (this.crumbs || []).map((crumb) => ({ x: crumb.x, y: crumb.y }));
  }

  // Where the idle arrow points: the next thing to tap.
  hintPoint() {
    const at = (object) => (object && object.active ? object.getBounds() : null);
    const centre = (bounds) => bounds && { x: bounds.centerX, y: bounds.centerY };
    switch (this.station) {
      case 'wash':
      case 'prep':
        return centre(at(this.focus));
      case 'gather': {
        const next = shoppingList(this.recipe).find(({ key, count }) => (this.counter[key] || 0) < count);
        if (!next) return null;
        const item = this.pantryItems && this.pantryItems[next.key];
        const place = this.places[keptIn(getIngredient(this.recipe, next.key))];
        return centre(at(place.isOpen ? item.picture : place.doors[0]));
      }
      case 'measure': {
        if (!this.measure) return null;
        const status = measureStatus(this.measure);
        if (status === 'right' && this.doneButton) return centre(at(this.doneButton.box));
        if (status === 'over' && this.undoButton) return centre(at(this.undoButton.box));
        const tool = this.toolButtons && this.toolButtons[bestTool(this.measure.ingredient, this.level)];
        return centre(at(tool && tool.box));
      }
      case 'cook':
        return centre(at(this.cookFocus));
      case 'clean':
        return centre(at(this.cleanFocus));
      case 'serve':
        return centre(at(this.serveFocus));
      default:
        return null;
    }
  }

  // ---- 1. wash hands ----
  startWash() {
    this.clearStage();
    this.setStation('wash');
    const sink = drawSink(this, STAGE_X, 450, '');
    this.keep(sink.box);
    this.focus = this.keep(glyph(this, STAGE_X, 420, '👐', 120));
    this.tag('hands', this.focus);
    this.bubbles = [];
    this.rubbed = 0;
    this.say([this.words.say.kitchen.wash()]);
    this.rubArea(STAGE_X - 170, 290, 340, 250, () => this.washed(), (x, y) => {
      if (Math.random() > 0.25) return;
      const bubble = this.keep(glyph(this, x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-20, 20), '🫧', 34));
      popIn(this, bubble);
    });
  }

  washed() {
    play(this, 'correct');
    this.say([this.words.say.kitchen.washed()]);
    this.time.delayedCall(900, () => this.startGather());
  }

  // A rub over an area: calls `onDone` after RUB_GOAL pixels of rubbing.
  // `own` keeps its meter with the things of the current step.
  rubArea(left, top, width, height, onDone, onRub = () => {}, own = (object) => this.keep(object)) {
    let last = null;
    this.rubbed = 0;
    own(this.add.rectangle(STAGE_X, top - 16, 300, 18, COLORS.white).setRounded(9).setDepth(4).setStrokeStyle(2, 0xe5d3b3));
    this.meter = own(this.add.rectangle(STAGE_X - 150, top - 16, 0, 18, COLORS.green).setOrigin(0, 0.5).setRounded(9).setDepth(5));
    const move = (x, y) => {
      if (last) {
        this.rubbed += Math.hypot(x - last.x, y - last.y);
        onRub(left + x, top + y);
      }
      last = { x, y };
      this.meter.setSize(Math.min(300, (300 * this.rubbed) / RUB_GOAL), 18);
      this.hint.reset();
      if (this.rubbed >= RUB_GOAL && this.surface) {
        this.surface.setEnabled(false);
        onDone();
      }
    };
    this.surface = new DragSurface(this, left, top, width, height, {
      onStart: (x, y) => {
        last = { x, y };
      },
      onMove: move,
      onEnd: () => {
        last = null;
        this.report({ rubbed: Math.round(this.rubbed) });
      },
    });
  }

  // ---- 2. gather from the fridge and the cupboard ----
  startGather() {
    this.clearStage();
    this.setStation('gather');
    this.counter = {};
    this.counterSlots = {};
    this.drawKitchen();
    this.pantryItems = {};
    const stock = pantryStock(this.recipe, RECIPES.filter((other) => other !== this.recipe));
    ['fridge', 'cupboard'].forEach((placeId) => {
      const place = this.places[placeId];
      const perShelf = placeId === 'fridge' ? 3 : 5;
      const room = perShelf * (placeId === 'fridge' ? 3 : 2);
      // The recipe's own things first; other recipes' things while there is room.
      const here = stock.filter((item) => item.kept === placeId);
      const items = [...here.filter((item) => !item.extra), ...here.filter((item) => item.extra)].slice(0, room);
      items.forEach((item, i) => {
        const shelf = Math.floor(i / perShelf);
        const slot = i % perShelf;
        const x = -place.width / 2 + (place.width / perShelf) * (slot + 0.5);
        const y = place.shelfY(shelf) - ITEM / 2 - 4;
        const picture = glyph(this, x, y, item.emoji, ITEM);
        const badge = this.add.text(x + 20, y + 20, '', textStyle(16, COLORS.white, { backgroundColor: '#4a6fe3', padding: { x: 5, y: 1 } })).setOrigin(0.5);
        place.items.add([picture, badge]);
        const entry = { item, picture, badge, stock: item.stock };
        this.pantryItems[item.key] = entry;
        this.showStock(entry);
        picture.setInteractive({ useHandCursor: true }).on('pointerup', () => place.isOpen && this.take(entry, picture));
        this.tag(`item:${item.key}`, picture);
      });
    });
    this.say([this.words.say.kitchen.gather()]);
  }

  // The fridge, the cupboard and the counter (gathering and putting away).
  drawKitchen({ withCupboard = true } = {}) {
    this.keep(drawCounter(this, 600, COUNTER_TOP, 660));
    const fridge = drawFridge(this, FRIDGE_AT.x, FRIDGE_AT.y, t('kitchen.fridge'));
    this.keep(fridge.box);
    this.places = { fridge };
    if (withCupboard) {
      const cupboard = drawCupboard(this, CUPBOARD_AT.x, CUPBOARD_AT.y, t('kitchen.cupboard'));
      this.keep(cupboard.box);
      this.places.cupboard = cupboard;
    }
    Object.entries(this.places).forEach(([id, place]) => {
      place.doors.forEach((door) => door.setInteractive({ useHandCursor: true }).on('pointerup', () => this.tapPlace(id)));
      this.tag(id, place.doors[0]);
    });
  }

  tapPlace(id) {
    const place = this.places[id];
    if (this.station === 'gather' && !place.isOpen) {
      place.open();
      play(this, 'star', { volume: 0.3 });
      return;
    }
    if (this.station === 'clean' && this.cleanupJob === 'putAway') this.putAway(id);
  }

  showStock(entry) {
    entry.badge.setText(entry.stock > 1 ? `×${entry.stock}` : '').setVisible(entry.stock > 1);
    entry.picture.setAlpha(entry.stock > 0 ? 1 : 0.25);
  }

  take(entry, picture) {
    if (entry.stock <= 0) return;
    const check = gatherCheck(this.recipe, this.counter, entry.item.key);
    if (check !== 'take') {
      this.mistakes.gather += 1;
      play(this, 'wrong');
      oops(this, picture.getBounds().centerX, picture.getBounds().centerY, { shake: false });
      this.say([check === 'notInRecipe' ? this.words.say.kitchen.notInRecipe() : this.words.say.kitchen.enough()]);
      this.report(this.snapshot());
      return;
    }
    entry.stock -= 1;
    this.showStock(entry);
    this.counter[entry.item.key] = (this.counter[entry.item.key] || 0) + 1;
    play(this, 'star', { detune: 100 * Object.keys(this.counter).length });
    const slot = this.counterSlot(entry.item);
    const bounds = picture.getBounds();
    const flying = glyph(this, bounds.centerX, bounds.centerY, entry.item.emoji, ITEM).setDepth(30);
    this.tweens.add({
      targets: flying,
      x: slot.x,
      y: slot.y,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => {
        flying.destroy();
        slot.update();
      },
    });
    const wanted = shoppingList(this.recipe).find(({ key }) => key === entry.item.key);
    if (this.counter[entry.item.key] === wanted.count) this.markRow(entry.item.key, 'gathered');
    this.report(this.snapshot());
    if (gatherDone(this.recipe, this.counter)) {
      if (!this.mistakes.gather) this.addPoint();
      this.say([this.words.say.kitchen.gathered()]);
      this.time.delayedCall(1100, () => this.startMeasure());
    }
  }

  // A place on the counter per ingredient (counted things stack up there).
  counterSlot(ingredient) {
    if (this.counterSlots[ingredient.key]) return this.counterSlots[ingredient.key];
    const i = Object.keys(this.counterSlots).length;
    const x = 660 + (i % 7) * 86;
    const y = COUNTER_TOP + 50 + Math.floor(i / 7) * 74;
    const slot = { x, y, picture: null, badge: null, ingredient };
    slot.update = () => {
      if (!slot.picture) {
        slot.picture = this.keep(glyph(this, x, y, ingredient.emoji, ITEM));
        slot.badge = this.keep(this.add.text(x + 22, y + 22, '', textStyle(16, COLORS.white, { backgroundColor: '#2e7d32', padding: { x: 5, y: 1 } })).setOrigin(0.5));
        popIn(this, slot.picture);
      }
      const count = this.counter[ingredient.key] || 0;
      slot.badge.setText(count > 1 ? `×${count}` : '').setVisible(count > 1);
    };
    this.counterSlots[ingredient.key] = slot;
    return slot;
  }

  // ---- 3. measure ----
  startMeasure() {
    this.clearStage();
    this.setStation('measure');
    this.keep(drawCounter(this, 340, COUNTER_TOP, 920));
    this.toMeasure = this.recipe.ingredients.filter(isMeasured);
    this.measures = [];
    // The card's ticks now count what is measured (counted things are done).
    this.clearTicks();
    this.recipe.ingredients.filter((ingredient) => !isMeasured(ingredient)).forEach((ingredient) => this.cardRows[ingredient.key].tick.setVisible(true));
    this.keep(glyph(this, 1000, 430, '🥣', 150));
    this.say([this.words.say.kitchen.measure()]);
    this.time.delayedCall(700, () => this.nextMeasure());
  }

  // The tools offered for an ingredient: younger children get the right one;
  // older children every tool of their level (wrong ones included).
  toolChoices(ingredient) {
    if (!this.level.pickTool) return [bestTool(ingredient, this.level)];
    return this.level.tools;
  }

  nextMeasure() {
    (this.measureObjects || []).forEach((object) => object.destroy());
    this.measureObjects = [];
    const ingredient = this.toMeasure[this.measures.length];
    if (!ingredient) {
      this.measure = null;
      if (!this.mistakes.measure) this.addPoint();
      this.time.delayedCall(700, () => this.startPrep());
      return;
    }
    this.measure = startMeasure(ingredient);
    this.markRow(ingredient.key, 'current');
    const own = (object) => {
      this.measureObjects.push(object);
      return object;
    };
    own(glyph(this, 560, 400, ingredient.emoji, 120));
    own(this.add.text(560, 490, this.words.cardLine(ingredient, this.ingredientWords(ingredient)), textStyle(28, COLORS.ink, { stroke: '#ffffff', strokeThickness: 6 })).setOrigin(0.5));
    // The gauge: how much is in so far, and (younger children) where to stop.
    const goal = target(ingredient);
    const full = goal * 1.5;
    const gauge = { x: 790, y: 270, width: 400 };
    own(this.add.rectangle(gauge.x, gauge.y, gauge.width, 30, COLORS.white).setRounded(15).setStrokeStyle(3, 0xe5d3b3));
    this.gaugeFill = own(this.add.rectangle(gauge.x - gauge.width / 2, gauge.y, 0, 30, 0x7cc4f0).setOrigin(0, 0.5).setRounded(15));
    if (this.level.mark) own(this.add.rectangle(gauge.x - gauge.width / 2 + (gauge.width * goal) / full, gauge.y, 6, 46, COLORS.red));
    this.gaugeText = own(this.add.text(gauge.x, gauge.y + 38, '', textStyle(22, COLORS.ink)).setOrigin(0.5));
    this.gauge = { ...gauge, full };
    // The tools.
    this.toolButtons = {};
    const tools = this.toolChoices(ingredient);
    const width = Math.min(116, 880 / tools.length - 10);
    tools.forEach((toolId, i) => {
      const x = 800 + (i - (tools.length - 1) / 2) * (width + 10);
      const button = new Button(this, x, 640, { label: this.words.TOOLS[toolId].label, width, height: 80, fontSize: 22, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.scoop(toolId) });
      own(button);
      this.toolButtons[toolId] = button;
      this.tag(`tool:${toolId}`, button.box);
    });
    if (this.level.check) {
      this.undoButton = own(new Button(this, 1150, 420, { label: '↩', width: 90, height: 70, fontSize: 34, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.unscoop() }));
      this.doneButton = own(new Button(this, 1150, 510, { label: t('kitchen.done'), width: 170, height: 70, fontSize: 24, color: COLORS.green, onTap: () => this.checkMeasure() }));
      this.tag('measure-undo', this.undoButton.box);
      this.tag('measure-done', this.doneButton.box);
    } else {
      this.undoButton = null;
      this.doneButton = null;
    }
    this.updateGauge();
    const words = this.ingredientWords(ingredient);
    this.say([this.words.name(words), this.words.amount(ingredient, words), this.level.pickTool ? this.words.say.kitchen.pickTool() : null]);
    this.report(this.snapshot());
  }

  updateGauge() {
    const { ingredient } = this.measure;
    const amount = measured(this.measure);
    this.gaugeFill.setSize(Math.min(this.gauge.width, (this.gauge.width * amount) / this.gauge.full), 30);
    this.gaugeText.setText(amount ? t('kitchen.soFar', { amount: this.amountText(ingredient, amount) }) : '');
  }

  // An amount so far, in the recipe's own unit when it comes out even.
  amountText(ingredient, amount) {
    if (ingredient.unit === 'g') return this.words.shortAmount({ qty: amount, unit: 'g' });
    if (ingredient.unit === 'ml') return this.words.shortAmount({ qty: amount, unit: 'ml' });
    const per = { cup: 240, tbsp: 15, tsp: 5 }[ingredient.unit];
    const qty = amount / per;
    return Number.isInteger(qty * 4) ? this.words.shortAmount({ qty, unit: ingredient.unit }) : this.words.shortAmount({ qty: amount, unit: 'ml' });
  }

  scoop(toolId) {
    if (!this.measure || (measureStatus(this.measure) === 'right' && !this.level.check)) return;
    const result = addScoop(this.measure, toolId);
    const button = this.toolButtons[toolId];
    if (result === 'wrongTool') {
      this.mistakes.measure += 1;
      play(this, 'wrong');
      button.shake();
      this.say([this.words.say.kitchen.wrongTool({ tool: this.words.TOOLS[toolId].a })]);
      this.report(this.snapshot());
      return;
    }
    button.pop();
    play(this, 'star', { volume: 0.4, detune: 60 * this.measure.scoops.length });
    // A scoop flies into the bowl.
    const drop = this.add.circle(button.x, button.y - 50, 14, 0xf3e0c0).setDepth(20);
    this.tweens.add({ targets: drop, x: 1000, y: 420, scale: 0.4, duration: 300, onComplete: () => drop.destroy() });
    this.updateGauge();
    if (result === 'tooMuch') this.say([this.words.say.kitchen.tooMuch()]);
    if (result === 'enough' && !this.level.check) this.measuredOne();
    this.report(this.snapshot());
  }

  unscoop() {
    if (!this.measure || !this.measure.scoops.length) return;
    undoScoop(this.measure);
    this.updateGauge();
    this.report(this.snapshot());
  }

  checkMeasure() {
    if (!this.measure) return;
    const status = measureStatus(this.measure);
    if (status === 'right') {
      this.measuredOne();
      return;
    }
    this.mistakes.measure += 1;
    play(this, 'wrong');
    this.say([status === 'over' ? this.words.say.kitchen.tooMuch() : this.words.say.kitchen.notEnough()]);
    this.report(this.snapshot());
  }

  measuredOne() {
    const done = this.measure;
    this.measures.push(done);
    this.measure = null;
    play(this, 'correct');
    this.markRow(done.ingredient.key, 'measured');
    this.say([this.words.say.kitchen.measured()]);
    this.report(this.snapshot());
    this.time.delayedCall(800, () => this.nextMeasure());
  }

  // ---- 4. prepare ----
  startPrep() {
    this.clearStage();
    (this.measureObjects || []).forEach((object) => object.destroy());
    this.measureObjects = [];
    this.setStation('prep');
    this.keep(drawCounter(this, 340, COUNTER_TOP, 920));
    this.prepIndex = 0;
    this.nextPrep();
  }

  nextPrep() {
    (this.prepObjects || []).forEach((object) => object && object.destroy());
    this.prepObjects = [];
    if (this.surface) this.surface.destroy();
    this.surface = null;
    const action = this.recipe.prep[this.prepIndex];
    if (!action) {
      this.startCook();
      return;
    }
    this.progress = 0;
    const own = (object) => {
      this.prepObjects.push(object);
      return object;
    };
    const ingredient = getIngredient(this.recipe, action.on);
    const emoji = ingredient ? ingredient.emoji : { bowl: '🥣', tin: '🧁', burger: '🥣', sausage: '🥣' }[action.on] || '🥣';
    this.focus = own(glyph(this, STAGE_X, 400, emoji, 170));
    this.tag('prep-target', this.focus);
    if (ingredient) this.markRow(ingredient.key, 'current');
    const lines = [this.words.say.kitchen.prep[action.action](action)];
    if (GROWN_UP.has(action.action)) {
      own(glyph(this, STAGE_X - 230, 400, '🧑‍🍳', 90));
      own(this.add.text(STAGE_X - 230, 470, t('kitchen.grownUp'), textStyle(18, COLORS.gray)).setOrigin(0.5));
      lines.unshift(this.words.say.kitchen.grownUp());
    }
    if (prepKind(action) === 'tap') {
      // A row of what each tap makes (cracked eggs, filled cups, halves...).
      this.results = [];
      const made = { crack: '🍳', fill: '🧁', shape: action.on === 'burger' ? '🍔' : '🌭' }[action.action] || emoji;
      const perRow = Math.min(action.times, 6);
      for (let i = 0; i < action.times; i++) {
        const x = STAGE_X + ((i % perRow) - (perRow - 1) / 2) * 70;
        const y = 600 + Math.floor(i / perRow) * 64;
        this.results.push(own(glyph(this, x, y, made, 50).setAlpha(0.18)));
      }
      this.focus.setInteractive({ useHandCursor: true }).on('pointerup', () => this.prepTap(action));
    } else {
      this.rubArea(STAGE_X - 200, 280, 400, 250, () => this.prepDone(), () => this.focus.setAngle(Math.sin(this.rubbed / 60) * 12), own);
    }
    this.say(lines);
    this.report(this.snapshot());
  }

  prepTap(action) {
    if (this.progress >= action.times) return;
    const result = this.results[this.progress];
    this.progress += 1;
    play(this, 'star', { volume: 0.4, detune: 80 * this.progress });
    result.setAlpha(1);
    popIn(this, result);
    this.tweens.add({ targets: this.focus, scale: this.focus.scale * 0.9, yoyo: true, duration: 90 });
    this.hint.reset();
    this.report(this.snapshot());
    if (this.progress >= action.times) this.prepDone();
  }

  prepDone() {
    play(this, 'correct');
    this.prepIndex += 1;
    this.report(this.snapshot());
    this.time.delayedCall(700, () => this.nextPrep());
  }

  // ---- 5. cook ----
  startCook() {
    this.clearStage();
    (this.prepObjects || []).forEach((object) => object && object.destroy());
    this.prepObjects = [];
    Object.values(this.cardRows).forEach((row) => row.back.setFillStyle(0xfff4dd, 0));
    this.setStation('cook');
    const { appliance, minutes } = this.recipe.cook;
    this.applianceArt = drawAppliance(this, STAGE_X, 400, appliance);
    this.keep(this.applianceArt.box);
    this.dish = glyph(this, 0, appliance === 'blender' ? -40 : 10, appliance === 'blender' ? '🍓' : this.recipe.emoji, 80).setAlpha(0.9);
    this.applianceArt.box.add(this.dish);
    if (!TIMED.has(appliance)) {
      this.say([this.words.say.kitchen.cook({ appliance })]);
      this.holdButton(() => this.blended());
      return;
    }
    this.keep(glyph(this, STAGE_X - 260, 330, '🧑‍🍳', 90));
    this.keep(this.add.text(STAGE_X - 260, 400, t('kitchen.grownUp'), textStyle(18, COLORS.gray)).setOrigin(0.5));
    this.timerMinutes = 0;
    const dialX = STAGE_X + 300;
    this.keep(this.add.circle(dialX, 380, 80, COLORS.white).setStrokeStyle(8, COLORS.orange));
    this.dialText = this.keep(this.add.text(dialX, 380, '', textStyle(34, COLORS.ink)).setOrigin(0.5));
    const step = timerStep(minutes);
    const minus = this.keep(new Button(this, dialX - 70, 500, { label: `−${step}`, width: 100, height: 70, fontSize: 26, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.turnDial(-step) }));
    const plus = this.keep(new Button(this, dialX + 70, 500, { label: `+${step}`, width: 100, height: 70, fontSize: 26, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.turnDial(step) }));
    const start = this.keep(new Button(this, dialX, 590, { label: t('kitchen.start'), width: 200, height: 70, fontSize: 26, color: COLORS.green, onTap: () => this.startTimer() }));
    this.tag('timer-minus', minus.box);
    this.tag('timer-plus', plus.box);
    this.tag('timer-start', start.box);
    this.cookFocus = plus.box;
    this.startTimerButton = start;
    this.turnDial(0);
    this.say([this.words.say.kitchen.cook({ appliance }), this.words.say.kitchen.setTimer({ minutes })]);
  }

  turnDial(change) {
    this.timerMinutes = Phaser.Math.Clamp(this.timerMinutes + change, 0, 60);
    this.dialText.setText(t('kitchen.minutes', { minutes: this.timerMinutes }));
    if (change) play(this, 'star', { volume: 0.3, detune: this.timerMinutes * 20 });
    this.cookFocus = this.timerMinutes === this.recipe.cook.minutes ? this.startTimerButton && this.startTimerButton.box : this.cookFocus;
    this.report(this.snapshot());
  }

  startTimer() {
    const { minutes } = this.recipe.cook;
    if (this.timerMinutes !== minutes) {
      play(this, 'wrong');
      this.say([this.words.say.kitchen.timerWrong({ minutes })]);
      return;
    }
    play(this, 'correct');
    this.dish.setAlpha(1);
    this.cooking = { left: minutes, total: minutes };
    this.cookTimer = this.time.addEvent({
      delay: COOK_MS / minutes,
      repeat: minutes - 1,
      callback: () => {
        this.cooking.left -= 1;
        if (this.cornerDial) this.cornerDial.setText(t('kitchen.minutes', { minutes: this.cooking.left }));
        if (this.cooking.left <= 0) this.timerDone();
      },
    });
    this.time.delayedCall(500, () => this.startCleanup());
  }

  timerDone() {
    this.ding = true;
    play(this, 'ding');
    this.report(this.snapshot());
    if (this.cleaned) this.ready();
  }

  // The blender: hold the button until it is smooth.
  holdButton(onDone) {
    const button = this.keep(new Button(this, STAGE_X + 280, 520, { label: t('kitchen.hold'), width: 180, height: 90, fontSize: 30, color: COLORS.orange, onTap: () => {} }));
    this.tag('blender-hold', button.box);
    this.cookFocus = button.box;
    const back = this.keep(this.add.rectangle(STAGE_X + 280, 600, 200, 18, COLORS.white).setRounded(9));
    const fill = this.keep(this.add.rectangle(STAGE_X + 180, 600, 0, 18, COLORS.green).setOrigin(0, 0.5).setRounded(9));
    this.holding = { held: 0, down: false };
    button.box.on('pointerdown', () => {
      this.holding.down = true;
      this.say([this.words.say.kitchen.blending()]);
    });
    const release = () => this.holding && (this.holding.down = false);
    button.box.on('pointerup', release);
    button.box.on('pointerout', release);
    this.holdEvent = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!this.holding || !this.holding.down) return;
        this.holding.held += 50;
        fill.setSize(Math.min(200, (200 * this.holding.held) / HOLD_MS), 18);
        this.applianceArt.box.setAngle(Math.sin(this.holding.held / 40) * 2);
        this.dish.setAngle(this.holding.held / 3);
        if (this.holding.held >= HOLD_MS) {
          this.holdEvent.remove();
          this.applianceArt.box.setAngle(0);
          back.setVisible(false);
          onDone();
        }
      },
    });
    this.events.once('shutdown', () => this.holdEvent && this.holdEvent.remove());
  }

  blended() {
    play(this, 'correct');
    this.holding = null;
    this.ding = true;
    this.time.delayedCall(700, () => this.startCleanup());
  }

  // ---- 6. one clean-up job ----
  startCleanup() {
    // What cooks stays in the corner, with its timer counting down.
    const left = this.cooking ? this.cooking.left : 0;
    this.clearStage();
    this.setStation('clean');
    if (this.cooking) {
      const small = drawAppliance(this, CORNER.x, CORNER.y, this.recipe.cook.appliance);
      small.box.setScale(0.45);
      this.keep(small.box);
      this.cornerDial = this.keep(this.add.text(CORNER.x, CORNER.y + 80, t('kitchen.minutes', { minutes: left }), textStyle(24, COLORS.ink, { backgroundColor: '#ffffff', padding: { x: 8, y: 2 } })).setOrigin(0.5));
    }
    const job = this.cleanupJob;
    if (job === 'putAway') {
      this.drawKitchen();
      this.leftovers = leftovers(this.recipe).map((ingredient, i) => {
        const picture = this.keep(glyph(this, 680 + i * 90, COUNTER_TOP + 60, ingredient.emoji, ITEM));
        picture.setInteractive({ useHandCursor: true }).on('pointerup', () => this.select(ingredient, picture));
        this.tag(`leftover:${ingredient.key}`, picture);
        return { ingredient, picture };
      });
      this.cleanLeft = this.leftovers.length;
      this.cleanFocus = this.leftovers[0] && this.leftovers[0].picture;
    } else if (job === 'dishes') {
      this.keep(drawCounter(this, 340, COUNTER_TOP, 920));
      const sink = drawSink(this, SINK_AT.x, SINK_AT.y, t('kitchen.sink'));
      this.keep(sink.box);
      const dishes = ['bowl', ...usedTools(this.measures)];
      this.cleanLeft = dishes.length;
      // Each dish: what moves to the sink, and what is tapped.
      this.dishes = dishes.map((dish, i) => {
        const x = 420 + i * 110;
        const y = COUNTER_TOP + 60;
        const entry = { dish, washed: false };
        if (dish === 'bowl') {
          entry.moves = this.keep(glyph(this, x, y, '🥣', ITEM));
          entry.hit = entry.moves.setInteractive({ useHandCursor: true });
        } else {
          entry.moves = this.keep(new Button(this, x, y, { label: this.words.TOOLS[dish].label, width: 96, height: 60, fontSize: 18, color: COLORS.white, textColor: COLORS.ink }));
          entry.hit = entry.moves.box;
        }
        entry.hit.on('pointerup', () => this.toSink(entry, sink));
        this.tag(`dish:${dish}`, entry.hit);
        return entry;
      });
      this.cleanFocus = this.dishes[0].hit;
    } else {
      this.keep(drawCounter(this, 340, COUNTER_TOP, 920));
      this.crumbs = [];
      for (let i = 0; i < 14; i++) {
        const crumb = this.keep(this.add.circle(420 + ((i * 137) % 760), COUNTER_TOP + 40 + ((i * 53) % 120), 9 + (i % 3) * 4, i % 2 ? 0xc98d5a : 0xf2b5b5));
        this.crumbs.push(crumb);
      }
      this.cleanLeft = this.crumbs.length;
      this.cleanFocus = this.crumbs[0];
      this.keep(glyph(this, 380, COUNTER_TOP - 40, '🧽', 60));
      this.counterZone = this.keep(this.add.zone(340, COUNTER_TOP, 920, 720 - COUNTER_TOP).setOrigin(0, 0));
      this.tag('counter', this.counterZone);
      this.surface = new DragSurface(this, 340, COUNTER_TOP, 920, 720 - COUNTER_TOP, {
        onStart: (x, y) => this.wipe(340 + x, COUNTER_TOP + y),
        onMove: (x, y) => this.wipe(340 + x, COUNTER_TOP + y),
        onEnd: () => {},
      });
    }
    this.say([this.words.say.kitchen.cleanup({ job })]);
    this.report(this.snapshot());
  }

  select(ingredient, picture) {
    if (this.selected) this.selected.picture.setScale(this.selected.scale);
    this.selected = { ingredient, picture, scale: picture.scale };
    picture.setScale(picture.scale * 1.25);
    this.cleanFocus = this.places[keptIn(ingredient)].doors[0];
    play(this, 'star', { volume: 0.3 });
    this.report({ selected: ingredient.key });
  }

  putAway(placeId) {
    if (!this.selected) return;
    const { ingredient, picture } = this.selected;
    if (keptIn(ingredient) !== placeId) {
      play(this, 'wrong');
      this.say([this.words.say.kitchen.wrongPlace()]);
      return;
    }
    this.selected = null;
    play(this, 'correct');
    const place = this.places[placeId];
    picture.disableInteractive();
    this.tweens.add({ targets: picture, x: place.box.x, y: place.box.y, scale: 0.1, duration: 350, onComplete: () => picture.setVisible(false) });
    this.leftovers = this.leftovers.filter((left) => left.ingredient !== ingredient);
    this.cleanFocus = this.leftovers[0] && this.leftovers[0].picture;
    this.cleanStep();
  }

  toSink(entry, sink) {
    if (entry.washed) return;
    entry.washed = true;
    play(this, 'star', { volume: 0.4 });
    this.tweens.add({ targets: entry.moves, x: sink.box.x + Phaser.Math.Between(-60, 60), y: sink.box.y + 20, scale: 0.6, duration: 350 });
    const next = this.dishes.find((other) => !other.washed);
    this.cleanFocus = next ? next.hit : null;
    this.cleanStep();
  }

  wipe(x, y) {
    this.crumbs = this.crumbs.filter((crumb) => {
      if (Math.hypot(crumb.x - x, crumb.y - y) > 60) return true;
      this.tweens.add({ targets: crumb, alpha: 0, scale: 0, duration: 200 });
      this.cleanStep();
      return false;
    });
    this.cleanFocus = this.crumbs[0] || null;
    this.hint.reset();
  }

  cleanStep() {
    this.cleanLeft -= 1;
    this.report(this.snapshot());
    if (this.cleanLeft > 0 || this.cleaned) return;
    this.cleaned = true;
    if (this.surface) this.surface.setEnabled(false);
    this.addPoint();
    this.say([this.words.say.kitchen.cleaned()]);
    this.report(this.snapshot());
    // The timer hurries up once the clean-up is done.
    if (this.ding) this.time.delayedCall(900, () => this.ready());
    else if (this.cookTimer) this.cookTimer.timeScale = 6;
  }

  ready() {
    if (this.station === 'serve') return;
    if (this.recipe.cook.appliance !== 'blender') this.say([this.words.say.kitchen.ding()]);
    this.time.delayedCall(900, () => this.startServe());
  }

  // ---- 7. serve ----
  startServe() {
    this.clearStage();
    this.setStation('serve');
    this.keep(drawCounter(this, 340, COUNTER_TOP, 920));
    this.placed = [];
    const { serve } = this.recipe;
    if (serve.kind === 'stack') this.startStack(serve);
    else this.startDecorate(serve);
  }

  startDecorate(serve) {
    const plates = serve.plates;
    const perPlate = serve.count / plates;
    const spacing = Math.min(150, 760 / plates);
    this.plates = Array.from({ length: plates }, (_, i) => {
      const x = STAGE_X + (i - (plates - 1) / 2) * spacing;
      const size = plates === 1 ? 240 : Math.min(120, spacing - 10);
      const y = COUNTER_TOP - size * 0.42;
      const picture = this.keep(glyph(this, x, y, serve.dish, size));
      return { x, y, size, picture, items: 0 };
    });
    this.plates.forEach((plate, i) => this.tag(`plate:${i}`, plate.picture));
    this.serveFocus = this.plates[0].picture;
    const area = () => new Phaser.Geom.Rectangle(STAGE_X - 440, 240, 880, COUNTER_TOP - 220);
    this.tray = new DragTray(this, STAGE_X - 60, 640, {
      draw: (scene, x, y, size) => glyph(scene, x, y, serve.item, size),
      label: '',
      target: area,
      onDrop: (x, y) => this.decorate(serve, area().x + x, area().y + y, perPlate),
    });
    this.tag('tray', this.tray.box);
    const item = this.words.DECORATIONS[serve.item];
    this.say([this.words.say.kitchen.decorate({ count: serve.count, item })]);
    this.report(this.snapshot());
  }

  decorate(serve, x, y, perPlate) {
    // The nearest plate with room.
    const open = this.plates.filter((plate) => plate.items < perPlate);
    if (!open.length) return;
    const plate = open.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best));
    plate.items += 1;
    this.placed.push(plate);
    play(this, 'star', { detune: 60 * this.placed.length });
    if (serve.replace) {
      plate.picture.destroy();
      plate.picture = this.keep(glyph(this, plate.x, plate.y, serve.item, plate.size));
      popIn(this, plate.picture);
    } else {
      const spread = perPlate > 1 ? plate.size * 0.32 : 0;
      const angle = (plate.items / perPlate) * Math.PI * 2;
      const top = plate.size > 200 ? 0 : -plate.size * 0.3;
      const piece = this.keep(glyph(this, plate.x + Math.cos(angle) * spread, plate.y + top + Math.sin(angle) * spread * 0.6, serve.item, perPlate > 1 ? 34 : Math.min(56, plate.size * 0.5)));
      popIn(this, piece);
    }
    this.serveFocus = (open.find((p) => p.items < perPlate) || {}).picture || null;
    this.report(this.snapshot());
    if (this.placed.length === serve.count) this.served();
  }

  startStack(serve) {
    this.stackY = COUNTER_TOP - 24;
    const options = [...new Set(serve.layers)];
    this.layerButtons = {};
    options.forEach((layer, i) => {
      const x = STAGE_X + 160 + (i % 2) * 120;
      const y = 330 + Math.floor(i / 2) * 120;
      const button = this.keep(glyph(this, x, y, layer, 90));
      button.setInteractive({ useHandCursor: true }).on('pointerup', () => this.stack(serve, layer, button));
      this.tag(`layer:${layer}`, button);
      this.layerButtons[layer] = button;
      if (layer === serve.layers[0]) this.serveFocus = button;
    });
    this.say([this.words.say.kitchen.stack()]);
    this.report(this.snapshot());
  }

  stack(serve, layer, button) {
    if (this.placed.length >= serve.layers.length) return;
    if (!stackCheck(serve.layers, this.placed, layer)) {
      this.mistakes.serve += 1;
      play(this, 'wrong');
      oops(this, button.x, button.y, { shake: false });
      this.say([this.words.say.kitchen.wrongLayer()]);
      this.report(this.snapshot());
      return;
    }
    this.placed.push(layer);
    play(this, 'star', { detune: 80 * this.placed.length });
    // Each layer squashed flat, dropping onto the one below.
    const piece = this.keep(glyph(this, STAGE_X - 160, this.stackY - 120, layer, 120));
    piece.setScale(piece.scaleX, piece.scaleY * 0.42).setDepth(this.placed.length);
    this.tweens.add({ targets: piece, y: this.stackY, duration: 260, ease: 'Bounce.easeOut' });
    this.stackY -= 30;
    const next = serve.layers[this.placed.length];
    this.serveFocus = this.layerButtons[next] || null;
    this.report(this.snapshot());
    if (this.placed.length === serve.layers.length) this.served();
  }

  served() {
    if (!this.mistakes.serve) this.addPoint();
    this.hint.pause();
    if (this.tray) this.tray.setVisible(false);
    const friend = this.keep(glyph(this, 1185, 250, this.friendEmoji, 100));
    popIn(this, friend);
    celebrate(this, STAGE_X, 400, { count: 30 });
    play(this, 'correct');
    this.say([this.words.say.kitchen.served()]);
    this.station = 'done';
    this.report({ ...this.snapshot(), station: 'done', done: true });
    this.time.delayedCall(SERVE_MS, () => this.finishRound(this.skill.id, this.points, POINTS_PER_RECIPE));
  }

  addPoint() {
    this.points += 1;
    this.showPoints();
    pulse(this, this.headerCounter, { to: 1.18 });
  }

  // One recipe a round, so the header shows just the stars.
  showPoints() {
    this.headerCounter.setText(`⭐ ${this.points}`);
  }
}

function getIngredient(recipe, key) {
  return recipe.ingredients.find((ingredient) => ingredient.key === key);
}
