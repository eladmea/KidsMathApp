import Phaser from 'phaser';
import { glyph } from './Art';
import { textStyle } from './theme';

// An endless supply of something to drag (toppings, candles): a tray showing
// a few, and a copy that follows the finger. Dropping it on the target calls
// onDrop(x, y) with the point local to the target's top-left.
//   new DragTray(scene, x, y, { draw, label, target, onDrop, onGrab })
// `draw(scene, x, y, size)` makes one item (so olives can be drawn rings);
// `target()` returns the drop area as a Phaser.Geom.Rectangle.
const ITEM = 52;

export default class DragTray extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { draw, label, target, onDrop = () => {}, onGrab = () => {} }) {
    super(scene, x, y);
    this.draw = draw;
    this.target = target;
    const items = [0, 1, 2].map((i) => draw(scene, -110 + i * 58, 0, ITEM * 0.8));
    const text = scene.add.text(40, 0, label, textStyle(22, 0x8a6a44)).setOrigin(0, 0.5);
    const width = Math.max(320, 70 + 3 * 58 + text.width + 20);
    this.box = scene.add.rectangle(width / 2 - 160, 0, width, 84, 0xf6ebdd).setRounded(28).setStrokeStyle(4, 0xd9b88f);
    this.add([this.box, ...items, text]);
    this.box.setInteractive({ useHandCursor: true });
    scene.add.existing(this);

    this.ghost = null;
    const move = (pointer) => this.ghost && this.ghost.setPosition(pointer.worldX, pointer.worldY - 10);
    const up = (pointer) => {
      if (!this.ghost) return;
      this.ghost.destroy();
      this.ghost = null;
      const area = this.target();
      if (area.contains(pointer.worldX, pointer.worldY)) onDrop(pointer.worldX - area.x, pointer.worldY - area.y);
    };
    this.box.on('pointerdown', (pointer) => {
      if (this.ghost) return;
      onGrab();
      this.ghost = this.draw(scene, pointer.worldX, pointer.worldY - 10, ITEM).setDepth(40);
    });
    scene.input.on('pointermove', move);
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
    this.unlisten = () => {
      scene.input.off('pointermove', move);
      scene.input.off('pointerup', up);
      scene.input.off('pointerupoutside', up);
    };
    scene.events.once('shutdown', this.unlisten);
  }

  destroy(fromScene) {
    if (this.unlisten && this.scene) {
      this.unlisten();
      this.scene.events.off('shutdown', this.unlisten);
    }
    if (this.ghost) this.ghost.destroy();
    super.destroy(fromScene);
  }
}

// An emoji item for the tray.
export const emojiItem = (emoji) => (scene, x, y, size) => glyph(scene, x, y, emoji, size);

