// Runs every walkthrough at phone, tablet and portrait sizes against a
// build, and exits non-zero if any check fails. Each walkthrough has its own
// browser, so several run at once: E2E_JOBS, by default half the CPUs (up to
// 4). More than that and timing-sensitive checks (Pizza, Quiz) start to fail.
//   node e2e/run.mjs <screenshotDir>                  against a running server (URL)
//   node e2e/run.mjs <screenshotDir> --serve <dir>    serves <dir> itself, then stops
//   node e2e/run.mjs --list                           the walkthroughs as JSON
//                                                     ({ name: 'quiz.mjs:laptop' }, for CI)
//   node e2e/run.mjs ... --only quiz.mjs:laptop-math   just that one (or several, a,b)
import { execFile } from 'child_process';
import { appendFileSync } from 'fs';
import { availableParallelism } from 'os';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
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
  // Every quiz skill once, a subject per run so they share the workers;
  // math has the most skills, so it goes first.
  ...['math', 'literacy', 'logic', 'science', 'sel'].map((subject) => ['quiz.mjs', 1280, 720, 'laptop', subject]),
  ...SIZES.flatMap((size) => [['writing.mjs', ...size], ['thinking.mjs', ...size], ['pizza.mjs', ...size], ['hebrew.mjs', ...size], ['learning.mjs', ...size], ['grownups.mjs', ...size], ['fun.mjs', ...size], ['games.mjs', ...size], ['players.mjs', ...size], ['islands.mjs', ...size], ['numbers.mjs', ...size], ['letters.mjs', ...size]]),
  ['players.mjs', 390, 844, 'portrait'],
];
const nameOf = ([script, , , label, part]) => `${script}:${label}${part ? `-${part}` : ''}`;
if (listing) {
  console.log(JSON.stringify(runs.map((r) => ({ name: nameOf(r) }))));
  process.exit(0);
}
const wanted = only ? only.split(',') : null;
const chosen = wanted ? runs.filter((r) => wanted.includes(nameOf(r))) : runs;
if (!chosen.length) {
  console.log(`No walkthrough called ${only} (see --list)`);
  process.exit(1);
}
const server = served ? await serve(served) : null;
// The walkthroughs read the address from URL (helpers.mjs).
if (server) process.env.URL = server.url;
const jobs = Math.min(chosen.length, Number(process.env.E2E_JOBS) || Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2))));
let failed = 0;
let done = 0;
// One entry per walkthrough, for the summary at the end.
const results = [];

async function runOne(entry) {
  const [script, width, height, label, ...extra] = entry;
  const started = Date.now();
  const seconds = () => Math.round((Date.now() - started) / 1000);
  const count = () => `[${++done}/${chosen.length}]`;
  let passes;
  let fails;
  let crashed = false;
  try {
    const { stdout: out } = await run('node', [fileURLToPath(new URL(script, import.meta.url)), dir, String(width), String(height), label, ...extra], { encoding: 'utf8', maxBuffer: 1 << 24 });
    const lines = out.trim().split(/\r?\n/);
    passes = lines.filter((l) => l.startsWith('PASS')).length;
    fails = lines.filter((l) => l.startsWith('FAIL'));
    console.log(`${count()} ${fails.length ? '✗' : '✓'} ${script} ${[label, ...extra].join(' ')}: ${passes} passed${fails.length ? `, ${fails.length} failed` : ''} (${seconds()}s)`);
    fails.forEach((line) => console.log(`  ${line}`));
  } catch (error) {
    crashed = true;
    const out = String(error.stdout || '').split(/\r?\n/);
    passes = out.filter((l) => l.startsWith('PASS')).length;
    fails = out.filter((l) => l.startsWith('FAIL'));
    console.log(`${count()} ✗ ${script} ${[label, ...extra].join(' ')}: crashed (${seconds()}s)`);
    console.log(fails.join('\n'));
    console.log(String(error.stderr || error.message).split('\n').slice(0, 8).join('\n'));
  }
  const ok = !crashed && !fails.length;
  if (!ok) failed += 1;
  results.push({ name: nameOf(entry), ok, crashed, passes, fails, seconds: seconds() });
}

// `jobs` workers take the next walkthrough until none are left.
const queue = [...chosen];
const started = Date.now();
await Promise.all(Array.from({ length: jobs }, async () => {
  while (queue.length) await runOne(queue.shift());
}));
const minutes = Math.round((Date.now() - started) / 6000) / 10;
const total = `${chosen.length - failed} of ${chosen.length} walkthroughs passed`;
console.log(`${total} in ${minutes} min (${jobs} at a time)`);

// On GitHub Actions, when this job runs more than one walkthrough (the PC
// job), show the count at the top of the run page and a table on its
// Summary page. The one-walkthrough jobs on GitHub's machines skip this.
if (process.env.GITHUB_ACTIONS && chosen.length > 1) {
  console.log(`::${failed ? 'error' : 'notice'} title=Walkthroughs::${total} (${minutes} min, ${jobs} at a time)`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const cell = (text) => text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const rows = [...results]
      .sort((a, b) => a.ok - b.ok || chosen.findIndex((r) => nameOf(r) === a.name) - chosen.findIndex((r) => nameOf(r) === b.name))
      .map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${r.passes} | ${r.fails.length}${r.crashed ? ' (crashed)' : ''} | ${r.seconds}s |`);
    const failures = results.filter((r) => r.fails.length).flatMap((r) => r.fails.map((f) => `- **${r.name}**: ${cell(f.replace(/^FAIL\s*/, ''))}`));
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
      `### ${failed ? '❌' : '✅'} ${total}`,
      '',
      `${minutes} min, ${jobs} at a time.`,
      '',
      '| | Walkthrough | Checks passed | Failed | Time |',
      '|---|---|---|---|---|',
      ...rows,
      ...(failures.length ? ['', '#### Failed checks', '', ...failures] : []),
      '',
    ].join('\n'));
  }
}
if (server) await server.close();
process.exit(failed ? 1 : 0);
