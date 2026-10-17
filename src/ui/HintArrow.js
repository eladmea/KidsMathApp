import Phaser from 'phaser';
import { textStyle } from './theme';

// A bouncing 👇 that points at what to do next. Show it with pointAt(x, y);
// IdleHint below shows it after a few seconds without a touch.
export default class HintArrow extends Phaser.GameObjects.Text {
  constructor(scene) {
    super(scene, 0, 0, '👇', textStyle(64));
    this.setOrigin(0.5, 1).setVisible(false).setDepth(50);
    scene.add.existing(this);
  }

  pointAt(x, y) {
    this.setPosition(x, y).setVisible(true);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, y: y - 24, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  hide() {
    // Already gone with its scene.
    if (!this.scene) return;
    this.scene.tweens.killTweensOf(this);
    this.setVisible(false);
  }
}

// Shows the arrow at `where()` after `delay` ms with no touch on the screen;
// any touch hides it and starts the wait again. pause() / resume() between
// steps.
export class IdleHint {
  constructor(scene, where, { delay = 5000, onShow = () => {} } = {}) {
    this.scene = scene;
    this.where = where;
    this.delay = delay;
    this.onShow = onShow;
    this.active = true;
    this.arrow = new HintArrow(scene);
    const touched = () => this.active && this.reset();
    scene.input.on('pointerdown', touched);
    scene.events.once('shutdown', () => {
      this.active = false;
      if (this.timer) this.timer.remove();
      scene.input.off('pointerdown', touched);
    });
    this.reset();
  }

  reset() {
    this.arrow.hide();
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.delay, () => {
      const point = this.where();
      if (!point) return;
      this.arrow.pointAt(point.x, point.y);
      this.onShow();
    });
  }

  pause() {
    this.active = false;
    if (this.timer) this.timer.remove();
    this.arrow.hide();
  }

  resume() {
    this.active = true;
    this.reset();
  }
}
