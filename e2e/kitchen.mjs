// Walkthrough: Kitchen Cove. A 4-year-old makes the smoothie (the right tool
// handed over, measuring stops by itself); an 8-year-old makes the muffins
// (picks tools, taps ✓, sets the oven timer); a 10-year-old builds burgers.
//   node e2e/kitchen.mjs <screenshotDir> <width> <height> <label>
import { open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap, drag, page } = t;
const station = (name, timeout = 10000) => waitFor((n) => window.__mathplay.state.station === n, name, timeout);

// Rubs back and forth over a tagged object until the station moves on.
async function rub(name, until) {
  for (let i = 0; i < 40 && !(await until()); i++) {
    const box = await t.box(name);
    if (!box) return;
    const y = box.y + box.height / 2 + ((i % 3) - 1) * 20;
    await page.mouse.move(box.x + 5, y);
    await page.mouse.down();
    for (let k = 0; k < 4; k++) {
      await page.mouse.move(box.x + box.width - 5, y, { steps: 5 });
      await page.mouse.move(box.x + 5, y, { steps: 5 });
    }
    await page.mouse.up();
    await sleep(80);
  }
}

async function gather({ wrong = false } = {}) {
  await station('gather');
  await tap('fridge');
  await tap('cupboard');
  await sleep(300);
  const s = await state();
  if (wrong) {
    const names = await t.mp(() => window.__mathplay.names());
    const extra = names.find((n) => n.startsWith('item:') && !s.shopping.some(({ key }) => `item:${key}` === n));
    await tap(extra);
    check('kitchen: something not in the recipe goes back', (await state()).mistakes.gather === 1 && !(await state()).counter[extra.slice(5)], extra);
  }
  for (const { key, count } of s.shopping) for (let i = 0; i < count; i++) await tap(`item:${key}`);
  if (wrong) {
    const counted = s.shopping.find(({ count }) => count > 1);
    if (counted) {
      await tap(`item:${counted.key}`).catch(() => {});
    }
  }
  await station('measure');
  const after = await state();
  check('kitchen: everything on the recipe is on the counter', s.shopping.every(({ key, count }) => after.counter[key] === count), JSON.stringify(after.counter));
}

async function measureAll({ picks, mistake = false }) {
  let wrongDone = !mistake;
  for (let n = 0; n < 12; n++) {
    await sleep(200);
    const s = await state();
    if (s.station !== 'measure') break;
    if (!s.measuring) continue;
    const { key, best, valid, tools } = s.measuring;
    if (!picks) {
      check(`kitchen: a younger child is handed the right tool for ${key}`, tools.length === 1 && tools[0] === best, tools.join());
    } else if (!wrongDone) {
      const wrongTool = tools.find((tool) => !valid.includes(tool));
      await tap(`tool:${wrongTool}`);
      check(`kitchen: the wrong tool for ${key} doesn't measure it`, (await state()).measuring.amount === 0 && (await state()).mistakes.measure === 1, wrongTool);
      wrongDone = true;
    }
    for (let i = 0; i < 30; i++) {
      const now = await state();
      if (!now.measuring || now.measuring.key !== key || now.measuring.status === 'right') break;
      await tap(`tool:${best}`);
    }
    if (picks) {
      const now = await state();
      check(`kitchen: ${key} measured to the amount`, now.measuring && now.measuring.status === 'right', JSON.stringify(now.measuring));
      await tap('measure-done');
    }
    await waitFor((k) => !window.__mathplay.state.measuring || window.__mathplay.state.measuring.key !== k, key, 6000).catch(() => {});
  }
  await station('prep');
}

async function prepAll() {
  for (let n = 0; n < 8; n++) {
    await sleep(250);
    const s = await state();
    if (s.station !== 'prep' || !s.prep) break;
    const index = s.prep.index;
    if (s.prep.kind === 'tap') {
      for (let i = 0; i < 14; i++) {
        const now = await state();
        if (now.station !== 'prep' || !now.prep || now.prep.index !== index) break;
        await tap('prep-target');
      }
    } else {
      await rub('prep-target', async () => {
        const now = await state();
        return now.station !== 'prep' || !now.prep || now.prep.index !== index;
      });
    }
    await waitFor((i) => !window.__mathplay.state.prep || window.__mathplay.state.prep.index !== i || window.__mathplay.state.station !== 'prep', index, 6000).catch(() => {});
  }
  await station('cook');
  check('kitchen: every prep step done', true);
}

