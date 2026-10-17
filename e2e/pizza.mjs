// Walkthrough: Pizza Shop's whole flow (two pizzas) and Birthday Cake.
//   node e2e/pizza.mjs <screenshotDir> <width> <height> <label>
import { open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap, drag } = t;
const step = (name, timeout = 8000) => waitFor((n) => window.__mathplay.state.step === n, name, timeout);

await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
await tap('island:math');
await t.waitScene('Island');
await tap('skill:math-pizza');
await t.waitScene('PizzaShop');
await step('dough');

// Rubs back and forth over the pizza until `done()`.
async function rub(done, rows = 16) {
  const { pizza } = await state();
  const half = pizza.size * 0.42;
  for (let row = 0; row < rows && !(await done()); row++) {
    const y = pizza.y - half + ((row * 7) % rows) * ((2 * half) / rows);
    await drag([[pizza.x - half, y], [pizza.x + half, y]], 6);
  }
}

async function makePizza(i, { messy = false, wrongCount = false } = {}) {
  let s = await state();
  check(`pizza ${i + 1}: the order is 1 to 5 toppings`, s.number >= 1 && s.number <= 5 && s.index === i, `number ${s.number}`);
  if (i === 0) {
    await sleep(300);
    await t.shot(dir, 'p1-dough');
  }
  await rub(async () => (await state()).step !== 'dough');
  await step('trace');
  check(`pizza ${i + 1}: rubbing rolls the dough out`, (await state()).rolled === 1);
  s = await state();
  if (messy) {
    const { pizza } = s;
    const scribble = [];
    for (let row = 0; row < 14; row++) scribble.push([pizza.x + (row % 2 ? 1 : -1) * 100, pizza.y - 150 + row * 22]);
    await drag(scribble, 6);
    s = await state();
    check('messy sauce over the whole pizza starts over', s.restarts === 1 && s.hint === 'messy', JSON.stringify({ r: s.restarts, h: s.hint }));
    // Any stroke order counts: write it backwards.
    for (const stroke of [...s.guide].reverse()) await drag([...stroke].reverse(), 3);
  } else {
    if (i === 0) await t.shot(dir, 'p2-trace');
    for (const stroke of s.guide) await drag(stroke, 3);
  }
  await step('sauce');
  check(`pizza ${i + 1}: number written in sauce`, true);
  await rub(async () => (await state()).step !== 'sauce');
  await step('cheese');
  if (i === 0) await t.shot(dir, 'p3-cheese');
  await rub(async () => (await state()).step !== 'cheese');
  await step('topping');
  check(`pizza ${i + 1}: sauce and cheese spread`, true);
  if (i === 0) await t.shot(dir, 'p4-toppings');
  await tap(i === 0 ? 'topping:mushroom' : 'topping:olive');
  await step('place');
  s = await state();
  const want = s.number + (wrongCount ? 1 : 0);
  const tray = await t.box('tray');
  for (let n = 0; n < want; n++) {
    const p = await t.mp(([x, y]) => window.__mathplay.toPage(x, y), [s.pizza.x - 60 + (n % 3) * 60, s.pizza.y - 60 + Math.floor(n / 3) * 60]);
    await t.page.mouse.move(tray.x + 40, tray.y + tray.height / 2);
    await t.page.mouse.down();
    await t.page.mouse.move(p.x, p.y, { steps: 5 });
    await t.page.mouse.up();
    await sleep(100);
  }
  check(`pizza ${i + 1}: toppings dragged onto the pizza`, (await state()).placed === want, `${(await state()).placed}/${want}`);
  if (i === 0) await t.shot(dir, 'p5-placed');
  if (wrongCount) {
    await tap('done');
    s = await state();
    check('too many toppings: asked to take one off', s.checked === 'fewer' && s.step === 'place');
    await tap('take-one');
  }
  await tap('done');
  await step('oven');
  check(`pizza ${i + 1}: the count is right`, true);
  s = await state();
  await drag([[s.pizza.x, s.pizza.y], [s.pizza.x + 100, s.pizza.y + 40]], 4);
  check('dropping short of the oven puts the pizza back', (await state()).step === 'oven');
  await drag([[s.pizza.x, s.pizza.y], [s.oven.x, s.oven.y]], 8);
  await step('baking');
  if (i === 0) await t.shot(dir, 'p6-baking');
  await step('slice', 8000);
  await drag([[s.pizza.x - 20, s.pizza.y - 20], [s.pizza.x + 20, s.pizza.y]], 4);
  check('a short swipe does not cut', (await state()).cuts === 0);
  await drag([[s.pizza.x, s.pizza.y - 170], [s.pizza.x, s.pizza.y + 170]], 6);
  await drag([[s.pizza.x - 170, s.pizza.y], [s.pizza.x + 170, s.pizza.y]], 6);
  await step('feed');
  check(`pizza ${i + 1}: cut into 4 slices`, (await state()).cuts === 2);
  if (i === 0) await t.shot(dir, 'p7-slices');
  for (const [dx, dy] of [[-90, -90], [90, -90], [-90, 90], [90, 90]]) {
    await drag([[s.pizza.x + dx, s.pizza.y + dy], [s.customer.x, s.customer.y]], 8);
  }
  await step('done');
  check(`pizza ${i + 1}: all 4 slices eaten`, (await state()).eaten === 4);
  if (i === 0) await t.shot(dir, 'p8-eaten');
}

