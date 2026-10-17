import Phaser from 'phaser';
import '@fontsource/fredoka/latin-600.css';
import { SAFE } from './ui/BaseScene';
import { COLORS } from './ui/theme';
import { installBridge } from './services/testBridge';
import { loadSession } from './services/session';
import { initSpeech } from './services/speech';
import BootScene from './scenes/BootScene';
import ProfilesScene from './scenes/ProfilesScene';
import CreateProfileScene from './scenes/CreateProfileScene';
import HomeScene from './scenes/HomeScene';
import QuizScene from './scenes/QuizScene';
import PizzaScene from './scenes/PizzaScene';

async function start() {
  // Canvas text needs the font loaded before the first scene draws.
  try {
    await document.fonts.load('600 40px Fredoka');
  } catch (e) {
    // Falls back to the system font.
  }
  await loadSession();
  initSpeech();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: COLORS.sky,
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: SAFE.width,
      height: SAFE.height,
    },
    // Sharp text and shapes on high-density phone screens.
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    input: { activePointers: 3 },
    // Real HTML inputs (a child's name) float over the canvas.
    dom: { createContainer: true },
    scene: [BootScene, ProfilesScene, CreateProfileScene, HomeScene, QuizScene, PizzaScene],
  });
  installBridge(game);
}

start();
