import Phaser from 'phaser';
import Button from './Button';
import { COLORS, textStyle } from './theme';
import { tag } from '../services/testBridge';
import { numberLineFeedback } from '../logic/numberLine';
import { isRtl, t } from '../i18n/index';
import { art, hasArt } from './Art';

// The ways to answer a quiz question. Each one is laid out inside `area`
// ({ x, y, width, height }, centred on x, y), calls onSubmit(answer) once, and
// then shows the result with showResult(answer, isCorrect).
//   makeInput(scene, area, question, { onSubmit, onSound, onWord })
// onSound(text) reads something aloud on request (a tile's sound, a caption);
// onWord(text) reads a word as it is (a picture answer's 🔊).
export function makeInput(scene, area, question, handlers) {
  const Input = { numberLine: NumberLineInput, build: WordBuilderInput, order: StoryStripInput }[question.type] || ChoiceInput;
  return new Input(scene, area, question, handlers);
}

// Rows of choices, letter slots and story panels run the way the language
// reads: right to left in Hebrew, so the first one read aloud is on the right.
const side = () => (isRtl() ? -1 : 1);

const glyphs = (value) => Array.from(String(value)).filter((c) => !/[\u{FE0F}\u{200D}]/u.test(c)).length;

// ---- Tap one of 2-4 answers ----
// A picture answer's ▶ (says its word): its size, and how far below the
// button it sits.
const SPEAKER_RADIUS = 40;
const SPEAKER_BELOW = 56;

class ChoiceInput {
  constructor(scene, area, question, { onSubmit, onWord }) {
    this.scene = scene;
    this.question = question;
    this.locked = false;
    const n = question.choices.length;
    const wide = area.width > 900;
    // Pictures stand in one row, in the order they are read out, so "first",
    // "second" and "third" are plain to see.
    const oneRow = question.choiceStyle === 'picture' && n <= 4;
    const cols = wide || oneRow || n <= 2 ? n : 2;
    const rows = Math.ceil(n / cols);
    const gap = 22;
    // Two answers across the screen get wide buttons (rows of pictures to compare).
    const widest = wide ? (n <= 2 ? 460 : 250) : 270;
    const width = Math.min(widest, (area.width - gap * (cols - 1)) / cols);
    // Room under each picture for its 🔊, outside the answer button.
    const speakers = Boolean(onWord && question.choiceWords);
    const below = speakers ? SPEAKER_BELOW + SPEAKER_RADIUS : 0;
    const height = Math.min(question.choiceStyle === 'word' ? 120 : 150, (area.height - below - gap * (rows - 1)) / rows);
    this.buttons = question.choices.map((choice, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, n - row * cols);
      const x = area.x + side() * (col - (inRow - 1) / 2) * (width + gap);
      const y = area.y - below / 2 + (row - (rows - 1) / 2) * (height + gap);
      const button = new Button(scene, x, y, {
        label: String(choice),
        width,
        height,
        fontSize: this.fontSize(choice, width),
        color: COLORS.white,
        textColor: COLORS.ink,
        onTap: () => {
          if (this.locked) return;
          this.locked = true;
          onSubmit(choice);
        },
      });
      if (question.choiceStyle === 'word') button.label.setWordWrapWidth(width - 24).setAlign('center');
      // A picture answer with its own image shows the image instead of the emoji.
      if (question.choiceStyle === 'picture' && hasArt(scene, choice)) {
        button.label.setText('');
        button.add(art(scene, 0, 0, { emoji: choice, size: Math.min(width, height) * 0.6 }));
      }
      // A big ▶ under the picture says its word, so a child can listen to
      // each answer before choosing one. It sits outside the button, so a
      // tap on it never answers.
      if (speakers && question.choiceWords[i]) {
        const y = height / 2 + SPEAKER_BELOW;
        const r = SPEAKER_RADIUS;
        const play = scene.add.circle(0, y, r, COLORS.primary).setStrokeStyle(4, COLORS.white);
        // A triangle pointing right (its corners from its top-left, centred by
        // its origin), nudged right so it looks centred in the circle.
        const arrow = scene.add.triangle(r * 0.08, y, 0, 0, 0, r * 0.84, r * 0.76, r * 0.42, COLORS.white);
        play.setInteractive({ useHandCursor: true }).on('pointerup', () => onWord(question.choiceWords[i]));
        button.add([play, arrow]);
        tag(`say:${i}`, play);
      }
      button.choice = choice;
      tag(`choice:${choice}`, button.box);
      return button;
    });
  }

  fontSize(choice, width) {
    const style = this.question.choiceStyle;
    const length = glyphs(choice);
    if (style === 'word') return length > 14 ? 26 : 34;
    if (style === 'letter') return 64;
    if (typeof choice === 'number') return String(choice).length > 3 ? 50 : 64;
    // Emoji: one big picture, or a row of them (patterns, "which has more").
    return Math.max(22, Math.min(84, (width - 30) / (length * 1.15)));
  }

  showResult(choice, isCorrect) {
    this.buttons.forEach((button) => {
      if (button.choice === this.question.answer) {
        button.setColor(COLORS.green).pop();
        button.label.setColor('#ffffff');
      } else if (button.choice === choice) {
        button.setColor(COLORS.orange).shake();
        button.label.setColor('#ffffff');
      } else {
        button.setAlpha(0.45);
      }
    });
  }

  // Worked example: the answer shown, nothing to tap.
  showSolution() {
    this.locked = true;
    this.showResult(this.question.answer, true);
  }

  destroy() {
    this.buttons.forEach((button) => button.destroy());
  }
}

