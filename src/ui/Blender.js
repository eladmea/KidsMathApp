import Phaser from 'phaser';
import { art } from './Art';

// Kitchen Cove's blender: a glass jar on a base, with what goes in it
// inside. While it runs, the blades spin, the fruit whirls round a growing
// whirlpool and gets smaller, bubbles rise, and the milk turns pink; when it
// stops, the whirl settles. `update(ms, running, progress)` moves it on by
// `ms`; progress (0 to 1) is how smooth it is. Centred on (x, y).
//   new Blender(scene, x, y, { pieces: [{ key, emoji }], color })
const JAR = { bottom: 26, top: -170, bottomHalf: 62, topHalf: 90 };
const LEVEL = { start: -70, blended: -96 };
const MILK = 0xeedfc6;

const mix = (from, to, p) => {
  const channel = (shift) => Math.round(((from >> shift) & 255) + (((to >> shift) & 255) - ((from >> shift) & 255)) * p);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};
const halfAt = (y) => JAR.bottomHalf + ((JAR.bottom - y) / (JAR.bottom - JAR.top)) * (JAR.topHalf - JAR.bottomHalf);

export default class Blender extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { pieces = [], color = 0xf28cb0 } = {}) {
    super(scene, x, y);
    this.home = { x, y };
    this.color = color;
    this.speed = 0;
    this.spin = 0;
    this.progress = 0;
    this.clock = 0;

    // The base, with a dial and a light that turns green while it runs.
    const base = scene.add.graphics();
    base.fillStyle(0x3f4a56, 1).fillRoundedRect(-104, 36, 208, 100, 26);
    base.fillStyle(0x4f5d6b, 1).fillRoundedRect(-96, 40, 192, 84, 22);
    base.fillStyle(0x2f3842, 1).fillRoundedRect(-80, 28, 160, 22, 8);
    base.fillStyle(0xdfe6ec, 1).fillCircle(-30, 86, 20);
    base.fillStyle(0x9aa8b4, 1).fillRect(-32, 68, 4, 16);
    this.light = scene.add.circle(36, 86, 10, 0x8a949e);

    this.back = scene.add.graphics();
    this.liquid = scene.add.graphics();
    this.pieceLayer = scene.add.container(0, 0);
    this.blades = scene.add.graphics();
    this.front = scene.add.graphics();
    this.drawGlass();
    this.add([base, this.light, this.back, this.liquid, this.blades, this.pieceLayer, this.front]);

