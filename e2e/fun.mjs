// Walkthrough: the Games list (Memory Chips, Number Path Race, Garden Days),
// Fun Break and its tickets (Bubble Pop, Chip Toss, Dance Tap, Balloon
// Breath), and earning a ticket from a learning round.
//   node e2e/fun.mjs <screenshotDir> <width> <height> <label>
import { answerQuestion, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const step = (name, timeout = 8000) => waitFor((n) => window.__mathplay.state.step === n, name, timeout);

await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁', funTickets: 3, roundsCompleted: 1 }], {}, '?fast');
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
check('the map shows Games and Fun Break with the tickets', Boolean(await t.box('games')) && Boolean(await t.box('fun-break')) && (await state()).tickets === 3);
await t.shot(dir, 'f1-map');

// ---- Memory Chips against the buddy ----
await tap('games');
await t.waitScene('Games');
await sleep(200);
await t.shot(dir, 'f2-games');
await tap('game:memory-chips');
await t.waitScene('GameSetup');
let s = await state();
check('setup picks the variant that is just right (Dot Chips for 4)', s.option === 'dots' && s.mode === 'solo', s.option);
await t.shot(dir, 'f3-setup');
await tap('start');
await t.waitScene('Memory');
let paid = false;
for (let turn = 0; turn < 80; turn++) {
  await waitFor(() => {
    const st = window.__mathplay.state;
    return st.step === 'over' || (!st.buddyTurn && !st.busy && st.step === 'flip' && st.flipped.length === 0);
  }, null, 20000);
  s = await state();
  if (s.step === 'over') break;
  const hidden = s.deck.filter((c) => c.status === 'hidden');
  // The first turn pays a gap on purpose; later turns take a real pair when
  // there is one, else the cheapest gap (paying a gap leaves orphans).
  const natural = paid && hidden.find((c) => hidden.some((d) => d.id !== c.id && d.value === c.value));
  let pair;
  if (natural) {
    pair = [natural, hidden.find((d) => d.id !== natural.id && d.value === natural.value)];
  } else {
    const options = hidden.flatMap((a) => hidden.filter((b) => b.value > a.value).map((b) => [a, b])).filter(([a, b]) => b.value - a.value <= s.chips[1]);
    options.sort((x, y) => x[1].value - x[0].value - (y[1].value - y[0].value));
    pair = options[0];
    if (!pair) break;
  }
  await tap(`card:${pair[0].id}`);
  await tap(`card:${pair[1].id}`);
  if (!natural) {
    await step('gap');
    s = await state();
    const cost = Math.abs(pair[0].value - pair[1].value);
    if (!paid) {
      await t.shot(dir, 'f4-gap');
      check('a mismatch asks for the gap in chips', s.pending.cost === cost && s.guessStyle === 'chips');
    }
    const before = { ...s.chips };
    for (let n = 0; n < s.pending.cost; n++) await tap('coins');
    await tap('pay');
    await waitFor(() => window.__mathplay.state.step !== 'gap', null, 8000);
    s = await state();
    if (!paid) check('paying the right gap makes a pair and gives the chips away', s.scores[1] === 1 && s.chips[1] === before[1] - cost && s.chips[2] === before[2] + cost, JSON.stringify({ scores: s.scores, chips: s.chips }));
    paid = true;
  }
}
await step('over', 20000);
s = await state();
check('memory: every card ends up matched (or the game is stuck)', s.deck.every((c) => c.status === 'matched') || s.winner !== null, JSON.stringify(s.scores));
await sleep(700);
await t.shot(dir, 'f5-memory-over');
await tap('map');
await t.waitScene('GameSetup');
await tap('back');
await t.waitScene('Games');

// ---- Number Path Race with the buddy ----
await tap('game:path-race');
await t.waitScene('GameSetup');
check('path race: 1 to 10 for a 4-year-old', (await state()).option === '10');
await tap('start');
await t.waitScene('PathRace');
let wrongHop = false;
for (let turn = 0; turn < 40; turn++) {
  await waitFor(() => {
    const st = window.__mathplay.state;
    return st.step === 'over' || (!st.buddyTurn && st.step === 'spin');
  }, null, 20000);
  if ((await state()).step === 'over') break;
  await tap('spin');
  await step('hop');
  s = await state();
  if (!wrongHop) {
    wrongHop = true;
    const wrong = s.pending[0] === 10 ? 9 : s.pending[0] + 1;
    await tap(`square:${wrong}`);
    check('path race: tapping the wrong square says where to hop', (await t.spoken()).at(-1).startsWith('Hop to'));
    await t.shot(dir, 'f6-path');
  }
  for (const square of s.pending) await tap(`square:${square}`);
}
await step('over', 20000);
s = await state();
check('path race: someone reaches 10 and wins', s.winner && s.positions[s.winner] === 10, JSON.stringify(s.positions));
await sleep(700);
await tap('map');
await t.waitScene('GameSetup');

// With a friend: both turns are played on this device.
await tap('mode:duo');
await tap('start');
await t.waitScene('PathRace');
await step('spin');
await tap('spin');
await step('hop');
for (const square of (await state()).pending) await tap(`square:${square}`);
await waitFor(() => window.__mathplay.state.current === 2 && window.__mathplay.state.step === 'spin', null, 8000);
s = await state();
check('with a friend, player 2 takes their own turn', !s.buddyTurn && s.current === 2 && (await t.spoken()).at(-1) === 'Your turn. Spin!');
await tap('back');
await t.waitScene('GameSetup');
await tap('back');
await t.waitScene('Games');

// ---- Garden Days ----
await tap('game:garden-days');
await t.waitScene('Garden');
await step('care');
s = await state();
check('garden: a new seed with a clue', s.stage === 0 && (await t.spoken()).at(-1).startsWith('Look at your plant'));
await t.shot(dir, 'f7-garden');
const silly = ['candy', 'music'];
for (const id of silly) {
  if (await t.box(`care:${id}`)) {
    await tap(`care:${id}`);
    break;
  }
}
await waitFor(() => window.__mathplay.state.droopy === true);
check('garden: a silly choice makes it droop', (await state()).stage === 0);
await tap(`care:${s.need}`);
await step('resting');
check('garden: the right need grows it one stage, then it rests until tomorrow', (await state()).stage === 1);
await t.shot(dir, 'f8-garden-grew');
await tap('back');
await t.waitScene('Games');
await tap('back');
await t.waitScene('WorldMap');

// ---- Fun Break: three tickets ----
await tap('fun-break');
await t.waitScene('FunBreak');
await sleep(200);
await t.shot(dir, 'f9-fun-break');
await tap('mini:bubble-pop');
await t.waitScene('BubblePop');
for (let i = 0; i < 8 && (await state()).popped < 3; i++) {
  await waitFor(() => window.__mathplay.state.bubbles && window.__mathplay.state.bubbles.length > 0, null, 5000);
  s = await state();
  // A bubble that is on screen now (they float up and off the top).
  let id = null;
  for (const bubble of s.bubbles) {
    const box = await t.box(`bubble:${bubble.id}`);
    if (box && box.y > 20 && box.y + box.height < height - 20) {
      id = bubble.id;
      break;
    }
  }
  if (id !== null) await tap(`bubble:${id}`).catch(() => {});
  else await sleep(150);
}
check('bubble pop: tapping pops bubbles', (await state()).popped >= 2, String((await state()).popped));
await t.shot(dir, 'f10-bubbles');
await step('over', 15000);
await tap('done');
await t.waitScene('FunBreak');
check('a mini-game uses a ticket', (await state()).tickets === 2);

await tap('mini:chip-toss');
await t.waitScene('ChipToss');
for (let i = 0; i < 10; i++) {
  await waitFor(() => window.__mathplay.state.step === 'play', null, 5000);
  await tap('toss');
  await waitFor((n) => window.__mathplay.state.left === 9 - n, i, 5000);
}
s = await state();
check('chip toss: 10 chips tossed', s.left === 0);
await step('over');
await t.shot(dir, 'f11-toss');
await tap('done');
await t.waitScene('FunBreak');

await tap('mini:dance-tap');
await t.waitScene('DanceTap');
let lastBeat = 0;
while (true) {
  await waitFor((b) => window.__mathplay.state.step === 'over' || (window.__mathplay.state.beat > b && window.__mathplay.state.lit !== null), lastBeat, 5000);
  s = await state();
  if (s.step === 'over') break;
  lastBeat = s.beat;
  await tap(`pad:${s.lit}`).catch(() => {});
  if (lastBeat === 3) await t.shot(dir, 'f12-dance');
}
s = await state();
// At test speed a beat lasts ~150 ms, faster than the test taps.
check('dance tap: tapping the glowing pad scores', s.hits >= 5, String(s.hits));
await tap('done');
await t.waitScene('FunBreak');
s = await state();
check('out of tickets: games are locked', s.tickets === 0);
await tap('mini:chip-toss');
check('a locked game says how to earn a ticket', (await state()).refused === 'chip-toss' && (await t.spoken()).at(-1).startsWith('Play 1 more learning round'));

// ---- Balloon Breath is free (one quick and one slow breath) ----
await tap('mini:balloon-breath');
await t.waitScene('BalloonBreath');
s = await state();
const box = await t.box('breathe');
async function breathe(ms) {
  await waitFor(() => window.__mathplay.state.step === 'ready', null, 10000);
  await t.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await t.page.mouse.down();
  await sleep(ms);
  await t.page.mouse.up();
}
await breathe(800);
check('balloon: a quick breath does not count', (await state()).breath === 'quick' && (await state()).breaths === 0);
await breathe(s.inMs * 0.85);
check('balloon: a slow breath counts', (await state()).breath === 'good' && (await state()).breaths === 1);
await t.shot(dir, 'f13-balloon');
await tap('back');
await t.waitScene('FunBreak');
await tap('back');
await t.waitScene('WorldMap');

// ---- Earning a ticket: a learning round ----
await tap('island:math');
await t.waitScene('Island');
await tap('skill:math-count-5');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step);
if ((await state()).step === 'example') await tap('start');
for (let i = 0; i < 10; i++) {
  await waitFor((n) => window.__mathplay.state.step === 'question' && window.__mathplay.state.index === n, i);
  await answerQuestion(t);
}
await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 10000);
check('every second round earns a ticket', (await state()).ticket === true);
await t.shot(dir, 'f14-ticket');
process.exit(await t.finish());
