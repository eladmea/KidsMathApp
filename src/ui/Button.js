import Phaser from 'phaser';
import { COLORS, textStyle } from './theme';

// A big, squishy button: a rounded box with a label. It shrinks while pressed
// and fires `onTap` when the finger lifts on it (a quick tap always counts).
//   new Button(scene, x, y, { label, width, height, color, textColor, fontSize, onTap })
export default class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { label, width = 260, height = 96, color = COLORS.primary, textColor = COLORS.white, fontSize = 40, radius, onTap = () => {} }) {
    super(scene, x, y);
    this.onTap = onTap;
    this.enabled = true;
    this.shadow = scene.add.rectangle(0, 8, width, height, 0x000000, 0.18).setRounded(radius ?? Math.min(28, height / 2));
    this.box = scene.add.rectangle(0, 0, width, height, color).setRounded(radius ?? Math.min(28, height / 2));
    this.box.setStrokeStyle(4, COLORS.white);
    this.label = scene.add.text(0, 0, label, textStyle(fontSize, textColor)).setOrigin(0.5);
    this.add([this.shadow, this.box, this.label]);
    this.setSize(width, height);
    this.box.setInteractive({ useHandCursor: true });

    let pressed = false;
    this.box.on('pointerdown', () => {
      if (!this.enabled) return;
      pressed = true;
      this.setScale(0.94);
    });
    this.box.on('pointerout', () => {
      pressed = false;
      this.setScale(1);
    });
    this.box.on('pointerup', () => {
      this.setScale(1);
      if (!pressed || !this.enabled) return;
      pressed = false;
      this.onTap(this);
    });
    scene.add.existing(this);
  }

  setColor(color) {
    this.box.setFillStyle(color);
    return this;
  }

  setLabel(label) {
    this.label.setText(label);
    return this;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.5);
    return this;
  }

  // A happy wiggle (right answer) or a shake (try again).
  pop() {
    this.scene.tweens.add({ targets: this, scale: 1.12, duration: 120, yoyo: true });
  }

  shake() {
    this.scene.tweens.add({ targets: this, x: this.x + 12, duration: 50, yoyo: true, repeat: 3 });
  }
}
