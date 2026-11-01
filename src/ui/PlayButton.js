import { COLORS } from './theme';

// A round ▶ that says something when tapped (a picture's word, the sound
// asked for). Drawn, so it stays crisp at any size. Returns its parts
// [circle, triangle] to add to a container; the circle takes the tap.
//   box.add(playButton(scene, x, y, () => speak(word, { force: true })))
export function playButton(scene, x, y, onTap, radius = 40) {
  const circle = scene.add.circle(x, y, radius, COLORS.primary).setStrokeStyle(4, COLORS.white);
  // A triangle pointing right (its corners from its top-left, centred by its
  // origin), nudged right so it looks centred in the circle.
  const r = radius;
  const arrow = scene.add.triangle(x + r * 0.08, y, 0, 0, 0, r * 0.84, r * 0.76, r * 0.42, COLORS.white);
  circle.setInteractive({ useHandCursor: true }).on('pointerup', onTap);
  return [circle, arrow];
}
