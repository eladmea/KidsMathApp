import Phaser from 'phaser';
import { SAFE } from './BaseScene';
import { COLORS, textStyle } from './theme';

// A modal card over a dimmed screen. The dim layer swallows taps, so nothing
// behind it can be pressed. Add content with dialog.add(...) using
// coordinates relative to the card's centre; close() removes it.
export default class Dialog extends Phaser.GameObjects.Container {
  constructor(scene, { width = 640, height = 420, title = '', onClose = () => {} } = {}) {
    super(scene, SAFE.width / 2, SAFE.height / 2);
    this.onClose = onClose;
    // Big enough to cover any screen shape around the safe area.
    this.dim = scene.add.rectangle(0, 0, SAFE.width * 3, SAFE.height * 3, 0x000000, 0.45).setInteractive();
    this.card = scene.add.rectangle(0, 0, width, height, COLORS.white).setRounded(32);
    this.title = scene.add.text(0, -height / 2 + 50, title, textStyle(36)).setOrigin(0.5);
    super.add([this.dim, this.card, this.title]);
    this.setDepth(100);
    scene.add.existing(this);
    // The dim fades in while the card springs up from smaller.
    this.dim.setAlpha(0);
    scene.tweens.add({ targets: this.dim, alpha: 1, duration: 180, ease: 'Sine.easeOut' });
    this.setScale(0.75);
    scene.tweens.add({ targets: this, scale: 1, duration: 300, ease: 'Back.easeOut', easeParams: [2.2] });
  }

  close() {
    this.destroy();
    this.onClose();
  }
}
