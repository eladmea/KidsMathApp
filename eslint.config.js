// Catches mistakes before they reach a child: undefined names, unused
// imports, and the like. `npm run lint` (also run in CI).
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] },
  },
  { rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] } },
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest, ...globals.browser } },
  },
  {
    files: ['e2e/**/*.mjs', 'scripts/**/*.mjs', '*.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
