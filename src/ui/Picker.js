import { glyph } from './Art';
import { COLORS, textStyle } from './theme';
import { play } from '../services/audio';

// A small grid of things to choose one of, with a title above: crayon
// colours (numbers) or pictures (emoji). The chosen one is bigger, on a
// dark ring. Used beside the tracing card for the writing colour and the
// race vehicle.
//   new Picker(scene, x, y, { title, options, chosen, columns, size, gap,
//     tagPrefix, onPick })
// options: colours (0xff9a3d) or emoji ('🏎️'); onPick(option) after a tap.
export default class Picker {
  constructor(scene, x, y, { title, options, chosen = options[0], columns = 4, size = 60, gap = 78, tagPrefix, onPick = () => {} }) {
    this.scene = scene;
    this.options = options;
    this.chosen = chosen;
    this.onPick = onPick;
    const rows = Math.ceil(options.length / columns);
    this.title = scene.add.text(x, y - size / 2 - 34, title, textStyle(26, COLORS.ink)).setOrigin(0.5);
    this.items = options.map((option, i) => {
      const cx = x + ((i % columns) - (columns - 1) / 2) * gap;
      const cy = y + Math.floor(i / columns) * gap;
      const isColor = typeof option === 'number';
      const ring = scene.add.circle(cx, cy, size / 2, isColor ? option : COLORS.white).setStrokeStyle(5, COLORS.white);
      const picture = isColor ? null : glyph(scene, cx, cy, option, size * 0.8);
      if (picture) picture.baseScale = picture.scale;
      ring.setInteractive({ useHandCursor: true });
      ring.on('pointerup', () => this.pick(option));
      if (tagPrefix) scene.tag(`${tagPrefix}:${i}`, ring);
      return { option, ring, picture };
    });
    this.height = rows * gap;
    this.mark(false);
  }

  pick(option) {
    if (option === this.chosen) return;
    this.chosen = option;
    play(this.scene, 'ding', { volume: 0.4 });
    this.mark(true);
    this.onPick(option);
  }

  mark(animate) {
    this.items.forEach(({ option, ring, picture }) => {
      const chosen = option === this.chosen;
      const isColor = typeof option === 'number';
      ring.setStrokeStyle(chosen ? 6 : 4, chosen ? COLORS.ink : isColor ? COLORS.white : 0xd6dce8);
      const grow = chosen ? 1.2 : 1;
      const sizes = [[ring, grow], ...(picture ? [[picture, picture.baseScale * grow]] : [])];
      sizes.forEach(([target, scale]) => {
        if (animate) this.scene.tweens.add({ targets: target, scale, duration: 150, ease: 'Back.easeOut' });
        else target.setScale(scale);
      });
    });
  }
}
