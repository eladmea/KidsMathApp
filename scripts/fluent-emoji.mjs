// Replaces the game's emoji with Microsoft Fluent Emoji 3D pictures (MIT).
//
// Finds every emoji written in src/ (code, UI text, content packs) and writes
// its Fluent 3D picture to src/assets/images/emoji/<code points>.webp, where
// art() / glyph() / IconText pick it up. Emoji that already have a picture
// are left alone (pass --force to replace them too).
//
// Needs a local copy of github.com/microsoft/fluentui-emoji. Only the 3D
// pictures are needed, so a sparse clone is enough:
//
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/fluentui-emoji.git
//   cd fluentui-emoji && git sparse-checkout set --no-cone '/assets/*/metadata.json' '/assets/*/3D/*' '/assets/*/Default/3D/*'
//
//   npm run art:fluent -- <path to fluentui-emoji> [--force] [--size 256]
import { readdirSync, readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(SRC, 'assets', 'images', 'emoji');

const args = process.argv.slice(2);
const force = args.includes('--force');
const sizeAt = args.indexOf('--size');
const size = sizeAt >= 0 ? Number(args[sizeAt + 1]) : 256;
const fluent = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--size');
if (!fluent || !existsSync(join(fluent, 'assets'))) {
  console.error('Usage: npm run art:fluent -- <path to fluentui-emoji checkout> [--force] [--size 256]');
  process.exit(1);
}

// The same key as emojiKey() in src/services/assets.js.
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
walk(SRC).forEach((file) => {
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

mkdirSync(OUT, { recursive: true });
const existing = new Set(readdirSync(OUT).map((f) => f.replace(/\.[a-z0-9]+$/, '')));
const missing = [];
let written = 0;
let kept = 0;
for (const [key, emoji] of used) {
  const name = key;
  if (existing.has(name) && !force) {
    kept += 1;
    continue;
  }
  const picture = pictures.get(name);
  if (!picture) {
    missing.push(`${emoji} (${name})`);
    continue;
  }
  await sharp(picture).resize(size, size, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(join(OUT, `${name}.webp`));
  written += 1;
}

console.log(`${used.size} emoji in src/: ${written} pictures written to ${relative(ROOT, OUT)}, ${kept} already had one.`);
if (missing.length) console.log(`No Fluent picture (they stay emoji or text): ${missing.join(' ')}`);