// ---- Tap where a number lives on a line ----
const TICKS = 10;
class NumberLineInput {
  constructor(scene, area, question, { onSubmit }) {
    this.scene = scene;
    this.question = question;
    this.locked = false;
    const { min, max } = question;
    this.left = area.x - area.width / 2 + 40;
    this.right = area.x + area.width / 2 - 40;
    this.y = area.y;
    this.toX = (value) => this.left + ((value - min) / (max - min)) * (this.right - this.left);
    const g = scene.add.graphics();
    g.lineStyle(10, COLORS.ink, 1).lineBetween(this.left, this.y, this.right, this.y);
    for (let i = 0; i <= TICKS; i++) {
      const x = this.left + (i / TICKS) * (this.right - this.left);
      const tall = i % 5 === 0 ? 28 : 16;
      g.lineStyle(6, COLORS.ink, 1).lineBetween(x, this.y - tall, x, this.y + tall);
    }
    this.objects = [
      g,
      scene.add.text(this.left, this.y + 56, String(min), textStyle(36)).setOrigin(0.5),
      scene.add.text(this.right, this.y + 56, String(max), textStyle(36)).setOrigin(0.5),
    ];
    this.zone = scene.add.zone(area.x, this.y, this.right - this.left + 60, 180).setInteractive({ useHandCursor: true });
    this.zone.on('pointerup', (pointer) => {
      if (this.locked) return;
      this.locked = true;
      const ratio = Phaser.Math.Clamp((pointer.worldX - this.left) / (this.right - this.left), 0, 1);
      onSubmit(Math.round(min + ratio * (max - min)));
    });
    this.objects.push(this.zone);
    tag('numberline', this.zone);
    this.geometry = { left: this.left, right: this.right, y: this.y, min, max };
  }

