// Walkthrough: Letter Catcher on Word Woods. Runs at normal speed: the kid
// is steered under a bubble (with the arrow keys, and once with the
// on-screen arrows) and throws when lined up. One letter for ages 3-4 (with
// a wrong hit first), words for 5-6, letter pairs for 7-8. Block Fit with
// letters for 5-6, and for 7-8 with blocks to turn.
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

// The bottom row's y (LetterCatcherScene BUBBLE.rows), less its bobbing.
const BOTTOM_ROW = 462 - 20;
// Where bubbles turn back (BUBBLE.min / max), and how close two in a row
// get before they bump (BUBBLE.radius * 2 + 8).
const [BUBBLE_MIN, BUBBLE_MAX, BUBBLE_GAP] = [380, 1060, 84];

// Lines the kid up under a bubble showing `pick(tile)` and throws. Returns
// the hit: { tile, right }. `bottom`: only at a bubble in the bottom row.
// The game moves the needed letter there (half a second), where nothing is
// in its way; thrown at earlier, on a slow machine another bubble can drift
// into the ball's path.
async function aimAndThrow(pick, { buttons = false, bottom = false } = {}) {
  const why = { busy: 0, blocked: 0, moves: 0, throws: 0 };
  for (let tries = 0; tries < 200; tries++) {
    // Aim from a report made after this moment: one read straight after a
    // hit, or while the kid was still moving, shows bubbles where they were
    // (or a letter already caught), and the ball flies past into another.
    const seen = (await state()).reports || 0;
    await waitFor((n) => (window.__mathplay.state.reports || 0) > n || window.__mathplay.state.step !== 'play' || window.__mathplay.scene !== 'LetterCatcher', seen, 2000).catch(() => {});
    const s = await state();
    // The word (or round) already finished: nothing left to throw at.
    if (['word', 'results'].includes(s.step) || (await t.scene()) !== 'LetterCatcher') return { right: null };
    if (s.step !== 'play' || s.ball) {
      why.busy += 1;
      await sleep(80);
      continue;
    }
    // Where the ball will be thrown at a bubble: ahead of it by its drift
    // during the ball's flight.
    const aim = (b) => b.x + b.speed * ((618 - 112 - b.y) / 900 + 0.05);
    // A bubble whose lane stays clear: no other bubble below it is (or drifts,
    // while the ball flies up to it) in the way, allowing for a slow machine
    // taking a moment to throw. The lowest first; else wait for a lane to clear.
    const inWay = (b, x) => [0, 0.15, 0.3].some((lag) => Math.abs(b.x + b.speed * ((618 - 112 - b.y) / 900 + lag) - x) < 110);
    const clear = (target) => !s.bubbles.some((b) => b !== target && b.y > target.y + 40 && inWay(b, aim(target)));
    // And one that won't bounce (off a wall, or a bubble in its row that it
    // is closing in on) before the ball arrives: a bounce sends it the other
    // way, the ball misses, and flies on into a bubble higher up. The time
    // allows for a slow machine.
    const steady = (b) => {
      const time = (618 - 112 - b.y) / 900 + 0.4;
      const ahead = b.x + b.speed * time;
      if (ahead < BUBBLE_MIN + 8 || ahead > BUBBLE_MAX - 8) return false;
      return !s.bubbles.some((o) => o !== b && Math.abs(o.y - b.y) < 30 && Math.abs(o.x + o.speed * time - ahead) < BUBBLE_GAP + 8);
    };
    const target = s.bubbles.filter((b) => pick(b.tile, s) && clear(b) && steady(b) && (!bottom || b.y >= BOTTOM_ROW)).sort((a, b) => b.y - a.y)[0];
    if (!target) {
      why.blocked += 1;
      await sleep(120);
      continue;
    }
    const dx = aim(target) - s.kidX;
    if (Math.abs(dx) > 16) {
      why.moves += 1;
      await move(dx, buttons);
      // The game reports where the kid is every 80 ms or so: wait for a report
      // made after the arrow was let go, or the throw is aimed from a stale
      // spot (up to ~35 px off) and the ball misses the letter.
      await sleep(150);
      continue;
    }
    why.throws += 1;
    const before = { caught: s.caught, wrong: s.wrong };
    if (buttons) await tap('throw');
    else await t.page.keyboard.press('Space');
    // On a busy machine the ball can leave a frame or two after the press:
    // wait for it (or its hit) first, or the next try throws a second ball.
    await waitFor((b) => {
      const now = window.__mathplay.state;
      return Boolean(now.ball) || now.caught !== b.caught || now.wrong !== b.wrong || now.step !== 'play';
    }, before, 1500).catch(() => {});
    await waitFor(() => !window.__mathplay.state.ball || window.__mathplay.state.step !== 'play', null, 4000);
    const after = await state();
    if (after.caught !== before.caught || after.step === 'word') return { right: true };
    if (after.wrong !== before.wrong) return { right: false };
  }
  throw new Error(`could not line up a throw ${JSON.stringify(why)} ${JSON.stringify(await state())}`);
}

