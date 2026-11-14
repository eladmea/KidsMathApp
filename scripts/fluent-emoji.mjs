// Replaces the game's emoji with Microsoft Fluent Emoji 3D pictures (MIT).
//
// Finds every emoji written in src/ (code, UI text, content packs) and packs
// its Fluent 3D picture into a few texture atlases in src/assets/atlases/
// (emoji-0.webp + emoji-0.json, ...), where art() / glyph() / IconText pick
// them up. A handful of big sheets load far faster than hundreds of small
// files. An emoji with its own picture in src/assets/images/emoji/ (a
// hand-made one) is left out, since that picture wins anyway.
//
// The atlases are rebuilt from scratch each run, so run it again after
// adding an emoji anywhere in src/.
//
// Needs a local copy of github.com/microsoft/fluentui-emoji. Only the 3D
// pictures are needed, so a sparse clone is enough:
//
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/fluentui-emoji.git
//   cd fluentui-emoji && git sparse-checkout set --no-cone '/assets/*/metadata.json' '/assets/*/3D/*' '/assets/*/Default/3D/*'
//
//   npm run art:fluent -- <path to fluentui-emoji>
import { readdirSync, readFileSync, existsSync, statSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(SRC, 'assets', 'atlases');
const OWN = join(SRC, 'assets', 'images', 'emoji');

// Each picture is CELL px square, in a STRIDE px slot (the gap stops
// neighbours bleeding in when scaled), on sheets of SHEET px: 12 x 12 = 144
// pictures a sheet. 2048 px is a texture size every tablet can take. CELL
// keeps the biggest pictures (about 125 px on a 2x screen) sharp.
const CELL = 160;
const STRIDE = 168;
const SHEET = 2048;
const PER_ROW = Math.floor(SHEET / STRIDE);
const PER_SHEET = PER_ROW * PER_ROW;

const fluent = process.argv[2];
if (!fluent || !existsSync(join(fluent, 'assets'))) {
  console.error('Usage: npm run art:fluent -- <path to fluentui-emoji checkout>');
  process.exit(1);
}

// The same key as emojiKey() in src/services/assets.js, without 'emoji/'.
// Fluent writes "0039 fe0f 20e3" where the game has 39-20e3.
const keyOf = (points) =>
  points
    .map((p) => parseInt(p, 16).toString(16))
    .filter((p) => p !== 'fe0f')
    .join('-');
const emojiKey = (emoji) => keyOf(Array.from(emoji).map((c) => c.codePointAt(0).toString(16)));

// Every emoji written in src/ (full sequences first, then lone pictographs
// written without their variation selector, like ☀ or ❤).
function walk(dir, files = []) {
  readdirSync(dir).forEach((name) => {
    const path = join(dir, name);
    if (path === join(SRC, 'assets')) return;
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(js|json)$/.test(name)) files.push(path);
  });
  return files;
}
const EMOJI = /\p{RGI_Emoji}|\p{Extended_Pictographic}/gv;
const used = new Map();
walk(SRC)
  .sort()
  .forEach((file) => {
    for (const [emoji] of readFileSync(file, 'utf8').matchAll(EMOJI)) {
      const key = emojiKey(emoji);
      if (!used.has(key)) used.set(key, emoji);
    }
  });

// Fluent's pictures by key. People and hands come in skin tones; the
// default (yellow) one is used.
const pictures = new Map();
readdirSync(join(fluent, 'assets')).forEach((folder) => {
  const base = join(fluent, 'assets', folder);
  const metaFile = join(base, 'metadata.json');
  if (!existsSync(metaFile)) return;
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  const dir = [join(base, '3D'), join(base, 'Default', '3D')].find((d) => existsSync(d));
  const png = dir && readdirSync(dir).find((f) => f.endsWith('.png'));
  if (png) pictures.set(keyOf(meta.unicode.toLowerCase().split(' ')), join(dir, png));
});

const own = new Set(existsSync(OWN) ? readdirSync(OWN).map((f) => f.replace(/\.[a-z0-9]+$/, '')) : []);
const missing = [];
const packed = [];
for (const [key, emoji] of used) {
  if (own.has(key)) continue;
  if (pictures.has(key)) packed.push(key);
  else missing.push(`${emoji} (${key})`);
}
packed.sort();

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const sheets = Math.ceil(packed.length / PER_SHEET);
for (let s = 0; s < sheets; s++) {
  const keys = packed.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const rows = Math.ceil(keys.length / PER_ROW);
  const width = Math.min(keys.length, PER_ROW) * STRIDE;
  const height = rows * STRIDE;
  const frames = {};
  const layers = await Promise.all(
    keys.map(async (key, i) => {
      const left = (i % PER_ROW) * STRIDE + (STRIDE - CELL) / 2;
      const top = Math.floor(i / PER_ROW) * STRIDE + (STRIDE - CELL) / 2;
      frames[`emoji/${key}`] = { frame: { x: left, y: top, w: CELL, h: CELL }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: CELL, h: CELL }, sourceSize: { w: CELL, h: CELL } };
      const input = await sharp(pictures.get(key)).resize(CELL, CELL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      return { input, left, top };
    })
  );
  const image = `emoji-${s}.webp`;
  await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .webp({ quality: 85, alphaQuality: 95, effort: 6 })
    .toFile(join(OUT, image));
  writeFileSync(join(OUT, `emoji-${s}.json`), JSON.stringify({ frames, meta: { image, size: { w: width, h: height }, scale: 1 } }) + '\n');
}

console.log(`${used.size} emoji in src/: ${packed.length} packed into ${sheets} atlas(es) in ${relative(ROOT, OUT)}, ${used.size - packed.length - missing.length} have their own picture.`);
if (missing.length) console.log(`No Fluent picture (they stay emoji or text): ${missing.join(' ')}`);
