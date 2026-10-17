// Walkthrough: Count to 5 and two pizzas.
//   node e2e/games.mjs <screenshotDir> <width> <height> <label>
import { open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap, drag } = t;

await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }]);
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('Home');
await sleep(500);
await t.shot(dir, 'g1-home');
const view = await t.mp(() => {
  const rect = document.querySelector('canvas').getBoundingClientRect();
  return { w: rect.width, h: rect.height };
});
check('canvas fills the screen (no black bars)', Math.abs(view.w - width) < 2 && Math.abs(view.h - height) < 2, JSON.stringify(view));
check('greeting spoken', (await t.spoken()).some((line) => line.startsWith('Hi, Mia')));

// ---- Count to 5 ----
await tap('math-count-5');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step);
check('first play shows the how-to card', (await state()).step === 'howTo');
await t.shot(dir, 'g2-howto');
await tap('start');
for (let i = 0; i < 10; i++) {
  await waitFor((i) => window.__mathplay.state.step === 'question' && window.__mathplay.state.index === i, i);
  const s = await state();
  if (i === 0) {
    await sleep(700);
    await t.shot(dir, 'g3-question');
    check('4 answer choices', s.choices.length === 4, s.choices.join(','));
  }
  await tap(`choice:${i === 2 ? s.choices.find((c) => c !== s.answer) : s.answer}`);
  if (i === 2) {
    await sleep(300);
    await t.shot(dir, 'g4-wrong');
  }
}
await waitFor(() => window.__mathplay.state.step === 'results', null, 10000);
const result = await state();
check('9 of 10 recorded, passed with 2 stars', result.correct === 9 && result.stars === 2 && result.passed);
await sleep(500);
await t.shot(dir, 'g5-results');
await tap('home');
await t.waitScene('Home');

// ---- Pizza ----
await tap('math-pizza');
await waitFor(() => window.__mathplay.scene === 'Pizza' && window.__mathplay.state.step === 'trace');
await sleep(400);
await t.shot(dir, 'g6-pizza');
let s = await state();
// Pizza 1: the usual stroke order.
for (const stroke of s.guide) await drag(stroke);
await waitFor(() => window.__mathplay.state.step === 'spread');
check('pizza 1: number written in sauce', true, `number ${s.number}`);
await t.shot(dir, 'g7-written');
async function spread() {
  for (let row = 0; row < 12 && (await state()).step === 'spread'; row++) {
    const y = 230 + row * 34;
    await drag([[500, y], [900, y]], 6);
  }
}
await spread();
await waitFor(() => window.__mathplay.state.step === 'done');
check('pizza 1: sauce spread', true);
await sleep(600);
await t.shot(dir, 'g8-sauced');

// Pizza 2: scribble over everything first (too messy), then write it backwards.
await waitFor(() => window.__mathplay.state.step === 'trace' && window.__mathplay.state.pizza === 1, null, 6000);
const scribble = [];
for (let row = 0; row < 14; row++) scribble.push([row % 2 ? 900 : 500, 210 + row * 30]);
await drag(scribble, 6);
s = await state();
check('messy sauce over the whole pizza starts over', s.restarts === 1 && s.step === 'trace', JSON.stringify({ restarts: s.restarts, onNumber: s.onNumber }));
for (const stroke of [...s.guide].reverse()) await drag([...stroke].reverse());
await waitFor(() => window.__mathplay.state.step === 'spread');
check('pizza 2: any stroke order counts', true, `number ${s.number}`);
await spread();
await waitFor(() => window.__mathplay.state.step === 'results', null, 8000);
check('round recorded', (await state()).points >= 1);
await t.shot(dir, 'g9-pizza-done');

// Idle reminder.
await tap('again');
await waitFor(() => window.__mathplay.state.step === 'trace');
await sleep(5600);
check('reminder after 5 s without a touch', (await t.spoken()).at(-1).startsWith('Start at the green dot'));
await t.shot(dir, 'g10-reminder');
await tap('back');
await t.waitScene('Home');
check('back from the pizza goes Home', true);

const utter = await t.mp(() => window.__utter);
check('speech uses the natural voice', utter.length > 0 && utter.every((u) => u.voice === 'aria-natural'), utter.at(-1)?.voice);
process.exit(await t.finish());
