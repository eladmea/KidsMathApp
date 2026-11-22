// Developer switches (the DEV button, dev/DevPanel.js). No Phaser, so the
// game rules can read them and `npm test` covers them.
//
// To turn the dev tools off for a build, set VITE_DEV_TOOLS=off. Every flag
// then stays false and the DEV button is not added. To remove them for good,
// delete src/dev/ and the lines that import it (grep for "dev/").
const STORE_KEY = 'mathplay.dev';

export const DEV_TOOLS = import.meta.env.VITE_DEV_TOOLS !== 'off';

// openAll: every stop on every island is open (no prerequisites).
// unlimitedTime: no daily time limit.
export const devFlags = { openAll: false, unlimitedTime: false };

function load() {
  if (!DEV_TOOLS) return;
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) || '{}');
    Object.keys(devFlags).forEach((name) => (devFlags[name] = saved[name] === true));
  } catch (e) {
    // No storage (private window): the flags start off.
  }
}

export function setDevFlag(name, value) {
  if (!DEV_TOOLS || !(name in devFlags)) return;
  devFlags[name] = Boolean(value);
  try {
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(devFlags));
  } catch (e) {
    // Kept for this visit only.
  }
}

load();
