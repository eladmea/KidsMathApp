// Runs every walkthrough at phone, tablet and portrait sizes against a
// running build, and exits non-zero if any check fails.
//   node e2e/run.mjs <screenshotDir>
import { execFileSync } from 'child_process';

const dir = process.argv[2] || 'e2e-shots';
const SIZES = [
  [844, 390, 'phone'],
  [1180, 820, 'tablet'],
];
const runs = [
  ...SIZES.flatMap((size) => [['players.mjs', ...size], ['games.mjs', ...size], ['learning.mjs', ...size], ['writing.mjs', ...size], ['pizza.mjs', ...size], ['thinking.mjs', ...size], ['fun.mjs', ...size]]),
  ['players.mjs', 390, 844, 'portrait'],
  // Every quiz skill once (about 5 minutes, at test speed).
  ['quiz.mjs', 1280, 720, 'laptop'],
];
let failed = 0;
for (const [script, width, height, label] of runs) {
  try {
    const out = execFileSync('node', [new URL(script, import.meta.url).pathname, dir, String(width), String(height), label], { encoding: 'utf8' });
    const lines = out.trim().split('\n');
    const fails = lines.filter((line) => line.startsWith('FAIL'));
    console.log(`${fails.length ? '✗' : '✓'} ${script} ${label}: ${lines.filter((l) => l.startsWith('PASS')).length} passed${fails.length ? `, ${fails.length} failed` : ''}`);
    fails.forEach((line) => console.log(`  ${line}`));
    if (fails.length) failed += 1;
  } catch (error) {
    failed += 1;
    console.log(`✗ ${script} ${label}: crashed`);
    console.log(String(error.stdout || '').split('\n').filter((l) => l.startsWith('FAIL')).join('\n'));
    console.log(String(error.stderr || error.message).split('\n').slice(0, 8).join('\n'));
  }
}
process.exit(failed ? 1 : 0);
