import PaintLayer, { DragSurface } from './PaintLayer';
import HintArrow from './HintArrow';
import { glyph } from './Art';
import { COLORS, textStyle } from './theme';
import { BOX, HIT_RADIUS, advance, freeTraceAdd, freeTraceResult, freeTraceStart, isStrokeDone, startsAtDot } from '../logic/tracing';

const DEMO_STEP_MS = 30;
const MAX_TRAIL_STAMPS = 160;

export const DEFAULT_LOOK = {
  dot: 10,
  guide: 0xdcd6ea,
  guideCurrent: 0xb9c8f5,
  done: COLORS.primary,
  trail: 0xff9a3d,
  trailSize: 18,
  trailEmoji: null,
  follower: null,
  // A colour here draws each stroke as a thick road under the dots, as wide
  // as the finger may stray, so young children see a fat number to follow.
  road: null,
  demo: '✏️',
};

// The finger-tracing area shared by the writing games. Give it the strokes
// (checkpoint lists in the 100 x 140 tracing box, see logic/tracing.js) and
// it draws the dot guide and the green start dot, shows a "watch me" demo,
// paints the trail (or leaves emoji, or carries a follower such as a car or
// a bee), and judges each stroke.
//
//   new TraceLayer(scene, x, y, width, { strokes, look, startMarker,
//     endMarker, freeOrder, onHint, onComplete, onTouch })
//
// (x, y) is the top-left corner; the height follows the box shape.
// Strict order (the default): each stroke starts at its green dot and is
// traced in order; lifting early starts that stroke again (onHint('almost')),
// touching away from the dot asks to start there (onHint('start')), and a
// finished stroke moves on (onHint('next')).
// Free order (`freeOrder`): judged by the result, as in Pizza Shop's sauce.
// onComplete({ restarts }) when every stroke is done.
export default class TraceLayer {
  constructor(scene, x, y, width, options) {
    const { strokes, look = {}, startMarker = null, endMarker = null, freeOrder = false, onHint = () => {}, onComplete = () => {}, onTouch = () => {} } = options;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.scale = width / BOX.width;
    this.width = width;
    this.height = BOX.height * this.scale;
    this.strokes = strokes;
    this.look = { ...DEFAULT_LOOK, ...look };
    this.freeOrder = freeOrder;
    this.handlers = { onHint, onComplete, onTouch };
    this.strokeIndex = 0;
    this.reached = 0;
    this.restarts = 0;
    this.finished = false;
    this.free = freeTraceStart(strokes);
    this.stamps = [];

    this.guide = scene.add.graphics();
    if (this.look.trailEmoji || this.look.follower) {
      this.paint = null;
    } else {
      this.paint = new PaintLayer(scene, x, y, this.width, this.height, { color: this.look.trail, radius: this.look.trailSize / 2 });
    }
    this.start = scene.add.container(0, 0);
    this.startDot = scene.add.circle(0, 0, 16, COLORS.green).setStrokeStyle(4, COLORS.white);
    this.startText = scene.add.text(0, 0, '', textStyle(16, COLORS.white)).setOrigin(0.5);
    this.start.add([this.startDot, this.startText]);
    if (startMarker) this.startMarker = glyph(scene, 0, 0, startMarker, 30);
    if (endMarker) {
      const last = strokes[strokes.length - 1];
      const [ex, ey] = this.toScene(last[last.length - 1]);
      this.endMarker = glyph(scene, ex, ey, endMarker, 38);
    }
    this.follower = this.look.follower ? glyph(scene, 0, 0, this.look.follower, 42).setVisible(false) : null;
    this.pencil = scene.add.text(0, 0, this.look.demo, textStyle(30)).setOrigin(0.1, 0.9).setVisible(false);
    this.arrow = new HintArrow(scene);
    this.objects = [this.guide, this.start, this.startMarker, this.endMarker, this.follower, this.pencil, this.arrow].filter(Boolean);

    this.surface = new DragSurface(scene, x - 30, y - 30, this.width + 60, this.height + 60, {
      onStart: (lx, ly) => this.down(this.toBox([lx + x - 30, ly + y - 30])),
      onMove: (lx, ly) => this.move(this.toBox([lx + x - 30, ly + y - 30])),
      onEnd: () => this.up(),
    });
    this.redraw();
    this.demo();
  }

  // ---- coordinates: tracing box <-> scene ----
  toScene([bx, by]) {
    return [this.x + bx * this.scale, this.y + by * this.scale];
  }

  toBox([sx, sy]) {
    return [(sx - this.x) / this.scale, (sy - this.y) / this.scale];
  }

  // The strokes in scene coordinates (for browser tests and hint arrows).
  guidePoints() {
    return this.strokes.map((stroke) => stroke.map((point) => this.toScene(point)));
  }

  startPoint() {
    return this.toScene(this.strokes[this.strokeIndex][0]);
  }

