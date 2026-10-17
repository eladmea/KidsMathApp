import Phaser from 'phaser';

// A surface you paint on with a finger: a RenderTexture that stamps a round
// brush along the stroke (filling the gaps between pointer events, so fast
// strokes stay solid). The caller feeds it points in its own local
// coordinates (0..width, 0..height) and decides what a stroke means.
//   const paint = new PaintLayer(scene, x, y, width, height, { color, radius })
//   paint.begin(x, y); paint.to(x, y); paint.end(); paint.clear()
export default class PaintLayer {
  constructor(scene, x, y, width, height, { color, radius, alpha = 1 }) {
    this.scene = scene;
    this.rt = scene.add.renderTexture(x, y, width, height).setOrigin(0, 0);
    this.last = null;
    this.setBrush(color, radius, alpha);
  }

  setBrush(color, radius, alpha = 1) {
    this.radius = radius;
    this.alpha = alpha;
    this.key = `brush-${color.toString(16)}-${radius}`;
    if (!this.scene.textures.exists(this.key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color, 1).fillCircle(radius, radius, radius);
      g.generateTexture(this.key, radius * 2, radius * 2);
      g.destroy();
    }
  }

  begin(x, y) {
    this.last = [x, y];
    this.rt.stamp(this.key, null, x, y, { alpha: this.alpha });
    this.rt.render();
  }

  // Paints from the last point to (x, y) with overlapping dabs.
  to(x, y) {
    if (!this.last) return this.begin(x, y);
    const [lx, ly] = this.last;
    const steps = Math.max(1, Math.ceil(Math.hypot(x - lx, y - ly) / (this.radius * 0.4)));
    for (let i = 1; i <= steps; i++) {
      this.rt.stamp(this.key, null, lx + ((x - lx) * i) / steps, ly + ((y - ly) * i) / steps, { alpha: this.alpha });
    }
    this.rt.render();
    this.last = [x, y];
  }

  end() {
    this.last = null;
  }

  clear() {
    this.rt.clear();
    this.rt.render();
    this.last = null;
  }

  setDepth(depth) {
    this.rt.setDepth(depth);
    return this;
  }
}

// Follows one finger over a rectangle: calls onStart/onMove/onEnd with points
// local to it. Moves keep counting outside the rectangle until the finger
// lifts, so a stroke never gets stuck.
export class DragSurface {
  constructor(scene, x, y, width, height, { onStart = () => {}, onMove = () => {}, onEnd = () => {} }) {
    this.scene = scene;
    this.origin = { x, y };
    this.zone = scene.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive();
    this.pointerId = null;
    this.enabled = true;
    const local = (pointer) => [pointer.worldX - this.origin.x, pointer.worldY - this.origin.y];
    this.zone.on('pointerdown', (pointer) => {
      if (!this.enabled || this.pointerId !== null) return;
      this.pointerId = pointer.id;
      onStart(...local(pointer));
    });
    const move = (pointer) => {
      if (pointer.id !== this.pointerId || !pointer.isDown) return;
      onMove(...local(pointer));
    };
    const up = (pointer) => {
      if (pointer.id !== this.pointerId) return;
      this.pointerId = null;
      onEnd(...local(pointer));
    };
    scene.input.on('pointermove', move);
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
    scene.events.once('shutdown', () => {
      scene.input.off('pointermove', move);
      scene.input.off('pointerup', up);
      scene.input.off('pointerupoutside', up);
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.pointerId = null;
  }
}