  showResult(guess, isCorrect) {
    const { scene, question } = this;
    const color = isCorrect ? COLORS.greenDark : COLORS.red;
    const chute = scene.add.text(this.toX(guess), this.y - 90, '🪂', textStyle(52)).setOrigin(0.5);
    scene.tweens.add({ targets: chute, y: this.y - 50, duration: 400, ease: 'Bounce.easeOut' });
    const flag = scene.add.rectangle(this.toX(question.answer), this.y + 110, 96, 56, COLORS.white).setRounded(14).setStrokeStyle(5, color);
    const answer = scene.add.text(flag.x, flag.y, String(question.answer), textStyle(34, color)).setOrigin(0.5);
    const note = scene.add.text((this.left + this.right) / 2, this.y + 180, numberLineFeedback(guess, question.answer, isCorrect), textStyle(28, color)).setOrigin(0.5);
    this.objects.push(chute, flag, answer, note);
  }

  showSolution() {
    this.locked = true;
    this.showResult(this.question.answer, true);
  }

  destroy() {
    this.objects.forEach((object) => object.destroy());
  }
}

// ---- Spell a word with letter tiles ----
// Each tile tap plays its sound; tapping a filled slot sends that tile and
// the ones after it back. Checks itself when every slot is full.
class WordBuilderInput {
  constructor(scene, area, question, { onSubmit, onSound }) {
    this.scene = scene;
    this.question = question;
    this.placed = [];
    this.locked = false;
    this.onSubmit = onSubmit;
    this.onSound = onSound;
    const slots = question.parts.length;
    const slotSize = Math.min(110, (area.width - 20) / slots - 16);
    this.slots = question.parts.map((_, i) => {
      const x = area.x + side() * (i - (slots - 1) / 2) * (slotSize + 16);
      const box = scene.add.rectangle(x, area.y - 110, slotSize, slotSize, COLORS.white).setRounded(18).setStrokeStyle(5, COLORS.primary);
      const label = scene.add.text(x, box.y, '', textStyle(slotSize * 0.5)).setOrigin(0.5);
      box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.removeFrom(i));
      tag(`slot:${i}`, box);
      return { box, label };
    });
    const tiles = question.tiles.length;
    const perRow = Math.min(tiles, 5);
    const tileSize = Math.min(100, (area.width - 20) / perRow - 16);
    this.tiles = question.tiles.map((tile, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, tiles - row * perRow);
      const x = area.x + side() * ((i % perRow) - (inRow - 1) / 2) * (tileSize + 16);
      const y = area.y + 40 + row * (tileSize + 16);
      const button = new Button(scene, x, y, { label: tile.text, width: tileSize, height: tileSize, fontSize: tileSize * 0.48, color: 0xfff1c7, textColor: COLORS.ink, onTap: () => this.place(tile, button) });
      tag(`tile:${tile.id}`, button.box);
      return button;
    });
    this.undo = new Button(scene, area.x, area.y + area.height / 2 - 30, { label: t('quiz.undo'), width: 200, height: 64, fontSize: 28, color: COLORS.gray, onTap: () => this.removeFrom(this.placed.length - 1) });
    this.undo.setVisible(false);
    this.extra = [];
  }

  place(tile, button) {
    if (this.locked || this.placed.length >= this.slots.length || this.placed.some((t) => t.tile.id === tile.id)) return;
    this.onSound(tile.text);
    this.placed.push({ tile, button });
    button.setEnabled(false);
    this.refresh();
    if (this.placed.length === this.slots.length) {
      this.locked = true;
      this.onSubmit(this.placed.map((p) => p.tile.text));
    }
  }

  removeFrom(index) {
    if (this.locked || index < 0 || index >= this.placed.length) return;
    this.placed.splice(index).forEach((p) => p.button.setEnabled(true));
    this.refresh();
  }

  refresh() {
    this.slots.forEach((slot, i) => slot.label.setText(this.placed[i] ? this.placed[i].tile.text : ''));
    this.undo.setVisible(!this.locked && this.placed.length > 0);
  }

  showResult(_, isCorrect) {
    const color = isCorrect ? COLORS.green : COLORS.red;
    this.slots.forEach((slot) => slot.box.setStrokeStyle(6, color));
    this.undo.setVisible(false);
    const first = this.slots[0].box;
    const centre = (first.x + this.slots[this.slots.length - 1].box.x) / 2;
    const line = isCorrect ? t('quiz.built', { word: this.question.word }) : t('quiz.spelled', { parts: this.question.parts.join(' · ') });
    this.extra.push(this.scene.add.text(centre, first.y - 90, line, textStyle(34, isCorrect ? COLORS.greenDark : COLORS.red)).setOrigin(0.5));
  }

  showSolution() {
    this.locked = true;
    this.slots.forEach((slot, i) => slot.label.setText(this.question.parts[i]));
    this.tiles.forEach((tile) => tile.setEnabled(false));
    this.showResult(null, true);
  }

  destroy() {
    [...this.slots.flatMap((s) => [s.box, s.label]), ...this.tiles, this.undo, ...this.extra].forEach((o) => o.destroy());
  }
}

