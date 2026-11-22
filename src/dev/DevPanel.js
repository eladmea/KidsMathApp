// The DEV button: a small HTML panel over the game (not a Phaser scene, so
// it works on every screen and nothing else depends on it). It shows the
// version and when this build was made, and has switches for testing:
// open every level, no time limit, and English / Hebrew on the spot.
// See src/dev/flags.js for how to turn it off.
import { devFlags, setDevFlag } from './flags';
import { getLanguage, languages, onLanguageChange, setLanguage, t } from '../i18n/index';
import { session, updateProfile } from '../services/session';

const VERSION = import.meta.env.VITE_APP_VERSION;
const BUILT = import.meta.env.VITE_BUILD_TIME;
const COMMIT = import.meta.env.VITE_BUILD_COMMIT;

const CSS = `
#dev-button { position: fixed; left: 6px; bottom: 6px; z-index: 20; padding: 2px 8px; border: 0; border-radius: 8px;
  background: rgba(45, 49, 66, 0.55); color: #fff; font: 600 12px system-ui, sans-serif; cursor: pointer; }
#dev-panel { position: fixed; left: 6px; bottom: 34px; z-index: 21; min-width: 220px; padding: 12px 14px; border-radius: 12px;
  background: rgba(45, 49, 66, 0.94); color: #fff; font: 14px system-ui, sans-serif; direction: ltr; text-align: left;
  display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); }
#dev-panel[hidden] { display: none; }
#dev-panel .dev-version { font-weight: 700; font-size: 16px; }
#dev-panel .dev-meta { opacity: 0.75; font-size: 12px; }
#dev-panel label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
#dev-panel input { width: 18px; height: 18px; }
#dev-panel .dev-row { display: flex; gap: 6px; align-items: center; }
#dev-panel button { padding: 4px 10px; border: 0; border-radius: 8px; background: #4a6fe3; color: #fff; font: 600 13px system-ui, sans-serif; cursor: pointer; }
#dev-panel button[aria-pressed='true'] { background: #f2b441; color: #2d3142; }
#dev-panel button.dev-close { align-self: flex-end; background: transparent; opacity: 0.8; }
`;

function formatTime(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Draws the scene on screen again, so a change shows straight away.
function refresh(game) {
  game.scene.getScenes(true).forEach((scene) => (typeof scene.replay === 'function' ? scene.replay() : scene.scene.restart()));
}

export function installDevPanel(game) {
  // Hidden from the browser walkthroughs (they tap the screen's edges), unless
  // the address has ?dev.
  if (navigator.webdriver && !new URLSearchParams(location.search).has('dev')) return;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const button = document.createElement('button');
  button.id = 'dev-button';
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.hidden = true;
  // Taps on the panel are not taps on the game.
  ['pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((type) => panel.addEventListener(type, (e) => e.stopPropagation()));
  document.body.append(panel, button);

  const toggle = (name) => {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = devFlags[name];
    box.addEventListener('change', () => {
      setDevFlag(name, box.checked);
      refresh(game);
    });
    label.append(box, t(`dev.${name}`));
    return label;
  };

  const chooseLanguage = async (id) => {
    if (id === getLanguage()) return;
    // A signed-in child keeps it, as if a grown-up changed it in Settings.
    if (session.profile) await updateProfile({ language: id });
    else setLanguage(id);
    refresh(game);
  };

  const render = () => {
    button.textContent = `${t('dev.button')} v${VERSION}`;
    panel.replaceChildren();
    const version = document.createElement('div');
    version.className = 'dev-version';
    version.textContent = t('dev.version', { version: VERSION });
    const meta = document.createElement('div');
    meta.className = 'dev-meta';
    meta.textContent = [t('dev.built', { time: formatTime(BUILT) }), COMMIT && t('dev.commit', { commit: COMMIT })].filter(Boolean).join(' · ');
    const row = document.createElement('div');
    row.className = 'dev-row';
    row.append(t('dev.language'));
    languages().forEach((language) => {
      const pick = document.createElement('button');
      pick.textContent = language.name;
      pick.setAttribute('aria-pressed', String(language.id === getLanguage()));
      pick.addEventListener('click', () => chooseLanguage(language.id));
      row.append(pick);
    });
    const close = document.createElement('button');
    close.className = 'dev-close';
    close.textContent = t('dev.close');
    close.addEventListener('click', () => (panel.hidden = true));
    panel.append(version, meta, toggle('openAll'), toggle('unlimitedTime'), row, close);
  };

  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) render();
  });
  onLanguageChange(render);
  render();
}
