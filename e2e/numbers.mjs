// Walkthrough: the Number Island block games. Block Tower for ages 3-4 (a
// wrong block falls on its own, the top block lifts off, drag and tap both
// work) and Tall Tower for ages 5-6 (a wrong block brings the whole tower
// down).
//   node e2e/numbers.mjs <screenshotDir> <width> <height> <label>
import { PASSED, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const results = () => waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 15000);

await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }, { name: 'Leo', age: 6, avatar: '🐯' }], { Mia: { 'math-more-less': PASSED }, Leo: { 'math-bigger-number': PASSED } }, '?fast');
await t.waitScene('Profiles');

async function openSkill(player, skill) {
  if ((await t.scene()) !== 'Profiles') {
    await tap('switch-player');
    await t.waitScene('Profiles');
  }
  await tap(`player:${player}`);
  await t.waitScene('WorldMap');
  await tap('island:math');
  await t.waitScene('Island');
  await sleep(200);
  const status = (await state()).skills.find((x) => x.id === skill).status;
  check(`${skill} is open on Number Island`, status === 'ready', status);
  await tap(`skill:${skill}`);
  await t.waitScene('BlockTower');
}

// Waits until the tower has `count` blocks and nothing is moving.
const settled = (count) => waitFor((n) => window.__mathplay.state.step === 'build' && window.__mathplay.state.stack.length === n, count, 8000);
const towerReady = (index) => waitFor((i) => window.__mathplay.state.step === 'build' && window.__mathplay.state.tower === i && window.__mathplay.state.stack.length === 0, index, 8000);

// Taps the blocks still in the tray from the biggest down.
async function buildRest() {
  const s = await state();
  const left = s.blocks.filter((b) => b.place === 'tray').sort((a, b) => b.length - a.length);
  let count = s.stack.length;
  for (const block of left) {
    await tap(`block:${block.id}`);
    count += 1;
    if (count < s.blocks.length) await settled(count);
  }
  await waitFor(() => window.__mathplay.state.step === 'done', null, 8000);
}

// Plays a tower that starts biggest, smallest, then a middle one: wrong.
async function wrongMove() {
  const s = await state();
  const sorted = [...s.blocks].sort((a, b) => b.length - a.length);
  await tap(`block:${sorted[0].id}`);
  await settled(1);
  await tap(`block:${sorted[sorted.length - 1].id}`);
  await settled(2);
  await tap(`block:${sorted[1].id}`);
  await waitFor(() => window.__mathplay.state.step === 'wrong', null, 8000);
  await sleep(60);
  await t.shot(dir, `n-${s.level}-falling`);
  await waitFor(() => window.__mathplay.state.step === 'build', null, 8000);
  return { sorted, after: await state() };
}

// ---- Block Tower (ages 3-4) ----
await openSkill('Mia', 'math-block-tower');
await towerReady(0);
await sleep(200);
await t.shot(dir, 'n1-tower-start');
let { sorted, after } = await wrongMove();
check('tower 3-4: a block on a smaller one falls on its own', JSON.stringify(after.stack) === JSON.stringify([sorted[0].length, sorted[sorted.length - 1].length]), JSON.stringify(after.stack));
// Lift the small one off the top, then finish biggest-first.
await tap(`block:${sorted[sorted.length - 1].id}`);
await settled(1);
check('tower 3-4: the top block lifts off again', (await state()).stack.length === 1);
await buildRest();
check('tower 3-4: a tower with a fall scores nothing', (await state()).score === 0);

// Tower 2: drag the biggest block onto the tower instead of tapping.
await towerReady(1);
let s = await state();
const biggest = [...s.blocks].sort((a, b) => b.length - a.length)[0];
const from = await t.box(`block:${biggest.id}`);
const to = await t.mp(({ x, y }) => window.__mathplay.toPage(x, y), s.drop);
await t.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
await t.page.mouse.down();
await t.page.mouse.move(to.x, to.y, { steps: 8 });
await t.page.mouse.up();
await settled(1);
check('tower 3-4: a block can be dragged onto the tower', (await state()).stack[0] === biggest.length);
await buildRest();
check('tower 3-4: a clean tower scores', (await state()).score === 1);
await t.shot(dir, 'n2-tower-done');
for (let i = 2; i < s.total; i++) {
  await towerReady(i);
  await buildRest();
}
await results();
s = await state();
check('tower 3-4: the round ends on Results', s.score === s.total - 1, `${s.score}/${s.total}`);
await tap('map');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');

// ---- Tall Tower (ages 5-6) ----
await openSkill('Leo', 'math-block-tower-10');
await towerReady(0);
await sleep(200);
await t.shot(dir, 'n3-tall-start');
s = await state();
check('tall tower: blocks up to 10, 4 or more of them', s.blocks.length >= 4 && s.blocks.every((b) => b.length <= 10));
({ after } = await wrongMove());
check('tall tower: a wrong block brings the whole tower down', after.stack.length === 0 && after.blocks.every((b) => b.place === 'tray'), JSON.stringify(after.stack));
await buildRest();
for (let i = 1; i < s.total; i++) {
  await towerReady(i);
  await buildRest();
}
await results();
s = await state();
check('tall tower: the round ends on Results', s.score === s.total - 1, `${s.score}/${s.total}`);

process.exit(await t.finish());
