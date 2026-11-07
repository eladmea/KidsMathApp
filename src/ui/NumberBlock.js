import Phaser from 'phaser';
import { COLORS, popStyle } from './theme';

// A flat block of `length` unit squares in a row, so a child can count how
// big it is (Block Tower, Balance Scale). Each length has its own colour, and
// `number: true` writes the length on it too. Draggable when movable.
//   new NumberBlock(scene, x, y, { length, unit, number })
const COLOURS = [0xff6b6b, 0xff9a3d, 0xffd23f, 0x7ed957, 0x3ccfcf, 0x4a8cff, 0x8e5ce0, 0xff6fa8, 0xa0785a, 0x5f7d95];

// The size of one square, so the longest block of a game fits the tray.
export function blockUnit(longest) {
  return Math.min(64, Math.floor(440 / longest));
}

export const blockColour = (length) => COLOURS[(length - 1) % COLOURS.length];

export default class NumberBlock extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { length, unit = 48, number = false }) {
    super(scene, x, y);
    // Not `length`: a Container's length is its number of children.
    this.units = length;
    const colour = blockColour(length);
    const edge = Phaser.Display.Color.IntegerToColor(colour).darken(25).color;
    for (let i = 0; i < length; i++) {
      const square = scene.add.rectangle((i - (length - 1) / 2) * unit, 0, unit - 4, unit - 4, colour).setRounded(Math.round(unit / 6));
      square.setStrokeStyle(3, edge);
      this.add(square);
    }
    // On a square, not on the seam between two (even lengths).
    const middle = length % 2 === 0 ? -unit / 2 : 0;
    if (number) this.add(scene.add.text(middle, 0, String(length), popStyle(Math.round(unit * 0.62), COLORS.white)).setOrigin(0.5));
    this.setSize(length * unit, unit);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);
  }

  setMovable(movable) {
    if (this.input) this.input.enabled = movable;
    return this;
  }
}
