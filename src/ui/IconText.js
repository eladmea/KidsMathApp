import Phaser from 'phaser';
import { isRtl } from '../i18n/index';
import { iconRuns } from '../logic/iconRuns';
import { art, hasArt } from './Art';

// One line of text whose emoji are drawn as pictures when a picture has been
// added under src/assets/images (see Art.js), so icons inside labels and
// counters can be swapped without a code change. Used like a Text:
//   new IconText(scene, x, y, '2 / 5   ⭐ 3', textStyle(28)).setOrigin(1, 0.5)
//   counter.setText('3 / 5   ⭐ 4')
// A line with no pictures is a single Text, drawn exactly as before (so
// setWordWrapWidth() wraps it like a Text; with pictures each text part
// wraps on its own). setColor() and setAlign() style the text parts.
// A Container's origin is always its position, so setOrigin() moves the
// parts instead: (0, 0.5) puts the line's left edge at x.
export default class IconText extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text, style) {
    super(scene, x, y);
    this.lineStyle = { ...style };
    this.alignX = 0.5;
    this.alignY = 0.5;
    this.text = null;
    this.parts = [];
    this.setText(text);
    scene.add.existing(this);
  }

  setText(text) {
    const value = String(text);
    if (value === this.text) return this;
    this.text = value;
    this.removeAll(true);
    const size = parseFloat(this.lineStyle.fontSize);
    this.parts = iconRuns(value, (emoji) => hasArt(this.scene, emoji), isRtl()).map((run) =>
      run.icon ? art(this.scene, 0, 0, { emoji: run.icon, size: size * 0.95 }) : this.scene.add.text(0, 0, run.text, this.lineStyle)
    );
    this.add(this.parts);
    return this.place();
  }

  setColor(color) {
    return this.restyle({ color });
  }

  setAlign(align) {
    return this.restyle({ align });
  }

  setWordWrapWidth(width) {
    return this.restyle({ wordWrap: { width, useAdvancedWrap: false } });
  }

  // Changes the text parts' style, keeping the pictures.
  restyle(change) {
    Object.assign(this.lineStyle, change);
    this.parts.forEach((part) => {
      if (part.type !== 'Text') return;
      if (change.color !== undefined) part.setColor(change.color);
      if (change.align !== undefined) part.setAlign(change.align);
      if (change.wordWrap !== undefined) part.setWordWrapWidth(change.wordWrap.width);
    });
    return this.place();
  }

  setOrigin(x = 0.5, y = x) {
    this.alignX = x;
    this.alignY = y;
    return this.place();
  }

  place() {
    const width = this.parts.reduce((sum, part) => sum + part.displayWidth, 0);
    const height = this.parts.reduce((most, part) => Math.max(most, part.displayHeight), 0);
    let x = -width * this.alignX;
    const y = height * (0.5 - this.alignY);
    this.parts.forEach((part) => {
      part.setOrigin(0, 0.5).setPosition(x, y);
      x += part.displayWidth;
    });
    return this.setSize(width, height);
  }
}