async function clean() {
  await station('clean', 15000);
  await sleep(400);
  const s = await state();
  const { job } = s.cleanup;
  if (job === 'putAway') {
    for (const { key, kept } of s.cleanup.items) {
      await tap(`leftover:${key}`);
      await tap(kept);
    }
  } else if (job === 'dishes') {
    for (const { key } of s.cleanup.items) await tap(`dish:${key}`);
  } else {
    for (const { x, y } of s.cleanup.items) await drag([[x - 30, y], [x + 30, y]], 3);
  }
  await waitFor(() => window.__mathplay.state.cleanup.done, null, 6000);
  check(`kitchen: the clean-up job (${job}) is done`, true);
}

async function decorate() {
  await station('serve', 20000);
  await sleep(500);
  const s = await state();
  const tray = await t.box('tray');
  for (let i = 0; i < s.serve.count; i++) {
    const names = await t.mp(() => window.__mathplay.names().filter((n) => n.startsWith('plate:')));
    const plate = await t.box(names[i % names.length]);
    await page.mouse.move(tray.x + 30, tray.y + tray.height / 2);
    await page.mouse.down();
    await page.mouse.move(plate.x + plate.width / 2, plate.y + plate.height / 2, { steps: 6 });
    await page.mouse.up();
    await sleep(150);
  }
  await waitFor(() => window.__mathplay.state.done === true, null, 6000);
  check('kitchen: decorated and served', (await state()).serve.placed === s.serve.count);
}

async function openRecipe(skill) {
  await t.waitScene('WorldMap');
  const map = await state();
  check('kitchen: the map has six islands, Kitchen Cove among them', map.islands.length === 6 && map.islands.some((i) => i.subject === 'kitchen'));
  await tap('island:kitchen');
  await t.waitScene('Island');
  const island = await state();
  check('kitchen: every recipe is open at any age', island.skills.length === 5 && island.skills.every((s) => s.status === 'ready'), JSON.stringify(island.skills.map((s) => s.status)));
  const pills = await t.mp(() => window.__mathplay.names().filter((n) => n.startsWith('band:')));
  check('kitchen: an open island has no age pills', pills.length === 0, pills.join());
  await tap(`skill:${skill}`);
  await t.waitScene('Kitchen');
}

// ---- 1. a 4-year-old makes the smoothie ----
await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }, { name: 'Ben', age: 8, avatar: '🐯' }, { name: 'Noa', age: 10, avatar: '🐼' }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:Mia');
await openRecipe('kitchen-smoothie');
await station('wash');
check('kitchen: sprouts level', (await state()).level === 'sprouts');
await t.shot(dir, 'k1-wash');
await rub('hands', async () => (await state()).station !== 'wash');
await gather({ wrong: true });
await t.shot(dir, 'k2-measure');
await measureAll({ picks: false });
await prepAll();
await t.shot(dir, 'k3-cook');
// The blender: hold the button down.
const hold = await t.box('blender-hold');
await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
await page.mouse.down();
await station('clean', 8000).catch(() => {});
await page.mouse.up();
await clean();
await decorate();
await t.shot(dir, 'k4-served');
await t.waitScene('Results', 10000);
let results = await state();
check('kitchen: the round ends on Results with points out of 4', results.total === 4 && results.score >= 3, JSON.stringify({ s: results.score, t: results.total }));

