import Phaser from 'phaser';
import { blockColour } from './NumberBlock';
import { COLORS, popStyle } from './theme';

// A weight for the Balance Scale: a plain rounded block with its number
// inside, coloured by its number like the counting blocks. Draggable when
// movable.
//   new WeightBlock(scene, x, y, { weight })
export const WEIGHT_SIZE = { width: 112, height: 64 };

export default class WeightBlock extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { weight }) {
    super(scene, x, y);
    this.weight = weight;
    const fill = blockColour(((weight - 1) % 10) + 1);
    const edge = Phaser.Display.Color.IntegerToColor(fill).darken(25).color;
    const { width, height } = WEIGHT_SIZE;
    this.add(scene.add.rectangle(0, 0, width, height, fill).setRounded(16).setStrokeStyle(4, edge));
    this.add(scene.add.text(0, 0, String(weight), popStyle(36, COLORS.white)).setOrigin(0.5));
    this.setSize(width, height);
    this.setInteractive({ draggable: true, useHandCursor: true });
    scene.add.existing(this);
  }

  setMovable(movable) {
    if (this.input) this.input.enabled = movable;
    return this;
  }
}
