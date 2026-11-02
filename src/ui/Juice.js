import { COLORS, popStyle } from './theme';

// "Game juice": small animations that make answers feel good. Scenes call
// these instead of building their own emitters and tweens:
//   celebrate(scene, x, y, { number })  a burst of sparkles (and the number rising)
//   oops(scene, x, y)                   a short, gentle camera shake and a fading puff
//   popIn(scene, targets, { stagger })  grow in from nothing with a little bounce
//   fadeIn(scene, targets)              fade in from transparent
//   bob(scene, target)                  a slow float up and down, forever
//   settle(scene, target)               stop all of these on a target, back at rest
//   pulse(scene, target)                swell and spring back (a score going up)
// They follow ?fast (via the scene's tween speed), and a device asking for
// reduced motion gets no shaking or idle floating.

export const reducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// Textures drawn once, so no image files are needed.
const SPARK = 'juice-spark';
const PUFF = 'juice-puff';

function makeTextures(scene) {
  if (!scene.textures.exists(SPARK)) {
    // A four-pointed twinkle on a soft glow.
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const c = 24;
    [[22, 0.12], [15, 0.22], [9, 0.45]].forEach(([r, a]) => g.fillStyle(0xffffff, a).fillCircle(c, c, r));
    const points = [];
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 22 : 5;
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      points.push({ x: c + Math.cos(angle) * r, y: c + Math.sin(angle) * r });
    }
    g.fillStyle(0xffffff, 1).fillPoints(points, true);
    g.generateTexture(SPARK, c * 2, c * 2);
    g.destroy();
  }
  if (!scene.textures.exists(PUFF)) {
    // A soft cloud: overlapping circles, faint at the edges.
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const c = 64;
    [[0, 0, 40], [-26, 8, 28], [26, 8, 28], [-12, -20, 26], [14, -18, 26]].forEach(([dx, dy, r]) => {
      g.fillStyle(0xffffff, 0.35).fillCircle(c + dx, c + dy, r + 8);
      g.fillStyle(0xffffff, 0.6).fillCircle(c + dx, c + dy, r);
    });
    g.generateTexture(PUFF, c * 2, c * 2);
    g.destroy();
  }
}

// A right answer: sparkles burst out of (x, y). With `number`, it also rises
// from there in big outlined digits.
export function celebrate(scene, x, y, { number = null } = {}) {
  makeTextures(scene);
  const sparks = scene.add.particles(x, y, SPARK, {
    speed: { min: 180, max: 460 },
    angle: { min: 0, max: 360 },
    rotate: { min: 0, max: 360 },
    lifespan: { min: 500, max: 850 },
    gravityY: 420,
    scale: { start: 0.9, end: 0, ease: 'quad.out' },
    alpha: { start: 1, end: 0.2 },
    color: [COLORS.yellow, 0xffffff, COLORS.orange, COLORS.pink],
    emitting: false,
  }).setDepth(70);
  sparks.timeScale = scene.tweens.timeScale;
  sparks.explode(26);
  scene.time.delayedCall(1000, () => sparks.destroy());
  if (number !== null && /^\d+$/.test(String(number))) floatUp(scene, x, y, String(number));
  return sparks;
}

function floatUp(scene, x, y, text) {
  const label = scene.add.text(x, y, text, popStyle(64, COLORS.yellow)).setOrigin(0.5).setDepth(71).setScale(0.4);
  scene.tweens.add({ targets: label, scale: 1.1, duration: 260, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: label, y: y - 120, alpha: 0, delay: 240, duration: 700, ease: 'Quad.easeIn', onComplete: () => label.destroy() });
}

// A wrong answer: a quick, small shake and a warm puff that fades away.
// Kept gentle on purpose: young children should feel "try again", not "bad".
export function oops(scene, x, y) {
  makeTextures(scene);
  if (!reducedMotion()) scene.cameras.main.shake(180, 0.006);
  const puff = scene.add.image(x, y, PUFF).setTint(0xe5533d).setAlpha(0.6).setScale(0.5).setDepth(70);
  scene.tweens.add({ targets: puff, scale: 1.6, alpha: 0, y: y - 30, duration: 600, ease: 'Quad.easeOut', onComplete: () => puff.destroy() });
  return puff;
}

// Grows each target from (almost) nothing to its own scale, one after the
// other. A picture from art() is already scaled to fit, so each grows to the
// scale it had. Starts just above 0 so a tap during the bounce still lands.
export function popIn(scene, targets, { stagger = 70, duration = 320, onComplete } = {}) {
  const list = [].concat(targets).filter(Boolean);
  list.forEach((target, i) => {
    const full = target.scale;
    target.setScale(full * 0.05);
    scene.tweens.add({ targets: target, scale: full, duration, delay: i * stagger, ease: 'Back.easeOut', onComplete: () => onComplete && onComplete(target, i) });
  });
}

export function fadeIn(scene, targets, { duration = 260 } = {}) {
  const list = [].concat(targets).filter(Boolean);
  list.forEach((target) => target.setAlpha(0));
  scene.tweens.add({ targets: list, alpha: 1, duration, ease: 'Sine.easeOut' });
}

// A slow float up and down. Remembers where the target rests, for settle().
export function bob(scene, target, { distance = 5, duration = 1400, delay = 0 } = {}) {
  if (reducedMotion() || !target.active) return null;
  target.restY = target.y;
  return scene.tweens.add({ targets: target, y: target.y - distance, duration, delay, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// Stops popIn / bob on a target and puts it back at rest (before a result
// animation, or before it is destroyed).
export function settle(scene, target, scale = 1) {
  scene.tweens.killTweensOf(target);
  if (target.restY !== undefined) target.y = target.restY;
  target.setScale(scale);
}

export function pulse(scene, target, { to = 1.25 } = {}) {
  if (target.restScale === undefined) target.restScale = target.scale;
  const full = target.restScale;
  scene.tweens.killTweensOf(target);
  target.setScale(full);
  scene.tweens.add({ targets: target, scale: full * to, duration: 140, yoyo: true, ease: 'Quad.easeOut', onComplete: () => target.setScale(full) });
}