await makePizza(0, { wrongCount: true });
check('pizza 1 scores nothing (first count was wrong)', (await state()).points === 0);
await waitFor(() => window.__mathplay.state.step === 'dough' && window.__mathplay.state.index === 1, null, 8000);
await makePizza(1, { messy: true });
check('pizza 2 scores a point (one restart)', (await state()).points === 1);
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
let s = await state();
check('pizza: 1 of 2 on Results', s.score === 1 && s.total === 2, `${s.score}/${s.total}`);
await tap('again');
await t.waitScene('PizzaShop');
await step('dough');
await sleep(5600 / 8 + 400);
check('reminder after a few seconds without a touch', (await state()).reminder === 'dough' && (await t.spoken()).at(-1).startsWith('Rub the dough'));
await t.shot(dir, 'p9-reminder');
await tap('back');
await t.waitScene('Island');

// ---- Birthday Cake ----
await tap('skill:math-birthday-cake');
await t.waitScene('BirthdayCake');
async function bake(i, { mistakes = false } = {}) {
  await waitFor((n) => window.__mathplay.state.step === 'icing' && window.__mathplay.state.index === n, i, 8000);
  let s = await state();
  check(`cake ${i + 1}: an age from 1 to 5`, s.number >= 1 && s.number <= 5, `age ${s.number}`);
  if (i === 0) {
    await sleep(300);
    await t.shot(dir, 'c1-icing');
  }
  if (mistakes) {
    const stroke = s.guide[0];
    const [ex, ey] = stroke[stroke.length - 1];
    await drag([[ex, ey], [ex + 4, ey + 4]]);
    check('cake: touching away from the dot asks to start there', (await state()).hint === 'start');
    await drag(stroke.slice(0, Math.max(2, Math.floor(stroke.length / 3))));
    s = await state();
    check('cake: lifting early starts the line again', s.hint === 'almost' && s.restarts === 1);
  }
  for (const stroke of s.guide) await drag(stroke, 3);
  await step('candles');
  check(`cake ${i + 1}: age written in icing`, true);
  const want = s.number - (mistakes ? 1 : 0);
  const tray = await t.box('tray');
  for (let n = 0; n < want; n++) {
    const p = await t.mp(([x, y]) => window.__mathplay.toPage(x, y), [s.cake.x - 140 + n * 56, s.cake.y]);
    await t.page.mouse.move(tray.x + 40, tray.y + tray.height / 2);
    await t.page.mouse.down();
    await t.page.mouse.move(p.x, p.y, { steps: 5 });
    await t.page.mouse.up();
    await sleep(100);
  }
  if (mistakes) {
    await tap('done');
    check('cake: too few candles asks for more', (await state()).checked === 'more');
    const p = await t.mp(([x, y]) => window.__mathplay.toPage(x, y), [s.cake.x + 150, s.cake.y]);
    await t.page.mouse.move(tray.x + 40, tray.y + tray.height / 2);
    await t.page.mouse.down();
    await t.page.mouse.move(p.x, p.y, { steps: 5 });
    await t.page.mouse.up();
    await sleep(100);
  }
  check(`cake ${i + 1}: candles on the cake`, (await state()).candles === s.number);
  if (i === 0) await t.shot(dir, 'c2-candles');
  await tap('done');
  await step('blow');
  check(`cake ${i + 1}: all candles lit`, (await state()).lit === s.number);
  if (i === 0) await t.shot(dir, 'c3-lit');
  for (let n = 0; n < s.number; n++) await tap(`candle:${n}`);
  await step('party');
  if (i === 0) await t.shot(dir, 'c4-party');
}
await bake(0, { mistakes: true });
check('cake 1 scores nothing (first count was wrong)', (await state()).points === 0);
await bake(1);
await bake(2);
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
s = await state();
check('cake: 2 of 3 on Results', s.score === 2 && s.total === 3, `${s.score}/${s.total}`);
process.exit(await t.finish());