  // ---- drawing ----
  redraw() {
    const { look } = this;
    this.guide.clear();
    if (look.road) {
      const radius = HIT_RADIUS * this.scale * 0.8;
      this.strokes.forEach((stroke, s) => {
        const current = this.freeOrder || s === this.strokeIndex;
        this.guide.fillStyle(look.road, current || this.finished ? 1 : 0.55);
        stroke.forEach((point) => {
          const [px, py] = this.toScene(point);
          this.guide.fillCircle(px, py, radius);
        });
      });
    }
    this.strokes.forEach((stroke, s) => {
      stroke.forEach((point, i) => {
        const done = this.finished || (this.freeOrder ? this.free.covered[s][i] : s < this.strokeIndex || (s === this.strokeIndex && i < this.reached));
        if (!done && i % 2 === 1) return;
        const current = this.freeOrder || s === this.strokeIndex;
        const color = done ? look.done : current ? look.guideCurrent : look.guide;
        const [px, py] = this.toScene(point);
        this.guide.fillStyle(color, 1).fillCircle(px, py, done ? look.dot * 0.8 : look.dot / 2);
      });
    });
    const showStart = !this.finished && !(this.freeOrder && this.free.points > 0);
    this.start.setVisible(showStart);
    if (showStart) {
      const [sx, sy] = this.startPoint();
      this.start.setPosition(sx, sy);
      this.startText.setText(this.startMarker && this.strokeIndex === 0 ? '' : String(this.strokeIndex + 1));
      if (this.startMarker) this.startMarker.setPosition(sx, sy).setVisible(this.strokeIndex === 0);
    } else if (this.startMarker) {
      this.startMarker.setVisible(false);
    }
  }

  // Leaves trail emoji (paw prints, flowers) every few points.
  stampAt(point) {
    const [sx, sy] = this.toScene(point);
    if (this.paint) {
      if (this.drawing) this.paint.to(sx - this.x, sy - this.y);
      else this.paint.begin(sx - this.x, sy - this.y);
      this.drawing = true;
      return;
    }
    if (!this.look.trailEmoji) return;
    const last = this.stamps[this.stamps.length - 1];
    if (last && Math.hypot(last.x - sx, last.y - sy) < 22) return;
    if (this.stamps.length >= MAX_TRAIL_STAMPS) return;
    this.stamps.push(glyph(this.scene, sx, sy, this.look.trailEmoji, 18));
  }

  clearTrail() {
    if (this.paint) this.paint.clear();
    this.stamps.forEach((stamp) => stamp.destroy());
    this.stamps = [];
  }

  // ---- "watch me": the pencil (or follower) runs along every stroke once ----
  demo() {
    this.stopDemo();
    const path = this.strokes.flat();
    let i = 0;
    const rider = this.follower || this.pencil;
    rider.setVisible(true);
    this.demoTimer = this.scene.time.addEvent({
      delay: DEMO_STEP_MS,
      loop: true,
      callback: () => {
        if (i >= path.length) {
          this.stopDemo();
          return;
        }
        const [px, py] = this.toScene(path[i]);
        rider.setPosition(px, py);
        i += 1;
      },
    });
  }

  stopDemo() {
    if (this.demoTimer) this.demoTimer.remove();
    this.demoTimer = null;
    this.pencil.setVisible(false);
    if (this.follower && !this.dragging) this.follower.setVisible(false);
  }

  // A bouncing arrow over the start dot ("start here").
  pointAtStart(show = true) {
    if (!show || this.finished) return this.arrow.hide();
    const [sx, sy] = this.startPoint();
    this.arrow.pointAt(sx, sy - 22);
  }

  // ---- touch ----
  down(point) {
    if (this.finished) return;
    this.handlers.onTouch();
    this.arrow.hide();
    if (this.freeOrder) {
      this.stopDemo();
      this.dragging = true;
      this.track(point);
      return;
    }
    const checkpoints = this.strokes[this.strokeIndex];
    if (!startsAtDot(checkpoints, point)) {
      this.handlers.onHint('start');
      return;
    }
    this.stopDemo();
    this.dragging = true;
    this.reached = advance(checkpoints, 0, point);
    this.track(point);
  }

  move(point) {
    if (!this.dragging) return;
    if (!this.freeOrder) this.reached = advance(this.strokes[this.strokeIndex], this.reached, point);
    this.track(point);
  }

  track(point) {
    if (this.freeOrder) this.free = freeTraceAdd(this.free, point);
    this.stampAt(point);
    if (this.follower) {
      const [sx, sy] = this.toScene(point);
      this.follower.setPosition(sx, sy).setVisible(true);
    }
    this.redraw();
  }

  up() {
    if (!this.dragging) return;
    this.dragging = false;
    this.drawing = false;
    if (this.paint) this.paint.end();
    if (this.follower) this.follower.setVisible(false);
    if (this.freeOrder) return this.judgeFree();
    const checkpoints = this.strokes[this.strokeIndex];
    if (isStrokeDone(checkpoints, this.reached)) {
      if (this.strokeIndex + 1 < this.strokes.length) {
        this.strokeIndex += 1;
        this.reached = 0;
        this.redraw();
        this.handlers.onHint('next');
      } else {
        this.reached = checkpoints.length;
        this.complete();
      }
      return;
    }
    this.restarts += 1;
    this.reached = 0;
    this.clearTrail();
    this.redraw();
    this.handlers.onHint('almost');
  }

  judgeFree() {
    const result = freeTraceResult(this.free);
    if (result.done) return this.complete();
    if (result.messy) {
      this.restarts += 1;
      this.free = freeTraceStart(this.strokes);
      this.clearTrail();
      this.redraw();
      this.handlers.onHint('messy');
      return;
    }
    this.handlers.onHint('more', result);
  }

  complete() {
    this.finished = true;
    this.surface.setEnabled(false);
    this.arrow.hide();
    this.redraw();
    this.handlers.onComplete({ restarts: this.restarts });
  }

  // What browser tests need to know.
  state() {
    return { strokeIndex: this.strokeIndex, strokes: this.strokes.length, restarts: this.restarts, finished: this.finished, guide: this.guidePoints() };
  }

  destroy() {
    this.stopDemo();
    this.surface.destroy();
    this.clearTrail();
    if (this.paint) this.paint.rt.destroy();
    this.objects.forEach((object) => object.destroy());
  }
}

