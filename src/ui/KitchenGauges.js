import { glyph } from './Art';
import { COLORS, textStyle } from './theme';

// The measuring jug (ml) and the kitchen scale (g), with real numbers on
// them (logic/kitchen.js gaugeAxis), so a child reads the amount off the
// marks. `mark` draws a red line where to stop (younger children).
//   const jug = new Jug(scene, x, y, { axis, goal, mark, unit }); jug.set(amount)
// Both put what they draw through `own` (the scene's list of things to remove).

const JUG = { width: 130, height: 250 };

export class Jug {
  constructor(scene, x, y, { axis, goal, mark, unit, own }) {
    this.scene = scene;
    this.axis = axis;
    this.bottom = y + JUG.height / 2;
    const left = x - JUG.width / 2;
    own(scene.add.rectangle(x + JUG.width / 2 + 16, y - 20, 34, 110, COLORS.white, 0).setStrokeStyle(10, 0xb8d8e8).setRounded(16));
    own(scene.add.rectangle(x, y, JUG.width, JUG.height, 0xf2fbff).setStrokeStyle(5, 0x9fc6d8).setRounded(14));
    this.fill = own(scene.add.rectangle(left + 4, this.bottom - 3, JUG.width - 8, 0, 0xfdf3dc).setOrigin(0, 1).setRounded(10));
    for (let value = axis.minor; value <= axis.max; value += axis.minor) {
      const at = this.levelY(value);
      const big = value % axis.label === 0;
      own(scene.add.rectangle(left, at, big ? 26 : 14, 3, 0x4f6d7d).setOrigin(0, 0.5));
      if (big) own(scene.add.text(left + 32, at, String(value), textStyle(17, 0x2d3142)).setOrigin(0, 0.5));
    }
    own(scene.add.text(x + 26, y - JUG.height / 2 + 18, unit, textStyle(18, 0x4f6d7d)).setOrigin(0.5));
    if (mark) own(scene.add.rectangle(left - 8, this.levelY(goal), JUG.width + 16, 4, COLORS.red).setOrigin(0, 0.5));
  }

  levelY(value) {
    return this.bottom - 8 - ((JUG.height - 24) * Math.min(value, this.axis.max)) / this.axis.max;
  }

  // Shapes are resized with setSize (Phaser 4), so the tween moves a number.
  set(amount) {
    const level = { height: this.fill.height };
    const to = Math.max(0, this.bottom - 3 - this.levelY(amount));
    this.scene.tweens.add({ targets: level, height: to, duration: 260, onUpdate: () => this.fill.active && this.fill.setSize(this.fill.width, level.height) });
  }
}

// A dial from the lower left round to the lower right.
const START = Math.PI * 0.75;
const SWEEP = Math.PI * 1.5;
const RADIUS = 100;

export class Scale {
  constructor(scene, x, y, { axis, goal, mark, unit, emoji, own }) {
    this.scene = scene;
    this.axis = axis;
    this.x = x;
    this.y = y;
    this.own = own;
    this.emoji = emoji;
    this.pieces = [];
    own(scene.add.rectangle(x, y + RADIUS + 40, 230, 22, 0x8a9aa6).setRounded(10));
    own(scene.add.rectangle(x, y + 30, 250, 2 * RADIUS + 80, 0xdfe6eb).setRounded(28).setStrokeStyle(4, 0xa9b6bf));
    own(scene.add.circle(x, y, RADIUS + 10, COLORS.white).setStrokeStyle(5, 0x7b8790));
    const g = own(scene.add.graphics());
    for (let value = 0; value <= axis.max; value += axis.minor) {
      const big = value % axis.label === 0;
      const angle = this.angleOf(value);
      const inner = RADIUS - (big ? 18 : 10);
      g.lineStyle(big ? 3 : 2, 0x4f5d6b, 1).lineBetween(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner, x + Math.cos(angle) * RADIUS, y + Math.sin(angle) * RADIUS);
      if (big) own(scene.add.text(x + Math.cos(angle) * (RADIUS - 36), y + Math.sin(angle) * (RADIUS - 36), String(value), textStyle(15, 0x2d3142)).setOrigin(0.5));
    }
    if (mark) {
      const angle = this.angleOf(goal);
      g.lineStyle(5, COLORS.red, 1).lineBetween(x + Math.cos(angle) * (RADIUS - 22), y + Math.sin(angle) * (RADIUS - 22), x + Math.cos(angle) * (RADIUS + 8), y + Math.sin(angle) * (RADIUS + 8));
    }
    own(scene.add.text(x, y + 52, unit, textStyle(18, 0x4f6d7d)).setOrigin(0.5));
    // The needle points along +x, turned to the reading.
    this.needle = own(scene.add.rectangle(x, y, RADIUS - 14, 5, COLORS.red).setOrigin(0, 0.5).setRotation(this.angleOf(0)));
    own(scene.add.circle(x, y, 9, 0x4f5d6b));
  }

  angleOf(value) {
    return START + (SWEEP * Math.min(value, this.axis.max * 1.04)) / this.axis.max;
  }

  set(amount, pieces) {
    this.scene.tweens.add({ targets: this.needle, rotation: this.angleOf(amount), duration: 380, ease: 'Back.easeOut' });
    // What is on the scale sits on top of it.
    while (this.pieces.length < pieces) {
      const i = this.pieces.length;
      const piece = this.own(glyph(this.scene, this.x - 90 + (i % 8) * 26, this.y - RADIUS - 26 - Math.floor(i / 8) * 18, this.emoji, 34));
      this.pieces.push(piece);
    }
    while (this.pieces.length > pieces) this.pieces.pop().destroy();
  }
}
