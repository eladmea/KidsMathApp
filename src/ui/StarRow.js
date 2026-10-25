import IconText from './IconText';
import { COLORS, textStyle } from './theme';

// ⭐⭐☆: 0 = not tried, 1 = tried, 2 = passed, 3 = mastered.
export default class StarRow extends IconText {
  constructor(scene, x, y, stars = 0, size = 36) {
    super(scene, x, y, '', textStyle(size, COLORS.yellow));
    this.setStars(stars);
  }

  setStars(stars) {
    this.stars = stars;
    return this.setText('⭐'.repeat(stars) + '☆'.repeat(3 - stars));
  }

  // Starts empty and fills one star at a time, each with a pop, every `gap`
  // ms after `delay`; onStar(n) runs as star n appears (for a sound).
  reveal(stars, { delay = 0, gap = 450, onStar = () => {} } = {}) {
    this.setStars(0);
    for (let n = 1; n <= stars; n++) {
      this.scene.time.delayedCall(delay + (n - 1) * gap, () => {
        if (!this.active) return;
        this.setStars(n);
        // With pictures each star is its own part; as plain text, pop the row.
        const star = this.parts.length === 3 ? this.parts[n - 1] : this;
        const full = star.scale;
        star.setScale(full * 0.2);
        this.scene.tweens.add({ targets: star, scale: full, duration: 320, ease: 'Back.easeOut' });
        onStar(n);
      });
    }
    return this;
  }
}
