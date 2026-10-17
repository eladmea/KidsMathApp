// Counts the signed-in child's play time while the game is open and a timed
// scene is showing (not "Who's playing?", the grown-ups' screens, the
// goodbye screen or the calm-down breathing). BaseScene tells it which scene
// is on screen.
import { addPlaySeconds, session } from './session';

const TICK_MS = 15000;
const UNTIMED = ['Boot', 'Profiles', 'CreateProfile', 'ParentDashboard', 'TimeUp', 'BalloonBreath'];

let current = null;
let last = 0;
let timer = null;

function tick() {
  const now = performance.now();
  // Never more than two ticks at once (the device slept, the tab was hidden).
  const elapsed = Math.min(now - last, TICK_MS * 2);
  last = now;
  const counting = session.profile && current && !UNTIMED.includes(current) && !document.hidden;
  if (counting && elapsed > 0) addPlaySeconds(Math.round(elapsed / 1000));
}

export function enterScene(key) {
  if (!timer) {
    last = performance.now();
    timer = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) tick();
      else last = performance.now();
    });
  }
  tick();
  current = key;
}