// ---- 2. an 8-year-old makes the muffins ----
await seedPlayers(t, [{ name: 'Ben', age: 8, avatar: '🐯' }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:Ben');
await openRecipe('kitchen-muffins');
await station('wash');
check('kitchen: builders level', (await state()).level === 'builders');
await rub('hands', async () => (await state()).station !== 'wash');
await gather();
await sleep(900);
await t.shot(dir, 'k5a-jug');
await measureAll({ picks: true, mistake: true });
await t.shot(dir, 'k5-muffin-prep');
await prepAll();
let s = await state();
await tap('timer-start');
check('kitchen: the oven waits for the right time', !(await state()).cook.cooking);
for (let i = 0; i < 12 && (await state()).cook.set < s.cook.minutes; i++) await tap('timer-plus');
check('kitchen: timer set to the recipe’s minutes', (await state()).cook.set === s.cook.minutes, `${(await state()).cook.set}/${s.cook.minutes}`);
await tap('timer-start');
await t.shot(dir, 'k6-oven');
await clean();
await decorate();
await t.waitScene('Results', 10000);
results = await state();
check('kitchen: muffins scored (a measuring mistake costs that point)', results.total === 4 && results.score === 3, `${results.score}`);

// ---- 3. a 10-year-old builds burgers ----
await seedPlayers(t, [{ name: 'Noa', age: 10, avatar: '🐼' }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:Noa');
await openRecipe('kitchen-burgers');
await station('wash');
check('kitchen: masters level, only the quarter cup', (await state()).level === 'masters');
s = await state();
check('kitchen: the oldest double the recipe (2 eggs, 4 garlic cloves)', s.factor === 2 && s.shopping.find((i) => i.key === 'egg').count === 2 && s.shopping.find((i) => i.key === 'garlic').count === 4, JSON.stringify(s.shopping));
await rub('hands', async () => (await state()).station !== 'wash');
await gather();
await measureAll({ picks: true });
await prepAll();
s = await state();
for (let i = 0; i < 20 && (await state()).cook.set < s.cook.minutes; i++) await tap('timer-plus');
await tap('timer-start');
await clean();
await station('serve', 20000);
await sleep(400);
await tap('layer:🥩');
check('kitchen: a burger is built in order', (await state()).mistakes.serve === 1);
for (const layer of ['🍞', '🥬', '🥩', '🍅', '🍞']) await tap(`layer:${layer}`);
await waitFor(() => window.__mathplay.state.done === true, null, 6000);
await t.shot(dir, 'k7-burger');
await t.waitScene('Results', 10000);
results = await state();
check('kitchen: burgers scored', results.total === 4 && results.score === 3, `${results.score}`);

// ---- 4. the timer, clean-up and decorating of any other recipe ----
async function timer() {
  const s = await state();
  for (let i = 0; i < 25 && (await state()).cook.set < s.cook.minutes; i++) await tap('timer-plus');
  await tap('timer-start');
}

// A Hebrew-speaking 6-year-old bakes the omelette: ten tomato halves on one plate.
await seedPlayers(t, [{ name: 'נועה', age: 6, avatar: '🦊', language: 'he' }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:נועה');
await openRecipe('kitchen-omelette');
await station('wash');
const hebrew = await t.mp(() => window.__mathplay.spoken.slice(-3).join(' '));
check('kitchen: the cook hears Hebrew', /[א-ת]/.test(hebrew), hebrew);
await rub('hands', async () => (await state()).station !== 'wash');
await gather();
await t.shot(dir, 'k8-omelette-measure');
await measureAll({ picks: true });
await prepAll();
await timer();
await clean();
await decorate();
await t.shot(dir, 'k9-omelette');
await t.waitScene('Results', 10000);
check('kitchen: omelette scored', (await state()).score === 4, `${(await state()).score}`);

// A 5-year-old rolls hot dogs: each roll gets a sausage.
await seedPlayers(t, [{ name: 'Tom', age: 5, avatar: '🐶' }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:Tom');
await openRecipe('kitchen-hotdogs');
await station('wash');
await rub('hands', async () => (await state()).station !== 'wash');
await gather();
await measureAll({ picks: true });
await prepAll();
await timer();
await clean();
await decorate();
await t.shot(dir, 'k10-hotdogs');
await t.waitScene('Results', 10000);
check('kitchen: hot dogs scored', (await state()).score === 4, `${(await state()).score}`);

process.exit(await t.finish());
