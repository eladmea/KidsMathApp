import Phaser from 'phaser';
import { loadAssets } from '../services/assets';
import { session } from '../services/session';

// Loads every image and sound (services/assets.js), then opens "Who's
// playing?" (or the welcome screen when there are no players yet).
export default class BootScene extends Phaser.Scene {
  static key = 'Boot';

  constructor() {
    super(BootScene.key);
  }

  preload() {
    loadAssets(this);
  }

  create() {
    if (session.profiles.length) this.scene.start('Profiles');
    else this.scene.start('CreateProfile', { first: true });
  }
}
