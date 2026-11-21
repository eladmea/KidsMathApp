// Turns a picture into a game picture (see "Make a picture with ComfyUI" in
// ARCHITECTURE.md): the empty margins are trimmed, and the result is saved
// as a small square WebP. A transparent cutout (BiRefNet's, from
// scripts/comfy-picture.mjs) is used as it is; on a plain white page, the
// white and the soft grey shadow under the subject are made transparent.
// Every picture loads when the game starts, so keep them small.
//   node scripts/picture-cutout.mjs <page.png> <image key> [--size 384]
//   node scripts/picture-cutout.mjs page.png emoji/1f32d   -> src/assets/images/emoji/1f32d.webp
//   --frame OTHER  trim to the box that holds both this cutout and OTHER (a
//            page of the same size), so two frames of an animation line
//            up: an animal with its mouth shut and with it open.
//   --pale   for a light subject (garlic, an egg, flour): only near-pure white
//            and the darker grey of the shadow go, so its pale edge stays.
// The page can be a file or an https URL.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const [source, key] = args.filter((arg, i) => !arg.startsWith('--') && !/^\d+$/.test(arg) && args[i - 1] !== '--frame');
const frameAt = args.indexOf('--frame');
const FRAME = frameAt >= 0 ? args[frameAt + 1] : null;
const sizeAt = args.indexOf('--size');
const SIZE = sizeAt >= 0 ? Number(args[sizeAt + 1]) : 384;
const PALE = args.includes('--pale');
if (!source || !key) {
  console.error('Usage: node scripts/picture-cutout.mjs <page.png | url> <image key, e.g. emoji/1f32d> [--size 384] [--pale]');
  process.exit(1);
}

const input = /^https:\/\//.test(source) ? Buffer.from(await (await fetch(source)).arrayBuffer()) : fs.readFileSync(source);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const at = (x, y) => (y * W + x) * 4;
// A cutout that is already transparent (BiRefNet, from comfy-picture.mjs)
// only needs trimming and sizing.
let clear = 0;
for (let p = 3; p < data.length; p += 4) if (data[p] < 128) clear++;
const CUT = clear > (W * H) / 20;

// Background: white, and the grey of the shadow (no colour, not black).
// Food and objects have colour, so they stop the fill; only grey connected
// to the page's edge goes.
const background = (i) => {
  const max = Math.max(data[i], data[i + 1], data[i + 2]);
  const min = Math.min(data[i], data[i + 1], data[i + 2]);
  if (max - min >= 36 || max <= 30) return false;
  return !PALE || min > 246 || max < 215 || max - min < 7;
};
const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1]);
for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
while (stack.length && !CUT) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H || seen[y * W + x]) continue;
  seen[y * W + x] = 1;
  const i = at(x, y);
  if (!background(i)) continue;
  data[i + 3] = 0;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// --pale: a pale shadow can survive the fill as a thin ring under the
// subject. Anything thinner than 2 x THIN pixels goes (an opening of the
// shape: shrink it, grow it back, keep only what came back).
const THIN = 9;
if (!CUT && PALE) {
  const solid = (mask, x, y) => (x >= 0 && y >= 0 && x < W && y < H ? mask[y * W + x] : 0);
  const step = (mask, keepIf) => {
    const next = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) next[y * W + x] = keepIf(mask, x, y) ? 1 : 0;
    return next;
  };
  const near = (mask, x, y, all) => {
    for (let dy = -THIN; dy <= THIN; dy++) for (let dx = -THIN; dx <= THIN; dx++) {
      if (dx * dx + dy * dy > THIN * THIN) continue;
      if (solid(mask, x + dx, y + dy) !== all) return !all;
    }
    return all;
  };
  const shape = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) shape[p] = data[p * 4 + 3] ? 1 : 0;
  const shrunk = step(shape, (mask, x, y) => near(mask, x, y, 1));
  const grown = step(shrunk, (mask, x, y) => near(mask, x, y, 0) || solid(mask, x, y));
  // Then only the biggest piece stays (scraps of shadow are separate pieces).
  const piece = new Int32Array(W * H).fill(-1);
  const sizes = [];
  for (let p = 0; p < W * H; p++) {
    if (!grown[p] || piece[p] >= 0) continue;
    const id = sizes.length;
    let count = 0;
    const todo = [p];
    piece[p] = id;
    while (todo.length) {
      const q = todo.pop();
      count++;
      const x = q % W;
      const y = (q - x) / W;
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
        const n = ny * W + nx;
        if (solid(grown, nx, ny) && piece[n] < 0) {
          piece[n] = id;
          todo.push(n);
        }
      });
    }
    sizes.push(count);
  }
  const biggest = sizes.indexOf(Math.max(...sizes));
  for (let p = 0; p < W * H; p++) if (piece[p] !== biggest) data[p * 4 + 3] = 0;
}

// A soft edge: kept pixels next to removed ones fade by how light they are.
const before = Buffer.from(data);
for (let y = 1; y < H - 1 && !CUT; y++) {
  for (let x = 1; x < W - 1; x++) {
    const i = at(x, y);
    if (!before[i + 3]) continue;
    if (![at(x + 1, y), at(x - 1, y), at(x, y + 1), at(x, y - 1)].some((j) => !before[j + 3])) continue;
    const min = Math.min(before[i], before[i + 1], before[i + 2]);
    data[i + 3] = Math.max(60, Math.min(255, Math.round((255 - min) * 3)));
  }
}

// Trimmed, then centred on a square (pictures are sized by their longer side).
const trimmed = FRAME ? await frameTrim() : await sharp(data, { raw: info }).trim({ threshold: 0 }).png().toBuffer({ resolveWithObject: true });

// --frame: the box around what shows in this picture or in the other one.
async function frameTrim() {
  const other = (await sharp(fs.readFileSync(FRAME)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;
  let [left, top, right, bottom] = [W, H, -1, -1];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = at(x, y) + 3;
      if (!data[i] && !other[i]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return sharp(data, { raw: info }).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).png().toBuffer({ resolveWithObject: true });
}
const side = Math.max(trimmed.info.width, trimmed.info.height);
const pad = Math.round(side * 0.02);
const square = side + pad * 2;
const out = path.join('src/assets/images', `${key}.webp`);
fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp({ create: { width: square, height: square, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: trimmed.data, left: Math.round((square - trimmed.info.width) / 2), top: Math.round((square - trimmed.info.height) / 2) }])
  .png()
  .toBuffer()
  .then((png) => sharp(png).resize(SIZE, SIZE).webp({ quality: 90, alphaQuality: 100 }).toFile(out));
console.log(`${out}: ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
