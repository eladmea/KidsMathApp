import Phaser from 'phaser';
import Button from './Button';
import { glyph } from './Art';
import { COLORS, textStyle } from './theme';
import { tag } from '../services/testBridge';
import { t } from '../i18n/index';

// The card that explains a game before it starts: a title, a big picture,
// a line or two, an optional row of small pictures, and Go.
//   new RulesCard(scene, { title, picture, lines, row, onGo })
export default class RulesCard extends Phaser.GameObjects.Container {
  constructor(scene, { title, picture, lines = [], row = [], onGo }) {
    super(scene, 640, 430);
    const parts = [];
    parts.push(scene.add.text(0, -170, title, textStyle(40)).setOrigin(0.5));
    if (picture) parts.push(glyph(scene, 0, -80, picture, 100));
    let y = 10;
    lines.forEach((line, i) => {
      if (i === 1 && row.length) {
        row.forEach((emoji, n) => parts.push(glyph(scene, (n - (row.length - 1) / 2) * 64, y + 30, emoji, 44)));
        y += 70;
      }
      const text = scene.add.text(0, y, line, textStyle(26, COLORS.ink, { wordWrap: { width: 520 } })).setOrigin(0.5, 0);
      parts.push(text);
      y += text.height + 10;
    });
    // Down to below the Go button.
    const height = Math.max(440, y + 145 + 230);
    const card = scene.add.rectangle(0, -230 + height / 2, 600, height, COLORS.white).setRounded(32);
    const go = new Button(scene, 0, y + 70, { label: t('common.go'), width: 260, height: 90, color: COLORS.green, onTap: onGo });
    tag('go', go.box);
    this.add([card, ...parts, go]);
    this.setDepth(30);
    scene.add.existing(this);
  }
}
