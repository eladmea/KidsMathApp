import Phaser from 'phaser';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/hebrew-600.css';
import { SAFE } from './ui/BaseScene';
import { COLORS } from './ui/theme';
import { installBridge } from './services/testBridge';
import { loadSession } from './services/session';
import { initSpeech } from './services/speech';
import { languageInfo, onLanguageChange, t } from './i18n/index';
import { SCENES } from './scenes/registry';
import { installRtlText } from './ui/rtlText';

async function start() {
  // Canvas text needs the font loaded before the first scene draws.
  try {
    // Both letter sets, so Hebrew is ready too (each loads only its own file).
    await Promise.all([document.fonts.load('600 40px Fredoka', 'Aa'), document.fonts.load('600 40px Fredoka', 'אב')]);
  } catch (e) {
    // Falls back to the system font.
  }
  await loadSession();
  document.querySelector('#rotate .text').textContent = t('common.turnDevice');
  initSpeech();
  installRtlText();
  // Name fields and notes (HTML inputs) follow the language too.
  const pageLanguage = () => {
    document.documentElement.lang = languageInfo().id;
    document.documentElement.dir = languageInfo().dir;
  };
  pageLanguage();
  onLanguageChange(pageLanguage);

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
    scene: SCENES,
  });
  installBridge(game);
  // The game is up: drop the loading / error message.
  game.events.once('ready', () => {
    window.__started = true;
    document.getElementById('status')?.remove();
  });
}

start().catch((error) => window.__showStartError?.(error && error.message));
