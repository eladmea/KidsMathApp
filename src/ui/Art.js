import { emojiKey, texture } from '../services/assets';
import { COLORS, textStyle } from './theme';

// A picture: the image for `key` (or for the emoji) when one has been added
// under src/assets/images, otherwise the emoji itself as text. Sized to fit
// a `size` x `size` box, centred on (x, y). Scenes draw pictures with this,
// so art can replace emoji one file at a time.
//   art(scene, x, y, { key: 'islands/math', emoji: '🔢', size: 84 })
export function art(scene, x, y, { key = null, emoji = '', size = 64, color = COLORS.ink, style = {} } = {}) {
  const found = (key && texture(scene, key)) || (emoji !== '' && texture(scene, emojiKey(emoji)));
  if (found) {
    const image = scene.add.image(x, y, found);
    const scale = (size * 1.15) / Math.max(image.width, image.height);
    return image.setScale(scale);
  }
  return scene.add.text(x, y, String(emoji), textStyle(size, color, style)).setOrigin(0.5);
}

// The same for one emoji (or a number, which stays text).
export const glyph = (scene, x, y, emoji, size, color) => art(scene, x, y, { emoji, size, color });

// Is there an image for this emoji (so a button can show it instead of text)?
export const hasArt = (scene, emoji) => Boolean(texture(scene, emojiKey(emoji)));
