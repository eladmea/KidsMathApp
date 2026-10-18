import { defineConfig } from 'vite';

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
  },
});
