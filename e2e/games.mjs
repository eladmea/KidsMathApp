// Walkthrough: Count to 5 (the pizza and cake are in pizza.mjs).
//   node e2e/games.mjs <screenshotDir> <width> <height> <label>
import { open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;

await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }]);
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
await sleep(500);
await t.shot(dir, 'g1-home');
const view = await t.mp(() => {
  const rect = document.querySelector('canvas').getBoundingClientRect();
  return { w: rect.width, h: rect.height };
});
check('canvas fills the screen (no black bars)', Math.abs(view.w - width) < 2 && Math.abs(view.h - height) < 2, JSON.stringify(view));
check('greeting spoken (no name, so it can be recorded)', (await t.spoken()).some((line) => line === 'Hi! Pick an island to play.'));

// ---- Count to 5 ----
await tap('island:math');
await t.waitScene('Island');
await tap('skill:math-count-5');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step);
check('first play shows the worked example', (await state()).step === 'example');
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
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
const result = await state();
check('9 of 10 recorded: 3 stars, passed', result.score === 9 && result.stars === 3 && result.newlyPassed.includes('math-count-5'));
await sleep(500);
await t.shot(dir, 'g5-results');
await tap('map');
await t.waitScene('Island');

const utter = await t.mp(() => window.__utter);
check('speech uses the natural voice', utter.length > 0 && utter.every((u) => u.voice === 'aria-natural'), utter.at(-1)?.voice);
process.exit(await t.finish());
