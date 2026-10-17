import Phaser from 'phaser';
import { COLORS, textStyle } from './theme';

// ⭐⭐☆: 0 = not tried, 1 = tried, 2 = passed, 3 = mastered.
export default class StarRow extends Phaser.GameObjects.Text {
  constructor(scene, x, y, stars = 0, size = 36) {
    super(scene, x, y, '', textStyle(size, COLORS.yellow));
    this.setOrigin(0.5);
    this.setStars(stars);
    scene.add.existing(this);
  }

  setStars(stars) {
    this.stars = stars;
    return this.setText('⭐'.repeat(stars) + '☆'.repeat(3 - stars));
  }
}
