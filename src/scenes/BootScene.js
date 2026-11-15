import Phaser from 'phaser';
import { loadAssets } from '../services/assets';
import { session } from '../services/session';
import { voiceReady } from '../ui/BaseScene';

// Loads every image and sound (services/assets.js), then opens "Who's
// playing?" (or the welcome screen when there are no players yet) once its
// recordings are in.
export default class BootScene extends Phaser.Scene {
  static key = 'Boot';

  constructor() {
    super(BootScene.key);
  }

  preload() {
    loadAssets(this);
  }

  // The first screen's recordings download first, like every scene's.
  create() {
    const [key, data] = session.profiles.length ? ['Profiles', {}] : ['CreateProfile', { first: true }];
    voiceReady(key, data, this.scene.manager).then(() => this.scene.start(key, data));
  }
}
