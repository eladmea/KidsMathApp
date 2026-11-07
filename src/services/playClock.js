// Counts the signed-in child's play time while the game is open and a timed
// scene is showing (not "Who's playing?", the grown-ups' screens, the
// goodbye screen or the calm-down breathing). BaseScene tells it which scene
// is on screen. Time with nobody touching the game (logic/playTime.js
// IDLE_MS after the last tap or key) is not play, so it isn't counted.
import { addPlaySeconds, session } from './session';
import { activeMs } from '../logic/playTime';

const TICK_MS = 15000;
const UNTIMED = ['Boot', 'Profiles', 'CreateProfile', 'ParentDashboard', 'TimeUp', 'BalloonBreath'];

let current = null;
let last = 0;
let lastInput = 0;
let timer = null;

function tick() {
  const now = performance.now();
  // Never more than two ticks at once (the device slept, the tab was hidden).
  const start = Math.max(last, now - TICK_MS * 2);
  last = now;
  const counting = session.profile && current && !UNTIMED.includes(current) && !document.hidden;
  const elapsed = counting ? activeMs(start, now, lastInput) : 0;
  if (elapsed > 0) addPlaySeconds(Math.round(elapsed / 1000));
}

const touched = () => {
  lastInput = performance.now();
};

export function enterScene(key) {
  if (!timer) {
    last = performance.now();
    lastInput = last;
    timer = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) tick();
      else last = performance.now();
    });
    ['pointerdown', 'keydown'].forEach((type) => window.addEventListener(type, touched, { capture: true, passive: true }));
  }
  tick();
  current = key;
}
