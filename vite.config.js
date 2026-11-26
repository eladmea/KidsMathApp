import { readFileSync } from 'fs';
import { defineConfig } from 'vite';

// Shown by the DEV button (src/dev/DevPanel.js): the version in package.json
// (`npm run bump` adds 1 to the last number), when this build was made, and
// its commit on GitHub.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
process.env.VITE_APP_VERSION = version;
process.env.VITE_BUILD_TIME = new Date().toISOString();
process.env.VITE_BUILD_COMMIT = (process.env.GITHUB_SHA || '').slice(0, 7);

// BASE_URL is the GitHub Pages path (e.g. /KidsMathApp/); "/" when developing.
export default defineConfig({
  base: process.env.BASE_URL || '/',
  build: {
    // Older phones and tablets too (iOS 14+, Android Chrome 87+). Newer syntax
    // is rewritten; tests/compat.test.js catches what can't be.
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
    // Phaser is big; keep it in its own cached chunk.
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) } },
    chunkSizeWarningLimit: 1600,
    // Recordings stay separate files, fetched only when spoken (small ones
    // would otherwise be inlined into the game's script).
    assetsInlineLimit: (file) => (file.includes('/voice/') ? false : undefined),
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup/english.js'],
  },
});
