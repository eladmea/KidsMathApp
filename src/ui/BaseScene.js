import Phaser from 'phaser';
import { reportScene, reportState, tag } from '../services/testBridge';
import { stop as stopSpeech } from '../services/speech';

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
    reportScene(this.scene.key);
    this.view = new Phaser.Geom.Rectangle(0, 0, SAFE.width, SAFE.height);
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.fitCamera, this);
      stopSpeech();
    });
    this.fitCamera();
    this.build(data || {});
    this.built = true;
    this.layout();
  }

  fitCamera() {
    const { width, height } = this.scale;
    const camera = this.cameras.main;
    camera.setSize(width, height);
    camera.centerOn(SAFE.width / 2, SAFE.height / 2);
    this.view.setTo((SAFE.width - width) / 2, (SAFE.height - height) / 2, width, height);
    if (this.built) this.layout();
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

  go(key, data) {
    this.scene.start(key, data);
  }
}
