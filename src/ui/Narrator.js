import Phaser from 'phaser';
import { speak } from '../services/speech';
import { COLORS, textStyle } from './theme';
import { tag } from '../services/testBridge';

// A speech bubble at the top of the screen. say() shows the line and reads it
// aloud (when narration is on); the 🔊 button always repeats the last line.
export default class Narrator extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { width = 900 } = {}) {
    super(scene, x, y);
    this.line = '';
    this.bubble = scene.add.rectangle(0, 0, width, 84, COLORS.white, 0.95).setRounded(30);
    this.text = scene.add.text(-width / 2 + 100, 0, '', textStyle(32, COLORS.ink, { align: 'left', wordWrap: { width: width - 130 } })).setOrigin(0, 0.5);
    this.again = scene.add.text(-width / 2 + 48, 0, '🔊', textStyle(40)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.again.on('pointerup', () => speak(this.line, { force: true }));
    tag('say-again', this.again);
    this.add([this.bubble, this.again, this.text]);
    scene.add.existing(this);
  }

  say(line, { show = line, force = false } = {}) {
    this.line = line;
    this.text.setText(show);
    speak(line, { force });
    this.scene.tweens.add({ targets: this, scale: { from: 0.96, to: 1 }, duration: 160 });
  }
}
