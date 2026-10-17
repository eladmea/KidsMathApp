import { defineConfig } from 'vite';

// BASE_URL is the GitHub Pages path (e.g. /KidsMathApp/); "/" when developing.
export default defineConfig({
  base: process.env.BASE_URL || '/',
  build: {
    // Phaser is big; keep it in its own cached chunk.
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) } },
    chunkSizeWarningLimit: 1600,
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.js'],
  },
});
