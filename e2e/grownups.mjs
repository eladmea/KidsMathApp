// Walkthrough: Today's Adventure from start to finish, "Play together",
// the daily time limit and its goodbye screen, and the parent dashboard
// (limits, read-aloud, report, notes, voices, CSV export).
//   node e2e/grownups.mjs <screenshotDir> <width> <height> <label>
import { PASSED, answerQuestion, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const step = (name, timeout = 8000) => waitFor((n) => window.__mathplay.state.step === n, name, timeout);
const today = new Date();
const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// Ava (7) has the game-screen skill of her band passed, so every learning
// step is a quiz. Leo (6) has used up today's 20 minutes.
await seedPlayers(
  t,
  [
    { name: 'Ava', age: 7, avatar: '🦊', dailyLimit: 0 },
    { name: 'Leo', age: 6, avatar: '🐯' },
  ],
  { Ava: { 'logic-loops': PASSED } },
  '?fast'
);
await t.mp((day) => localStorage.setItem('mathplay2:play-time', JSON.stringify({ p1: { [day]: 20 * 60 } })), dayKey);
await t.page.reload();
await t.waitScene('Profiles');
await tap('player:Ava');
await t.waitScene('WorldMap');

async function gate() {
  await waitFor(() => window.__mathplay.state.gate);
  const s = await state();
  for (const digit of String(s.gateAnswer)) await tap(`key:${digit}`);
  await tap('key:✓');
}

async function playQuiz() {
  await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step);
  if ((await state()).step === 'example') await tap('start');
  const total = (await waitFor(() => window.__mathplay.state.total).then(() => state())).total;
  for (let i = 0; i < total; i++) {
    await waitFor((n) => window.__mathplay.state.step === 'question' && window.__mathplay.state.index === n, i, 10000);
    await answerQuestion(t);
  }
  await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
  return total;
}

// ---- Today's Adventure ----
await tap('adventure');
await t.waitScene('Adventure');
await step('path');
let s = await state();
check('the adventure ends with the cool-down', s.steps.at(-1).kind === 'cooldown' && s.steps.length >= 3, s.steps.map((x) => x.kind).join(','));
await sleep(300);
await t.shot(dir, 'a1-adventure');
for (let n = 0; n < 8; n++) {
  s = await state();
  if (s.step === 'finished') break;
  const [route] = s.route;
  const current = s.current;
  await tap('go');
  await t.waitScene(route);
  if (route === 'Quiz') {
    const total = await playQuiz();
    check(`adventure ${current}: a short round of 5`, total === 5, String(total));
    await tap('map');
  } else if (route === 'BalloonBreath') {
    const box = await t.box('breathe');
    for (let b = 0; b < 5; b++) {
      await waitFor(() => window.__mathplay.state.step === 'ready', null, 15000);
      await t.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await t.page.mouse.down();
      await sleep(3300);
      await t.page.mouse.up();
    }
    await waitFor(() => window.__mathplay.state.step === 'done', null, 15000);
    await tap('done');
  } else {
    // A Fun Break game: free during the adventure.
    if (route === 'ChipToss') for (let c = 0; c < 10; c++) {
      await waitFor(() => window.__mathplay.state.step === 'play', null, 5000);
      await tap('toss');
      await waitFor((k) => window.__mathplay.state.left === 9 - k, c, 5000);
    }
    await waitFor(() => window.__mathplay.state.step === 'over', null, 20000);
    await tap('done');
  }
  await t.waitScene('Adventure');
  await waitFor((id) => ['path', 'finished'].includes(window.__mathplay.state.step) && window.__mathplay.state.done.includes(id), current, 8000);
}
s = await state();
check('every step done: adventure complete', s.step === 'finished' && s.done.length === s.steps.length);
await sleep(300);
await t.shot(dir, 'a2-adventure-done');
await tap('back');
await t.waitScene('WorldMap');
s = await state();
check('the map shows today\'s adventure as done, with its sticker', s.adventureDone && s.stickers >= 1);

// ---- Play together ----
await tap('coach');
check('play together turns on', (await state()).coaching === true);
await tap('island:math');
await t.waitScene('Island');
await tap('skill:math-add-20');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step);
if ((await state()).step === 'example') await tap('start');
await waitFor(() => window.__mathplay.state.step === 'question');
await answerQuestion(t);
await step('talk');
await t.shot(dir, 'a3-play-together');
check('after an answer, a talk prompt waits for Next', true);
await tap('coach-next');
await waitFor(() => window.__mathplay.state.step === 'question' && window.__mathplay.state.index === 1);
check('Next moves on', true);
await tap('back');
await t.waitScene('Island');

// ---- Time's up for Leo ----
await tap('back');
await t.waitScene('WorldMap');
await tap('switch-player');
await t.waitScene('Profiles');
await tap('player:Leo');
await t.waitScene('TimeUp');
check('a child out of time gets the goodbye screen', (await t.spoken()).at(-1).includes("time for a break"));
await t.shot(dir, 'a4-time-up');
await tap('more-time');
await gate();
await t.waitScene('WorldMap');
s = await state();
check('a grown-up adds 10 minutes', s.minutesLeft === 10, String(s.minutesLeft));

// ---- Parent dashboard ----
await tap('switch-player');
await t.waitScene('Profiles');
await tap('grown-ups');
await gate();
await t.waitScene('ParentDashboard');
await step('child');
s = await state();
check('the dashboard opens on the first child', s.child === 'Ava' && s.limit === 0 && s.adventures === 1, JSON.stringify({ c: s.child, l: s.limit, a: s.adventures }));
await t.shot(dir, 'a5-dashboard');
await tap('limit:30');
await waitFor(() => window.__mathplay.state.limit === 30);
check('a grown-up sets the daily limit', (await state()).allowed === 30);
await tap('narration');
await waitFor(() => window.__mathplay.state.narration === false);
check('and turns read-aloud off', true);
await tap('tab:p1');
await waitFor(() => window.__mathplay.state.child === 'Leo');
check("Leo's tab shows today's 20 minutes and the bonus", (await state()).played === 20 && (await state()).allowed === 30, JSON.stringify((await state()).allowed));

await tap('tab:p0');
await waitFor(() => window.__mathplay.state.child === 'Ava');
await tap('report');
await step('report');
s = await state();
check('the play-test report lists the skills played', s.rows.length >= 2 && s.together === 1, JSON.stringify({ rows: s.rows.length, together: s.together }));
const field = await t.page.$('input[type=text]');
await field.fill('Liked the adventure');
await tap('add-note');
await waitFor(() => window.__mathplay.state.notes && window.__mathplay.state.notes.includes('Liked the adventure'));
check('a session note is saved', true);
await t.shot(dir, 'a6-report');
const download = t.page.waitForEvent('download');
await tap('export');
const file = await download;
const csv = await (await import('fs')).promises.readFile(await file.path(), 'utf8');
check('the CSV export has every event', csv.startsWith('profile,') && csv.includes('Liked the adventure') && csv.split('\n').length > 10, String(csv.split('\n').length));
await tap('clear-log');
await tap('clear-yes');
await waitFor(() => window.__mathplay.state.step === 'report' && window.__mathplay.state.rows.length === 0);
check('the log can be cleared', true);

await tap('tab:voice');
await step('voice');
s = await state();
check('the voice tab lists the device voices', s.voices.length >= 2 && s.choice === null);
await tap('voice:2');
await waitFor(() => window.__mathplay.state.step === 'voice' && window.__mathplay.state.choice !== null);
check('a grown-up picks a voice', true);
await t.shot(dir, 'a7-voices');
process.exit(await t.finish());
