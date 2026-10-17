// Walkthrough: the tracing games (Write 1 to 5, Bee Paths, Race Track).
//   node e2e/writing.mjs <screenshotDir> <width> <height> <label>
import { PASSED, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap, drag } = t;

await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }], { Mia: { 'math-write-1-5': PASSED } }, '?fast');
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
await tap('island:math');
await t.waitScene('Island');
await sleep(300);
const status = Object.fromEntries((await state()).skills.map((x) => [x.id, x.status]));
check('the sprouts writing games are open', ['math-write-1-5', 'math-write-6-9', 'math-bee-paths', 'math-race-track'].every((id) => status[id] !== 'soon' && status[id] !== 'locked'), JSON.stringify(status));

const waitTrace = (index) => waitFor((i) => window.__mathplay.state.step === 'trace' && window.__mathplay.state.index === i, index, 8000);
const traceAll = async () => {
  for (const stroke of (await state()).guide) await drag(stroke, 3);
};

// ---- Write 6 to 9 and 0: mistakes on the first digit, then clean ----
await tap('skill:math-write-6-9');
await t.waitScene('TraceDigits');
await waitTrace(0);
let s = await state();
check('write: 5 digits in the round, 6 first', s.total === 5 && s.key === 'd6', s.key);
await sleep(400);
await t.shot(dir, 'w1-digit');
// Touch far from the green dot.
const [ex, ey] = s.guide[0][s.guide[0].length - 1];
await drag([[ex, ey], [ex + 5, ey + 5]]);
check('write: touching away from the dot asks to start there', (await state()).hint === 'start');
// Lift halfway.
await drag(s.guide[0].slice(0, Math.floor(s.guide[0].length / 3)));
s = await state();
check('write: lifting early starts the stroke again', s.hint === 'almost' && s.restarts === 1, JSON.stringify({ h: s.hint, r: s.restarts }));
await tap('show-again');
await traceAll();
await waitFor(() => window.__mathplay.state.step === 'done');
check('write: the digit is done after one restart (a point)', (await state()).points === 1);
await sleep(200);
await t.shot(dir, 'w2-done');
for (let i = 1; i < 5; i++) {
  await waitTrace(i);
  s = await state();
  if (i === 4) check('write: 0 comes last', s.key === 'd0', s.key);
  await traceAll();
  await waitFor(() => window.__mathplay.state.step === 'done');
}
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
s = await state();
check('write: 5 of 5 on Results', s.score === 5 && s.total === 5, `${s.score}/${s.total}`);
await t.shot(dir, 'w3-results');
await tap('again');
await t.waitScene('TraceDigits');
await waitTrace(0);
check('write: Again plays the round again', (await state()).key === 'd6');
await tap('back');
await t.waitScene('Island');

// ---- Bee Paths ----
await tap('skill:math-bee-paths');
await t.waitScene('TracePath');
await waitTrace(0);
s = await state();
check('bee: starts with straight down', s.key === 'down', s.key);
await sleep(400);
await t.shot(dir, 'w4-bee');
for (let i = 0; i < 5; i++) {
  await waitTrace(i);
  await traceAll();
  await waitFor(() => window.__mathplay.state.step === 'done');
}
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
s = await state();
check('bee: 5 of 5, passed', s.score === 5 && s.newlyPassed.includes('math-bee-paths'), JSON.stringify(s.newlyPassed));
await tap('map');
await t.waitScene('Island');

// ---- Race Track ----
await tap('skill:math-race-track');
await t.waitScene('TracePath');
await waitTrace(0);
await sleep(400);
await t.shot(dir, 'w5-race');
const keys = [];
for (let i = 0; i < 5; i++) {
  await waitTrace(i);
  keys.push((await state()).key);
  await traceAll();
  await waitFor(() => window.__mathplay.state.step === 'done');
}
check('race: 5 different digits', new Set(keys).size === 5, keys.join(','));
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
check('race: 5 of 5', (await state()).score === 5);
const spoken = await t.spoken();
check('the games talk', spoken.some((l) => l.startsWith("Let's write six")) && spoken.some((l) => l.startsWith('Help the bee fly')) && spoken.some((l) => l.startsWith("Let's drive")));
process.exit(await t.finish());
