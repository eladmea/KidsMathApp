#!/usr/bin/env node
// Finishes a web export for GitHub Pages:
// - adds a web app manifest, Home Screen icons and theme colour, so "Add to
//   Home Screen" opens the game full screen with its own icon;
// - copies index.html to 404.html so unknown paths still load the app;
// - adds .nojekyll so Pages serves the _expo folder.
//
// Usage: EXPO_BASE_URL=/KidsMathApp node scripts/prepare-pages.js dist
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(process.argv[2] || 'dist');
const base = (process.env.EXPO_BASE_URL || '').replace(/\/$/, '');
const appJson = require('../app.json').expo;

const NAME = appJson.name;
const THEME_COLOR = '#4A6FE3';
const BACKGROUND_COLOR = '#FFF7E6';
const ICONS = [192, 512];

const indexPath = path.join(outDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`No index.html in ${outDir}. Run "npx expo export --platform web" first.`);
  process.exit(1);
}

for (const size of [...ICONS, 180]) {
  fs.copyFileSync(path.join(__dirname, '..', 'assets', 'web', `icon-${size}.png`), path.join(outDir, `icon-${size}.png`));
}

const manifest = {
  name: NAME,
  short_name: NAME,
  description: 'Learning games for kids ages 3-10: numbers, reading, science and puzzles.',
  start_url: `${base}/`,
  scope: `${base}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: BACKGROUND_COLOR,
  theme_color: THEME_COLOR,
  icons: ICONS.map((size) => ({ src: `${base}/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
};
fs.writeFileSync(path.join(outDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

const headTags = [
  `<link rel="manifest" href="${base}/manifest.webmanifest" />`,
  `<meta name="theme-color" content="${THEME_COLOR}" />`,
  `<link rel="apple-touch-icon" href="${base}/icon-180.png" />`,
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  `<meta name="apple-mobile-web-app-title" content="${NAME}" />`,
  `<meta name="description" content="${manifest.description}" />`,
].join('\n    ');

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `    ${headTags}\n  </head>`);
}
fs.writeFileSync(indexPath, html);
fs.copyFileSync(indexPath, path.join(outDir, '404.html'));
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

console.log(`Prepared ${outDir} for GitHub Pages (base path "${base || '/'}").`);