    // What went in: pieces resting at the bottom, a little apart.
    this.pieces = pieces.map((piece, i) => {
      const image = art(scene, 0, 0, { key: piece.key, emoji: piece.emoji, size: piece.size || 46 });
      this.pieceLayer.add(image);
      const n = pieces.length;
      return { image, scale: image.scale, phase: (i / n) * Math.PI * 2, reach: 0.35 + ((i * 37) % 10) / 18, height: ((i * 53) % 10) / 12, turn: ((i * 71) % 360) - 180 };
    });
    // Bubbles that rise while it runs.
    this.bubbles = Array.from({ length: 12 }, (_, i) => {
      const bubble = scene.add.circle(0, 0, 3 + (i % 3) * 2, 0xffffff, 0.7).setVisible(false);
      this.pieceLayer.add(bubble);
      return { bubble, at: i / 12, x: (((i * 29) % 10) / 10 - 0.5) * 1.4 };
    });
    scene.add.existing(this);
    this.update(0, false, 0);
  }

  drawGlass() {
    const { bottom, top, bottomHalf, topHalf } = JAR;
    const outline = [new Phaser.Math.Vector2(-bottomHalf, bottom), new Phaser.Math.Vector2(-topHalf, top), new Phaser.Math.Vector2(topHalf, top), new Phaser.Math.Vector2(bottomHalf, bottom)];
    this.back.clear().fillStyle(0xe6f5fc, 0.6).fillPoints(outline, true);
    const f = this.front.clear();
    // The handle, the glass's edge, a shine down its left side, and the lid.
    f.lineStyle(14, 0xa9cfe0, 0.9).beginPath().moveTo(topHalf - 6, top + 26).lineTo(topHalf + 34, top + 46).lineTo(bottomHalf + 32, bottom - 50).lineTo(bottomHalf - 4, bottom - 30).strokePath();
    f.lineStyle(5, 0x9fc6d8, 1).strokePoints(outline, true);
    f.fillStyle(0xffffff, 0.45).fillPoints([new Phaser.Math.Vector2(-bottomHalf + 14, bottom - 14), new Phaser.Math.Vector2(-topHalf + 16, top + 16), new Phaser.Math.Vector2(-topHalf + 30, top + 16), new Phaser.Math.Vector2(-bottomHalf + 26, bottom - 14)], true);
    // Measuring lines on the glass.
    f.lineStyle(3, 0x9fc6d8, 0.8);
    [-20, -60, -100].forEach((y) => f.lineBetween(halfAt(y) - 24, y, halfAt(y) - 6, y));
    f.fillStyle(0x3f4a56, 1).fillRoundedRect(-topHalf - 8, top - 20, (topHalf + 8) * 2, 24, 10);
    f.fillStyle(0x2f3842, 1).fillRoundedRect(-18, top - 36, 36, 20, 8);
  }

  // ms: time since the last call; running: the button is held.
  update(ms, running, progress) {
    this.clock += ms;
    this.progress = Math.max(this.progress, progress);
    const p = this.progress;
    // The motor speeds up and slows down rather than starting at once.
    this.speed += ((running ? 1 : 0) - this.speed) * Math.min(1, ms / 220);
    if (this.speed < 0.01) this.speed = 0;
    const speed = this.speed;
    this.spin += speed * ms * 0.03;
    this.light.setFillStyle(running ? 0x5fd35f : 0x8a949e);
    // A little shake while it runs.
    this.setPosition(this.home.x + Math.sin(this.clock / 23) * 2.5 * speed, this.home.y + Math.cos(this.clock / 17) * 1.5 * speed);
    this.setAngle(Math.sin(this.clock / 31) * 1.2 * speed);

    // The liquid: rises a little as it is whipped, turns pink, and dips into
    // a whirlpool in the middle while it spins.
    const level = LEVEL.start + (LEVEL.blended - LEVEL.start) * p;
    const dip = 34 * speed * (0.4 + 0.6 * Math.min(1, p * 2 + 0.3));
    const color = mix(MILK, this.color, Math.min(1, p * 1.15));
    const points = [new Phaser.Math.Vector2(-JAR.bottomHalf + 3, JAR.bottom - 3), new Phaser.Math.Vector2(JAR.bottomHalf - 3, JAR.bottom - 3)];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const u = 1 - (2 * i) / steps;
      const edge = halfAt(level) - 3;
      const wave = Math.sin(this.clock / 90 + u * 5) * 3 * speed;
      // Higher at the walls, low in the middle.
      points.push(new Phaser.Math.Vector2(u * edge, level - dip * 0.35 * u * u + dip * (1 - u * u) * (1 - u * u) + wave));
    }
    const g = this.liquid.clear();
    g.fillStyle(color, 0.95).fillPoints(points, true);
    // Swirl lines in the whirlpool, and a lighter top.
    if (speed > 0.05) {
      g.lineStyle(4, 0xffffff, 0.35 * speed);
      for (let k = 0; k < 3; k++) {
        const r = 0.25 + k * 0.22;
        const a = this.spin / 6 + k * 2.1;
        const y = level + dip * (1 - r * r) * 0.9 + 6;
        g.beginPath().arc(0, y, halfAt(level) * r, a, a + 1.6).strokePath();
      }
    }
    g.fillStyle(0xffffff, 0.22 + 0.2 * p).fillEllipse(0, level + 4, halfAt(level) * 1.7, 10);
    // Unmixed milk at first: pale streaks that fade as it blends.
    if (p < 0.6) {
      g.fillStyle(0xffffff, 0.5 * (1 - p / 0.6));
      g.fillEllipse(-20, JAR.bottom - 30, 60, 18).fillEllipse(24, JAR.bottom - 60, 50, 14);
    }

    // The blades.
    const b = this.blades.clear();
    const bladeY = JAR.bottom - 12;
    b.fillStyle(0xc5ced6, 1);
    for (let k = 0; k < 2; k++) {
      const a = this.spin / 3 + k * Math.PI;
      const reach = Math.cos(a) * 40;
      b.fillTriangle(0, bladeY - 4, reach, bladeY - 8 + Math.sin(a) * 4, reach, bladeY + Math.sin(a) * 4);
    }
    b.fillStyle(0x6b7884, 1).fillCircle(0, bladeY, 7);

    // The fruit: round the whirl, smaller and smaller, until it is all smooth.
    const bottom = JAR.bottom - 26;
    this.pieces.forEach((piece) => {
      piece.phase += speed * ms * 0.006 * (1.4 - piece.height * 0.6);
      const y = bottom + (level + 16 - bottom) * piece.height * (0.5 + 0.5 * speed) + Math.sin(piece.phase * 2) * 6 * speed;
      const x = Math.cos(piece.phase) * piece.reach * (halfAt(y) - 22);
      const near = Math.sin(piece.phase);
      const shrink = Math.max(0, 1 - p * 1.25);
      piece.image.setPosition(x, y).setAngle(piece.turn + this.spin * 4 * (piece.height + 0.3));
      piece.image.setScale(piece.scale * shrink * (0.88 + 0.12 * near * speed));
      piece.image.setAlpha(shrink > 0 ? 0.55 + 0.45 * Math.max(0, near) * speed + 0.45 * (1 - speed) : 0);
    });
    this.bubbles.forEach((entry) => {
      if (speed < 0.1) {
        entry.bubble.setVisible(false);
        return;
      }
      entry.at = (entry.at + ms * 0.0012 * speed) % 1;
      const y = bottom + (level - bottom) * entry.at;
      entry.bubble.setVisible(true).setPosition(entry.x * (halfAt(y) - 20) + Math.sin(this.clock / 80 + entry.x * 9) * 4, y).setAlpha(0.7 * (1 - entry.at));
    });
  }
}
