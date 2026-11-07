import Phaser from 'phaser';
import { COLORS, popStyle } from './theme';

// A flat block of `length` unit squares, so a child can count how big it is
// (Block Tower, Balance Scale). Each length has its own colour, and
// `number: true` writes the length on it too. Draggable when movable.
//   new NumberBlock(scene, x, y, { length, unit, number, rowLength, label, colour, minHeight })
// `rowLength: 10` stacks the squares in rows of ten, like tens and ones
// (14 = a row of 10 over a row of 4). `label` replaces the number (a "?"),
// and `minHeight` makes a small block easier to tap (at least that tall
// and that wide).
const COLOURS = [0xff6b6b, 0xff9a3d, 0xffd23f, 0x7ed957, 0x3ccfcf, 0x4a8cff, 0x8e5ce0, 0xff6fa8, 0xa0785a, 0x5f7d95];

// The size of one square, so the longest block of a game fits the tray.
export function blockUnit(longest) {
  return Math.min(64, Math.floor(440 / longest));
}

export const blockColour = (length) => COLOURS[(length - 1) % COLOURS.length];

export default class NumberBlock extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { length, unit = 48, number = false, rowLength = Infinity, label = null, colour = null, minHeight = 0 }) {
    super(scene, x, y);
    // Not `length`: a Container's length is its number of children.
    this.units = length;
    const fill = colour ?? blockColour(length);
    const edge = Phaser.Display.Color.IntegerToColor(fill).darken(25).color;
    const perRow = Math.min(length, rowLength);
    const rows = Math.ceil(length / perRow);
    this.blockWidth = perRow * unit;
    this.blockHeight = rows * unit;
    for (let i = 0; i < length; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const square = scene.add.rectangle((col - (perRow - 1) / 2) * unit, (row - (rows - 1) / 2) * unit, unit - 4, unit - 4, fill).setRounded(Math.round(unit / 6));
      square.setStrokeStyle(3, edge);
      this.add(square);
    }
    const text = label ?? (number ? String(length) : null);
    if (text !== null) {
      // On a square, not on the seam between two (even lengths, one row).
      const middle = rows === 1 && perRow % 2 === 0 ? -unit / 2 : 0;
      const size = rows > 1 ? Math.round(unit * 1.1) : Math.round(Math.max(unit, 30) * 0.62);
      this.add(scene.add.text(middle, 0, text, popStyle(size, COLORS.white)).setOrigin(0.5));
    }
    this.setSize(Math.max(this.blockWidth, minHeight), Math.max(this.blockHeight, minHeight));
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);
  }

  // The area a tap counts in: at least `min` square (a small block in a
  // tray), or 0 for just the block (blocks stacked tight on each other).
  setTouchSize(min) {
    const width = Math.max(this.blockWidth, min);
    const height = Math.max(this.blockHeight, min);
    this.setSize(width, height);
    if (this.input) this.input.hitArea.setTo(0, 0, width, height);
    return this;
  }

  setMovable(movable) {
    if (this.input) this.input.enabled = movable;
    return this;
  }
}