// Words in this round where the walkthrough's own throw hit a wrong bubble
// that drifted into the way (on a slow machine): those words rightly score
// nothing, so the round's score is checked against the clean ones.
const strayWords = new Set();
const strayIn = async (hit) => {
  if (hit.right === false) strayWords.add((await state()).index);
};

// Catches the current word's letters in order, throwing until it is done
// (a throw can still hit another bubble drifting into the way).
async function catchWord(options) {
  for (let throws = 0; throws < 30; throws++) {
    const s = await state();
    if (s.step !== 'play' || s.caught >= s.tiles.length) break;
    await strayIn(await aimAndThrow((tile, st) => tile === st.needed, { ...options, bottom: true }));
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

let s;
// ---- Ages 3-4: one letter ----
await openSkill('Mia', 'lit-catch-letter');
s = await state();
check('catch 3-4: one letter, with a picture word that starts with it', s.tiles.length === 1 && s.word.startsWith(s.tiles[0]), `${s.tiles} ${s.word}`);
await sleep(300);
await t.shot(dir, 'l1-letter');
const miss = await aimAndThrow((tile, st) => tile !== st.needed);
s = await state();
check('catch: a wrong letter bounces off and catches nothing', miss.right === false && s.caught === 0 && s.wrong === 1, JSON.stringify({ miss, caught: s.caught, wrong: s.wrong, step: s.step, lastHit: s.lastHit }));
// With the on-screen arrows and throw button this time.
await aimAndThrow((tile, st) => tile === st.needed, { buttons: true, bottom: true });
await waitFor(() => window.__mathplay.state.step === 'word', null, 8000);
check('catch: the on-screen arrows and throw button catch the letter', true);
check('catch: a word with a wrong hit scores nothing', (await state()).score === 0);
strayWords.clear();
await catchRest(1);
await results();
s = await state();
check('catch 3-4: the round ends on Results', s.score === s.total - 1 - strayWords.size && strayWords.size <= 2, `${s.score}/${s.total}, stray in words ${[...strayWords]}`);
await toMap();

// ---- Ages 5-6: words, in order ----
await openSkill('Leo', 'lit-catch-word');
strayWords.clear();
s = await state();
check('catch 5-6: a short word', s.tiles.length >= 2);
await strayIn(await aimAndThrow((tile, st) => tile === st.needed));
await sleep(200);
await t.shot(dir, 'l2-word');
await catchWord();
check('catch 5-6: letters caught in order fill the word', (await state()).score === 1 - strayWords.size, `strays ${[...strayWords]}`);
await catchRest(1);
await results();
s = await state();
check('catch 5-6: every word caught cleanly scores', s.score === s.total - strayWords.size && strayWords.size <= 2, `${s.score}/${s.total}, stray in words ${[...strayWords]}`);
await toMap();

// ---- Ages 7-8: letter pairs ----
await openSkill('Sam', 'lit-catch-sounds');
strayWords.clear();
s = await state();
check('catch 7-8: words with a letter pair in one bubble', s.tiles.some((tile) => tile.length === 2), JSON.stringify(s.tiles));
await sleep(200);
await t.shot(dir, 'l3-pairs');
await catchRest(0);
await results();
s = await state();
check('catch 7-8: the round ends on Results, clean words scored', s.score === s.total - strayWords.size && strayWords.size <= 2, `${s.score}/${s.total}, stray in words ${[...strayWords]}`);

// ---- Block Fit helpers ----
// Drags a piece by its middle to a point in game coordinates.
async function dragPiece(id, to) {
  const from = await t.box(`piece:${id}`);
  const p = await t.mp(({ x, y }) => window.__mathplay.toPage(x, y), to);
  await t.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await t.page.mouse.down();
  await t.page.mouse.move(p.x, p.y, { steps: 8 });
  await t.page.mouse.up();
  await sleep(120);
}

// Fills the shape: turns each piece back the way it was cut, then drags it
// to where it goes.
async function fillShape() {
  const shape = (await state()).index;
  // Still on this shape, and not filled yet?
  const playing = () => state().then((s) => s.step === 'play' && s.index === shape);
  for (let guard = 0; guard < 20; guard++) {
    const s = await state();
    if (!(await playing())) break;
    const piece = s.pieces.find((p) => !p.placed);
    if (!piece) break;
    for (let k = piece.turns; k % 4 !== 0; k++) {
      await tap(`piece:${piece.id}`);
      await waitFor(([id, n]) => window.__mathplay.state.pieces.find((p) => p.id === id).turns === n, [piece.id, (k + 1) % 4], 4000);
    }
    await sleep(250);
    await dragPiece(piece.id, piece.target);
    await waitFor(([id, n]) => window.__mathplay.state.step !== 'play' || window.__mathplay.state.index !== n || window.__mathplay.state.pieces.find((p) => p.id === id).placed, [piece.id, shape], 4000);
  }
  await waitFor((n) => window.__mathplay.state.step === 'done' || window.__mathplay.state.index !== n || window.__mathplay.scene !== 'BlockFit', shape, 8000);
}

async function fillRest(from) {
  const { total } = await state();
  for (let i = from; i < total; i++) {
    await waitFor((n) => window.__mathplay.state.step === 'play' && window.__mathplay.state.index === n && window.__mathplay.state.pieces, i, 8000);
    await sleep(300);
    await fillShape();
  }
}

async function openFit(player, skill) {
  if ((await t.scene()) !== 'Profiles') await toMap();
  await tap(`player:${player}`);
  await t.waitScene('WorldMap');
  await tap('island:literacy');
  await t.waitScene('Island');
  await sleep(200);
  const status = (await state()).skills.find((x) => x.id === skill).status;
  check(`${skill} is open on Word Woods`, status === 'ready', status);
  await tap(`skill:${skill}`);
  await t.waitScene('BlockFit');
  await waitFor(() => window.__mathplay.state.step === 'play' && window.__mathplay.state.pieces, null, 8000);
  await sleep(300);
}

// ---- Block Fit: letters (5-6), then turning blocks (7-8) ----
await openFit('Leo', 'lit-block-fit');
s = await state();
check('fit letters 5-6: a letter to cover, blocks the right way up', /^[A-Z]$/.test(s.shape) && s.pieces.every((p) => p.turns === 0), s.shape);
await t.shot(dir, 'l4-fit-letter');
await fillRest(0);
await results();
s = await state();
check('fit letters 5-6: every letter filled cleanly', s.score === s.total, `${s.score}/${s.total}`);

await openFit('Sam', 'lit-block-fit-turn');
s = await state();
check('fit 7-8: some blocks start turned', s.pieces.some((p) => p.turns > 0), JSON.stringify(s.pieces.map((p) => p.turns)));
await t.shot(dir, 'l5-fit-turn');
const turnedPiece = s.pieces.find((p) => p.turns > 0);
await tap(`piece:${turnedPiece.id}`);
await waitFor(([id, n]) => window.__mathplay.state.pieces.find((p) => p.id === id).turns === n, [turnedPiece.id, (turnedPiece.turns + 1) % 4], 4000);
check('fit 7-8: a tap turns a block', true);
await fillRest(0);
await results();
s = await state();
check('fit 7-8: every letter filled with turned blocks', s.score === s.total, `${s.score}/${s.total}`);

process.exit(await t.finish());
