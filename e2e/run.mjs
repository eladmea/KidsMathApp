// Runs every walkthrough at phone, tablet and portrait sizes against a
// build, and exits non-zero if any check fails. Each walkthrough has its own
// browser, so several run at once: E2E_JOBS, by default half the CPUs (up to
// 4). More than that and timing-sensitive checks (Pizza, Quiz) start to fail.
//   node e2e/run.mjs <screenshotDir>                  against a running server (URL)
//   node e2e/run.mjs <screenshotDir> --serve <dir>    serves <dir> itself, then stops
//   node e2e/run.mjs --list                           the walkthroughs as JSON
//                                                     ({ name: 'quiz.mjs:laptop' }, for CI)
//   node e2e/run.mjs ... --only quiz.mjs:laptop        just that one
import { execFile } from 'child_process';
import { availableParallelism } from 'os';
import { promisify } from 'util';
import { serve } from './serve.mjs';

const run = promisify(execFile);
const args = process.argv.slice(2);
const option = (flag) => {
  const at = args.indexOf(flag);
  return at >= 0 ? args.splice(at, 2)[1] : null;
};
const served = option('--serve');
const only = option('--only');
const listing = args.includes('--list');
const dir = args[0] || 'e2e-shots';
const SIZES = [
  [844, 390, 'phone'],
  [1180, 820, 'tablet'],
];
const runs = [
  // Every quiz skill once (about 5 minutes, at test speed): the longest, so first.
  ['quiz.mjs', 1280, 720, 'laptop'],
  ...SIZES.flatMap((size) => [['writing.mjs', ...size], ['thinking.mjs', ...size], ['pizza.mjs', ...size], ['hebrew.mjs', ...size], ['learning.mjs', ...size], ['grownups.mjs', ...size], ['fun.mjs', ...size], ['games.mjs', ...size], ['players.mjs', ...size], ['islands.mjs', ...size]]),
  ['players.mjs', 390, 844, 'portrait'],
];
const nameOf = ([script, , , label]) => `${script}:${label}`;
if (listing) {
  console.log(JSON.stringify(runs.map((r) => ({ name: nameOf(r) }))));
  process.exit(0);
}
const chosen = only ? runs.filter((r) => nameOf(r) === only) : runs;
if (!chosen.length) {
  console.log(`No walkthrough called ${only} (see --list)`);
  process.exit(1);
}
const server = served ? await serve(served) : null;
// The walkthroughs read the address from URL (helpers.mjs).
if (server) process.env.URL = server.url;
const jobs = Math.min(chosen.length, Number(process.env.E2E_JOBS) || Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2))));
let failed = 0;

async function runOne([script, width, height, label]) {
  const started = Date.now();
  const took = () => `${Math.round((Date.now() - started) / 1000)}s`;
  try {
    const { stdout: out } = await run('node', [new URL(script, import.meta.url).pathname, dir, String(width), String(height), label], { encoding: 'utf8', maxBuffer: 1 << 24 });
    const lines = out.trim().split('\n');
    const fails = lines.filter((line) => line.startsWith('FAIL'));
    console.log(`${fails.length ? '✗' : '✓'} ${script} ${label}: ${lines.filter((l) => l.startsWith('PASS')).length} passed${fails.length ? `, ${fails.length} failed` : ''} (${took()})`);
    fails.forEach((line) => console.log(`  ${line}`));
    if (fails.length) failed += 1;
  } catch (error) {
    failed += 1;
    console.log(`✗ ${script} ${label}: crashed (${took()})`);
    console.log(String(error.stdout || '').split('\n').filter((l) => l.startsWith('FAIL')).join('\n'));
    console.log(String(error.stderr || error.message).split('\n').slice(0, 8).join('\n'));
  }
}

// `jobs` workers take the next walkthrough until none are left.
const queue = [...chosen];
const started = Date.now();
await Promise.all(Array.from({ length: jobs }, async () => {
  while (queue.length) await runOne(queue.shift());
}));
console.log(`${chosen.length - failed} of ${chosen.length} walkthroughs passed in ${Math.round((Date.now() - started) / 60000)} min (${jobs} at a time)`);
if (server) await server.close();
process.exit(failed ? 1 : 0);
