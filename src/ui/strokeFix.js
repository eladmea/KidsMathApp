// Outlines of rounded shapes (setRounded + setStrokeStyle) in Phaser 4.2.1
// contain zero-length segments: the rounded corner's last point repeats the
// next edge's first, and the duplicate check misses it. DrawLine then divides
// by zero, and some tablet GPUs draw those NaN corners at (0, 0): thin lines
// from the top-left corner to every outlined box. A zero-length segment is
// stretched by a hair here, so it draws nothing instead.
import Phaser from 'phaser';

let installed = false;

export function installStrokeFix() {
  if (installed) return;
  installed = true;
  const proto = Phaser.Renderer.WebGL.RenderNodes.DrawLine.prototype;
  const run = proto.run;
  proto.run = function (drawingContext, currentMatrix, ax, ay, bx, by, ...rest) {
    if (ax === bx && ay === by) bx += 0.001;
    return run.call(this, drawingContext, currentMatrix, ax, ay, bx, by, ...rest);
  };
}
