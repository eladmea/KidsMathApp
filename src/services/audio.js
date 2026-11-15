// Short sound effects through Phaser's sound manager, by file name in
// src/assets/sounds (loaded with everything else in services/assets.js).
//   play(scene, 'correct')
//   play(scene, 'star', { detune: 200 })    two semitones higher (cents)
// Each sound is also announced on the scene ('sfx'), so BaseScene can add
// sparkles to every 'correct' and a soft puff to every 'wrong'.
export function play(scene, key, { volume = 0.6, detune = 0 } = {}) {
  scene.events.emit('sfx', key);
  if (!scene.cache.audio.exists(key)) return;
  try {
    scene.sound.play(key, { volume, detune });
  } catch (e) {
    // Audio can be blocked until the first tap; a missed chime is fine.
  }
}

// The end of a round or a match: a jingle and children cheering "Yaaay!"
// (a sound, not the narrator's voice), then `after` (what the narrator says)
// once the cheer is over.
export const CHEER_MS = 1500;
export function cheer(scene, after) {
  play(scene, 'cheer');
  scene.time.delayedCall(250, () => play(scene, 'hooray', { volume: 0.8 }));
  if (after) scene.time.delayedCall(CHEER_MS, after);
}
