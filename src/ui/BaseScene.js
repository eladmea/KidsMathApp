import Phaser from 'phaser';
import { reportScene, reportState, tag } from '../services/testBridge';
import { stop as stopSpeech } from '../services/speech';
import * as router from '../services/router';
import Button from './Button';
import { COLORS } from './theme';

// Every scene is laid out in a fixed 1280 x 720 "safe area" that is always
// fully visible. The canvas grows (Scale.EXPAND) to fill wider phones or
// squarer tablets, and the camera keeps the safe area centred, so the extra
// space shows more background instead of black bars. `this.view` is the whole
// visible area in the same coordinates, for things pinned to the screen edges
// and for backgrounds.
export const SAFE = { width: 1280, height: 720 };

export default class BaseScene extends Phaser.Scene {
  create(data) {
    this.built = false;
    this.startData = data || {};
    this.backButton = null;
    reportScene(this.scene.key);
    this.view = new Phaser.Geom.Rectangle(0, 0, SAFE.width, SAFE.height);
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fitCamera, this);
      stopSpeech();
    });
    this.fitCamera();
    this.build(this.startData);
    this.built = true;
    this.fitCamera();
  }

  // Fits the camera to the screen and re-pins the edge-anchored objects.
  fitCamera() {
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    camera.setSize(width, height);
    camera.centerOn(SAFE.width / 2, SAFE.height / 2);
    this.view.setTo((SAFE.width - width) / 2, (SAFE.height - height) / 2, width, height);
    if (!this.built) return;
    if (this.backButton) this.backButton.setPosition(this.view.x + 70, this.view.y + 70);
    this.layout();
  }

  // Scenes create their objects here (called once)...
  build() {}

  // ...and pin edge-anchored objects to `this.view` here (on every resize).
  layout() {}

  // Name an object for browser tests.
  tag(name, object) {
    return tag(name, object);
  }

  report(patch) {
    reportState(patch);
  }

  // The round ← button in the top-left corner. Goes back by default.
  addBackButton(onTap = () => this.back()) {
    this.backButton = new Button(this, 0, 0, { label: '←', width: 84, height: 84, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap });
    this.backButton.setDepth(40);
    this.tag('back', this.backButton.box);
    return this.backButton;
  }

  // Opens another scene; back() returns here with the same data.
  go(key, data = {}) {
    router.push({ key: this.scene.key, data: this.startData });
    this.scene.start(key, data);
  }

  // Back to the scene this one was opened from (Home if there is none).
  back() {
    const previous = router.pop();
    if (previous) this.scene.start(previous.key, previous.data);
    else this.scene.start('Home');
  }

  // Starts a scene with a fresh history (e.g. after picking a player).
  reset(key, data = {}) {
    router.clear();
    this.scene.start(key, data);
  }

  // Plays this scene again from the start, keeping its place in the history.
  replay(data = this.startData) {
    this.scene.restart(data);
  }
}
