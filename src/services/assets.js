// Images and sounds, found by folder convention, so changing art means
// dropping in a file: no code or list to edit.
//
//   src/assets/images/<key>.png|webp|jpg|svg   key = path without extension:
//     islands/math.png        the Number Island art
//     skills/math-pizza.png   a skill's card picture
//     emoji/1f34e.png         replaces the 🍎 emoji everywhere it's drawn
//                             (the emoji's code points in hex, joined by '-')
//   src/assets/images/@<language>/<key>.png    a picture just for one
//     language (art with words on it); wins over the shared one
//   src/assets/sounds/<name>.wav|mp3|ogg       sound effects by file name
//
// Anything without a picture falls back to its emoji, so art can arrive a
// piece at a time.
import { getLanguage } from '../i18n/index';

const imageFiles = import.meta.glob('../assets/images/**/*.{png,webp,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' });
const soundFiles = import.meta.glob('../assets/sounds/*.{wav,mp3,ogg,m4a}', { eager: true, query: '?url', import: 'default' });

const keyOf = (path, folder) => path.slice(path.indexOf(folder) + folder.length).replace(/\.[a-z0-9]+$/, '');

// { [key]: url } for shared images, and per language: { [language]: { [key]: url } }.
const images = {};
const languageImages = {};
Object.entries(imageFiles).forEach(([path, url]) => {
  const key = keyOf(path, '/assets/images/');
  const match = key.match(/^@([^/]+)\/(.+)$/);
  if (match) {
    languageImages[match[1]] = languageImages[match[1]] || {};
    languageImages[match[1]][match[2]] = url;
  } else {
    images[key] = url;
  }
});

export const SOUNDS = Object.fromEntries(Object.entries(soundFiles).map(([path, url]) => [keyOf(path, '/assets/sounds/'), url]));

// 🍎 -> 'emoji/1f34e' (variation selectors dropped, so ❤️ and ❤ match).
export function emojiKey(emoji) {
  const points = Array.from(String(emoji))
    .map((c) => c.codePointAt(0))
    .filter((p) => p !== 0xfe0f)
    .map((p) => p.toString(16));
  return `emoji/${points.join('-')}`;
}

// The Phaser texture key for an image key, in the current language.
const textureKey = (key, language) => (language ? `img:@${language}/${key}` : `img:${key}`);

// Loads every image and sound (call from a scene's preload).
export function loadAssets(scene) {
  Object.entries(images).forEach(([key, url]) => scene.load.image(textureKey(key), url));
  Object.entries(languageImages).forEach(([language, files]) =>
    Object.entries(files).forEach(([key, url]) => scene.load.image(textureKey(key, language), url))
  );
  Object.entries(SOUNDS).forEach(([key, url]) => scene.load.audio(key, url));
}

// The loaded texture for an image key (this language's first), or null.
export function texture(scene, key) {
  const own = textureKey(key, getLanguage());
  if (scene.textures.exists(own)) return own;
  return scene.textures.exists(textureKey(key)) ? textureKey(key) : null;
}

export function imageKeys() {
  return Object.keys(images);
}
