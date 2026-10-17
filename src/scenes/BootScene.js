import Phaser from 'phaser';
import { loadSounds } from '../services/audio';
import { session } from '../services/session';

// Loads the shared sounds, then opens "Who's playing?" (or the welcome
// screen when there are no players yet).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    loadSounds(this);
  }

  create() {
    if (session.profiles.length) this.scene.start('Profiles');
    else this.scene.start('CreateProfile', { first: true });
  }
}
