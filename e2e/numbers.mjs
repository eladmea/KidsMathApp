// Walkthrough: the Number Island block games. Block Tower for ages 3-4 (a
// wrong block falls on its own, the top block lifts off, drag and tap both
// work) and Tall Tower for ages 5-6 (a wrong block brings the whole tower
// down). Balance Scale for ages 7-8 (sums; too heavy, take blocks back,
// drag) and 9-10 (equal groups, a missing block). Number Pairs alone on the
// island (a miss, a memory slip, number words) and from the Games list against
// a friend and the buddy.
//   node e2e/numbers.mjs <screenshotDir> <width> <height> <label>
import { PASSED, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const results = () => waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 15000);

await seedPlayers(
  t,
  [{ name: 'Mia', age: 4, avatar: '🦁' }, { name: 'Leo', age: 6, avatar: '🐯' }, { name: 'Sam', age: 8, avatar: '🦊' }, { name: 'Ada', age: 10, avatar: '🦉' }],
  { Mia: { 'math-more-less': PASSED, 'math-count-5': PASSED }, Leo: { 'math-bigger-number': PASSED }, Sam: { 'math-add-20': PASSED }, Ada: { 'math-mult-10': PASSED } },
  '?fast'
);
await t.waitScene('Profiles');

async function openSkill(player, skill, scene = 'BlockTower') {
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
  await t.waitScene(scene);
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

await tap('map');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');

// ---- Balance Scale ----
const onRight = (count) => waitFor((n) => window.__mathplay.state.right.length === n, count, 8000);
const puzzleReady = (index) => waitFor((i) => window.__mathplay.state.step === 'play' && window.__mathplay.state.puzzle === i, index, 8000);

// Taps the answer's blocks onto the right pan.
async function balance() {
  const s = await state();
  const used = new Set();
  let count = s.right.length;
  for (const weight of s.answer) {
    const block = s.tray.find((b) => b.weight === weight && b.place === 'tray' && !used.has(b.id));
    used.add(block.id);
    await tap(`weight:${block.id}`);
    count += 1;
    await onRight(count);
  }
  await waitFor(() => window.__mathplay.state.step === 'solved', null, 8000);
}

async function playScale(player, skill) {
  await openSkill(player, skill, 'BalanceScale');
  await puzzleReady(0);
  await sleep(300);
  await t.shot(dir, `n-${skill}-start`);
  let s = await state();
  // Blocks on the right pan until it is too heavy (skipping any block that
  // would balance it exactly).
  const goal = s.left.reduce((a, b) => a + b, 0);
  let sum = s.right.reduce((a, b) => a + b, 0);
  const placed = [];
  for (const block of s.tray) {
    if (sum + block.weight === goal) continue;
    await tap(`weight:${block.id}`);
    placed.push(block.id);
    sum += block.weight;
    await waitFor((n) => window.__mathplay.state.right.reduce((a, b) => a + b, 0) === n, sum, 8000);
    if (sum > goal) break;
  }
  await waitFor(() => window.__mathplay.state.step === 'heavy', null, 8000);
  await sleep(300);
  await t.shot(dir, `n-${skill}-heavy`);
  s = await state();
  check(`${skill}: a pan heavier than the other side says so`, s.right.reduce((a, b) => a + b, 0) > s.left.reduce((a, b) => a + b, 0));
  // Take them back off, newest first: that only passes through states
  // already seen, none of them level.
  for (const id of placed.reverse()) await tap(`weight:${id}`);
  await waitFor(() => window.__mathplay.state.tray.every((b) => b.place === 'tray'), null, 8000);
  check(`${skill}: blocks tap back off the pan`, true);
  await balance();
  s = await state();
  check(`${skill}: balancing after too heavy scores nothing`, s.score === 0, JSON.stringify({ score: s.score, step: s.step, left: s.left, right: s.right, puzzle: s.puzzle }));
  // Puzzle 2: drag the first answer block onto the pan.
  await puzzleReady(1);
  s = await state();
  const first = s.tray.find((b) => b.weight === s.answer[0]);
  const from = await t.box(`weight:${first.id}`);
  const to = await t.mp(({ x, y }) => window.__mathplay.toPage(x, y), s.drop);
  await t.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await t.page.mouse.down();
  await t.page.mouse.move(to.x, to.y, { steps: 8 });
  await t.page.mouse.up();
  await onRight(s.right.length + 1);
  check(`${skill}: a block can be dragged onto the pan`, (await state()).right.includes(first.weight));
  await waitFor(() => ['play', 'solved'].includes(window.__mathplay.state.step), null, 8000);
  if ((await state()).step !== 'solved') {
    // The rest of the answer, by tapping.
    const rest = { ...(await state()) };
    const used = new Set([first.id]);
    let count = rest.right.length;
    for (const weight of rest.answer.slice(1)) {
      const block = rest.tray.find((b) => b.weight === weight && b.place === 'tray' && !used.has(b.id));
      used.add(block.id);
      await tap(`weight:${block.id}`);
      count += 1;
      await onRight(count);
    }
    await waitFor(() => window.__mathplay.state.step === 'solved', null, 8000);
  }
  await sleep(150);
  await t.shot(dir, `n-${skill}-balanced`);
  s = await state();
  for (let i = 2; i < s.total; i++) {
    await puzzleReady(i);
    if (i === s.total - 1) {
      await sleep(300);
      await t.shot(dir, `n-${skill}-last`);
    }
    await balance();
  }
  await results();
  s = await state();
  check(`${skill}: the round ends on Results`, s.score === s.total - 1, `${s.score}/${s.total}`);
  await tap('map');
  await t.waitScene('Island');
  await tap('back');
  await t.waitScene('WorldMap');
}

await playScale('Sam', 'math-balance');
await playScale('Ada', 'math-balance-times');

// ---- Number Pairs ----
const turnReady = () => waitFor(() => window.__mathplay.scene !== 'NumberPairs' || ['play', 'buddy', 'over', 'done'].includes(window.__mathplay.state.step), null, 15000);
const partnerOf = (s, card) => s.cards.find((c) => c.id !== card.id && c.value === card.value);

// Turns over two cards and waits for the answer (and the next turn).
async function flip(a, b) {
  await tap(`card:${a}`);
  await tap(`card:${b}`);
  await waitFor(() => ['pair', 'miss'].includes(window.__mathplay.state.step), null, 8000);
  const result = (await state()).step;
  await turnReady();
  return result;
}

// Finds every pair still face down (whenever it is the child's turn).
async function findAll() {
  for (let guard = 0; guard < 40; guard++) {
    await turnReady();
    const s = await state();
    // The game is over, or already showing Results.
    if (['over', 'done'].includes(s.step) || !s.cards || (await t.scene()) !== 'NumberPairs') return;
    if (s.step === 'buddy') {
      await waitFor(() => window.__mathplay.state.step !== 'buddy', null, 15000);
      continue;
    }
    const card = s.cards.find((c) => c.status === 'hidden');
    await flip(card.id, partnerOf(s, card).id);
  }
}

// Alone on the island (ages 3-4): one miss, then one slip, then the rest.
await openSkill('Mia', 'math-pairs', 'NumberPairs');
await waitFor(() => window.__mathplay.state.step === 'peek', null, 8000);
await sleep(60);
await t.shot(dir, 'n-pairs-peek');
await waitFor(() => window.__mathplay.state.step === 'play', null, 8000);
s = await state();
check('pairs 3-4: 4 pairs of dots and numerals', s.total === 4 && s.cards.every((c) => ['dots', 'numeral'].includes(c.face)));
const [a] = s.cards;
const b = s.cards.find((c) => c.value !== a.value);
check('pairs: two different numbers are a miss', (await flip(a.id, b.id)) === 'miss');
await waitFor(() => window.__mathplay.state.cards.every((c) => c.status === 'hidden'), null, 8000);
check('pairs: a miss turns both cards back over', true);
// b's partner was never seen, but its own partner (b) was: picking it and
// then not b is a slip.
const slipFirst = partnerOf(s, b);
const slipSecond = s.cards.find((c) => c.id !== b.id && c.id !== slipFirst.id && c.value !== slipFirst.value);
await flip(slipFirst.id, slipSecond.id);
check('pairs: missing a partner already seen is a slip', (await state()).slips === 1, String((await state()).slips));
await findAll();
await results();
s = await state();
check('pairs 3-4: the slip costs one point', s.score === s.total - 1, `${s.score}/${s.total}`);
await tap('map');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');

// Number words (ages 7-8): no head start.
await openSkill('Sam', 'math-pairs-words', 'NumberPairs');
await waitFor(() => window.__mathplay.state.step === 'play', null, 8000);
s = await state();
check('pairs 7-8: numerals and words, 8 pairs', s.total === 8 && s.cards.some((c) => c.face === 'word'));
const word = s.cards.find((c) => c.face === 'word');
await tap(`card:${word.id}`);
await sleep(300);
await t.shot(dir, 'n-pairs-words');
await tap(`card:${partnerOf(s, word).id}`);
await turnReady();
await findAll();
await results();
s = await state();
check('pairs 7-8: every pair found, full marks', s.score === s.total, `${s.score}/${s.total}`);
await tap('map');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');

// From the Games list: with a friend, then with the buddy.
async function openPairsGame(mode) {
  await tap('games');
  await t.waitScene('Games');
  await tap('game:number-pairs');
  await t.waitScene('GameSetup');
  await tap(`mode:${mode}`);
  await waitFor((m) => window.__mathplay.state.mode === m, mode);
  await tap('start');
  await t.waitScene('NumberPairs');
}
await openPairsGame('duo');
await waitFor(() => window.__mathplay.state.step === 'play', null, 8000);
s = await state();
check('pairs with a friend: player 1 starts', s.versus && s.turn === 1);
const x = s.cards[0];
const y = s.cards.find((c) => c.value !== x.value);
await flip(x.id, y.id);
check('pairs with a friend: a miss passes the turn', (await state()).turn === 2);
await findAll();
await waitFor(() => window.__mathplay.state.step === 'over', null, 8000);
s = await state();
await sleep(300);
await t.shot(dir, 'n-pairs-duo-over');
check('pairs with a friend: player 2 found every pair and wins', s.winner === 2 && s.pairs[2] === s.total, JSON.stringify(s.pairs));
await tap('map');
await t.waitScene('GameSetup');
await tap('back');
await t.waitScene('Games');
await tap('back');
await t.waitScene('WorldMap');

await openPairsGame('solo');
await waitFor(() => window.__mathplay.state.step === 'play', null, 8000);
s = await state();
const m1 = s.cards[0];
const m2 = s.cards.find((c) => c.value !== m1.value);
await tap(`card:${m1.id}`);
await tap(`card:${m2.id}`);
await waitFor(() => window.__mathplay.state.step === 'buddy', null, 8000);
check('pairs with the buddy: a miss gives the buddy a turn', (await state()).turn === 2);
await waitFor(() => window.__mathplay.state.up && window.__mathplay.state.up.length === 2 && window.__mathplay.state.turn === 2, null, 8000);
await sleep(150);
await t.shot(dir, 'n-pairs-buddy');
check('pairs with the buddy: the buddy turns over two cards by itself', true);
await findAll();
await waitFor(() => window.__mathplay.state.step === 'over', null, 15000);
s = await state();
check('pairs with the buddy: the game ends with every pair found', s.found === s.total && s.pairs[1] + s.pairs[2] === s.total, JSON.stringify(s.pairs));

process.exit(await t.finish());
