// Walkthrough: Letter Catcher on Word Woods. Runs at normal speed: the kid
// is steered under a bubble (with the arrow keys, and once with the
// on-screen arrows) and throws when lined up. One letter for ages 3-4 (with
// a wrong hit first), words for 5-6, letter pairs for 7-8.
//   node e2e/letters.mjs <screenshotDir> <width> <height> <label>
import { PASSED, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const results = () => waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 20000);

await seedPlayers(
  t,
  [{ name: 'Mia', age: 4, avatar: '🦁' }, { name: 'Leo', age: 6, avatar: '🐯' }, { name: 'Sam', age: 8, avatar: '🦊' }],
  { Mia: { 'lit-first-sound': PASSED }, Leo: { 'lit-letter-sounds': PASSED }, Sam: { 'lit-digraphs': PASSED } }
);
await t.waitScene('Profiles');

async function openSkill(player, skill) {
  if ((await t.scene()) !== 'Profiles') {
    await tap('switch-player');
    await t.waitScene('Profiles');
  }
  await tap(`player:${player}`);
  await t.waitScene('WorldMap');
  await tap('island:literacy');
  await t.waitScene('Island');
  await sleep(200);
  const status = (await state()).skills.find((x) => x.id === skill).status;
  check(`${skill} is open on Word Woods`, status === 'ready', status);
  await tap(`skill:${skill}`);
  await t.waitScene('LetterCatcher');
  await waitFor(() => window.__mathplay.state.step === 'play' && window.__mathplay.state.bubbles, null, 8000);
}

async function toMap() {
  await tap('map');
  await t.waitScene('Island');
  await tap('back');
  await t.waitScene('WorldMap');
  await tap('switch-player');
  await t.waitScene('Profiles');
}

const KID_SPEED = 420;
// Holds an arrow for long enough to move `dx` (keys, or the on-screen arrows).
async function move(dx, buttons) {
  const ms = Math.min(500, (Math.abs(dx) / KID_SPEED) * 1000);
  if (buttons) {
    const box = await t.box(dx > 0 ? 'right' : 'left');
    await t.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await t.page.mouse.down();
    await sleep(ms);
    await t.page.mouse.up();
  } else {
    const key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    await t.page.keyboard.down(key);
    await sleep(ms);
    await t.page.keyboard.up(key);
  }
}

// Lines the kid up under a bubble showing `pick(tile)` and throws. Returns
// the hit: { tile, right }.
async function aimAndThrow(pick, { buttons = false } = {}) {
  const why = { busy: 0, blocked: 0, moves: 0, throws: 0 };
  for (let tries = 0; tries < 200; tries++) {
    const s = await state();
    // The word (or round) already finished: nothing left to throw at.
    if (['word', 'results'].includes(s.step) || (await t.scene()) !== 'LetterCatcher') return { right: null };
    if (s.step !== 'play' || s.ball) {
      why.busy += 1;
      await sleep(80);
      continue;
    }
    // A bubble with nothing below it in the ball's lane (another bubble there
    // would be hit first), the lowest first; else wait for a lane to clear.
    const clear = (target) => !s.bubbles.some((b) => b !== target && Math.abs(b.x - target.x) < 110 && b.y > target.y + 40);
    const target = s.bubbles.filter((b) => pick(b.tile, s) && clear(b)).sort((a, b) => b.y - a.y)[0];
    if (!target) {
      why.blocked += 1;
      await sleep(120);
      continue;
    }
    // Lead the drift by the ball's flight time.
    const flight = (618 - 112 - target.y) / 900;
    const dx = target.x + target.speed * (flight + 0.05) - s.kidX;
    if (Math.abs(dx) > 16) {
      why.moves += 1;
      await move(dx, buttons);
      continue;
    }
    why.throws += 1;
    const before = { caught: s.caught, wrong: s.wrong };
    if (buttons) await tap('throw');
    else await t.page.keyboard.press('Space');
    await waitFor(() => !window.__mathplay.state.ball || window.__mathplay.state.step !== 'play', null, 4000);
    const after = await state();
    if (after.caught !== before.caught || after.step === 'word') return { right: true };
    if (after.wrong !== before.wrong) return { right: false };
  }
  throw new Error(`could not line up a throw ${JSON.stringify(why)} ${JSON.stringify(await state())}`);
}

// Catches the current word's letters in order, throwing until it is done
// (a throw can still hit another bubble drifting into the way).
async function catchWord(options) {
  for (let throws = 0; throws < 30; throws++) {
    const s = await state();
    if (s.step !== 'play' || s.caught >= s.tiles.length) break;
    await aimAndThrow((tile, st) => tile === st.needed, options);
  }
  await waitFor(() => window.__mathplay.state.step === 'word' || window.__mathplay.scene !== 'LetterCatcher', null, 8000);
}

async function catchRest(fromIndex) {
  const { total } = await state();
  for (let i = fromIndex; i < total; i++) {
    await waitFor((n) => window.__mathplay.state.step === 'play' && window.__mathplay.state.index === n && window.__mathplay.state.bubbles, i, 8000);
    await catchWord();
  }
}

// ---- Ages 3-4: one letter ----
await openSkill('Mia', 'lit-catch-letter');
let s = await state();
check('catch 3-4: one letter, with a picture word that starts with it', s.tiles.length === 1 && s.word.startsWith(s.tiles[0]), `${s.tiles} ${s.word}`);
await sleep(300);
await t.shot(dir, 'l1-letter');
const miss = await aimAndThrow((tile, st) => tile !== st.needed);
s = await state();
check('catch: a wrong letter bounces off and catches nothing', miss.right === false && s.caught === 0 && s.wrong === 1, JSON.stringify({ miss, caught: s.caught, wrong: s.wrong, step: s.step, lastHit: s.lastHit }));
// With the on-screen arrows and throw button this time.
await aimAndThrow((tile, st) => tile === st.needed, { buttons: true });
await waitFor(() => window.__mathplay.state.step === 'word', null, 8000);
check('catch: the on-screen arrows and throw button catch the letter', true);
check('catch: a word with a wrong hit scores nothing', (await state()).score === 0);
await catchRest(1);
await results();
s = await state();
check('catch 3-4: the round ends on Results', s.score === s.total - 1, `${s.score}/${s.total}`);
await toMap();

// ---- Ages 5-6: words, in order ----
await openSkill('Leo', 'lit-catch-word');
s = await state();
check('catch 5-6: a short word', s.tiles.length >= 2);
await aimAndThrow((tile, st) => tile === st.needed);
await sleep(200);
await t.shot(dir, 'l2-word');
await catchWord();
check('catch 5-6: letters caught in order fill the word', (await state()).score === 1);
await catchRest(1);
await results();
s = await state();
check('catch 5-6: every word caught cleanly', s.score === s.total, `${s.score}/${s.total}`);
await toMap();

// ---- Ages 7-8: letter pairs ----
await openSkill('Sam', 'lit-catch-sounds');
s = await state();
check('catch 7-8: words with a letter pair in one bubble', s.tiles.some((tile) => tile.length === 2), JSON.stringify(s.tiles));
await sleep(200);
await t.shot(dir, 'l3-pairs');
await catchRest(0);
await results();
s = await state();
check('catch 7-8: the round ends on Results', s.score === s.total, `${s.score}/${s.total}`);

process.exit(await t.finish());