// ---- Put story panels in order ----
// Tap the panels in the order they happen; tapping a numbered panel takes
// back that step and the ones after it.
class StoryStripInput {
  constructor(scene, area, question, { onSubmit, onSound }) {
    this.scene = scene;
    this.question = question;
    this.order = [];
    this.locked = false;
    const n = question.items.length;
    const gap = 20;
    const width = Math.min(270, (area.width - gap * (n - 1)) / n);
    const height = Math.min(300, area.height);
    this.cards = question.items.map((item, i) => {
      const x = area.x + side() * (i - (n - 1) / 2) * (width + gap);
      const button = new Button(scene, x, area.y, { label: '', width, height, color: COLORS.white, onTap: () => this.press(item) });
      button.add(scene.add.text(0, -height / 2 + 70, item.emoji, textStyle(80)).setOrigin(0.5));
      button.add(scene.add.text(0, 40, item.caption, textStyle(22, COLORS.ink, { wordWrap: { width: width - 30 } })).setOrigin(0.5, 0));
      button.badge = scene.add.circle(width / 2 - 26, -height / 2 + 26, 24, COLORS.primary).setVisible(false);
      button.number = scene.add.text(button.badge.x, button.badge.y, '', textStyle(28, COLORS.white)).setOrigin(0.5);
      button.fix = scene.add.text(0, height / 2 + 26, '', textStyle(22, COLORS.red)).setOrigin(0.5);
      button.add([button.badge, button.number, button.fix]);
      button.item = item;
      tag(`story:${item.id}`, button.box);
      return button;
    });
    this.onSubmit = onSubmit;
    this.onSound = onSound;
  }

  press(item) {
    if (this.locked) return;
    const position = this.order.indexOf(item.id);
    if (position >= 0) {
      this.order = this.order.slice(0, position);
    } else {
      this.onSound(item.caption);
      this.order.push(item.id);
    }
    this.refresh();
    if (this.order.length === this.cards.length) {
      this.locked = true;
      this.onSubmit([...this.order]);
    }
  }

  refresh(result = null) {
    this.cards.forEach((card) => {
      const position = this.order.indexOf(card.item.id);
      card.badge.setVisible(position >= 0);
      card.number.setText(position >= 0 ? String(position + 1) : '');
      if (!result) {
        card.box.setStrokeStyle(4, position >= 0 ? COLORS.primary : COLORS.white);
        return;
      }
      const right = position === this.question.answer.indexOf(card.item.id);
      const color = right ? COLORS.green : COLORS.red;
      card.badge.setFillStyle(color);
      card.box.setStrokeStyle(6, color);
      if (!right) card.fix.setText(t('quiz.shouldBe', { position: this.question.answer.indexOf(card.item.id) + 1 }));
    });
  }

  showResult() {
    this.refresh('shown');
  }

  showSolution() {
    this.locked = true;
    this.order = [...this.question.answer];
    this.refresh('shown');
  }

  destroy() {
    this.cards.forEach((card) => card.destroy());
  }
}
