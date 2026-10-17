// Short sound effects through Phaser's sound manager, by file name in
// src/assets/sounds (loaded with everything else in services/assets.js).
//   play(scene, 'correct')
export function play(scene, key, volume = 0.6) {
  if (!scene.cache.audio.exists(key)) return;
  try {
    scene.sound.play(key, { volume });
  } catch (e) {
    // Audio can be blocked until the first tap; a missed chime is fine.
  }
}
