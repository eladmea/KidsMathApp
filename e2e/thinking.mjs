// Walkthrough: the island games that aren't quizzes or writing: Bunny Pop,
// Freeze Zoo, Robo Path (and Robot Loops), Push & Roll, Feelings Friends.
// Runs at normal speed: the go/no-go games are timed.
//   node e2e/thinking.mjs <screenshotDir> <width> <height> <label>
import { PASSED, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const results = () => waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 15000);

await seedPlayers(t, [{ name: 'Leo', age: 6, avatar: '🐯' }], { Leo: { 'sci-push-pull': PASSED, 'sel-situations': PASSED } });
await t.waitScene('Profiles');
await tap('player:Leo');
await t.waitScene('WorldMap');

async function openSkill(island, skill, band) {
  await tap(`island:${island}`);
  await t.waitScene('Island');
  if (band) {
    await tap(`band:${band}`);
    await waitFor((b) => window.__mathplay.state.band === b, band);
  }
  await sleep(200);
  const status = (await state()).skills.find((x) => x.id === skill).status;
  check(`${skill} is open on its island`, status === 'ready', status);
  await tap(`skill:${skill}`);
}
async function toMap() {
  await tap('map');
  await t.waitScene('Island');
  await tap('back');
  await t.waitScene('WorldMap');
}

// ---- Bunny Pop: one oops, one missed bunny ----
await openSkill('logic', 'logic-bunny-pop', 'sprouts');
await t.waitScene('BunnyPop');
await sleep(300);
await t.shot(dir, 't1-bunny-rules');
await tap('go');
let s = await state();
let oops = false;
let missed = false;
for (let i = 0; i < s.total; i++) {
  await waitFor((n) => window.__mathplay.state.index === n && window.__mathplay.state.up, i, 6000);
  s = await state();
  if (i === 0) await t.shot(dir, 't2-bunny-pop');
  if (s.target && missed) await tap(`hole:${s.hole}`);
  else if (s.target) missed = true;
  else if (!oops) {
    oops = true;
    await tap(`hole:${s.hole}`);
    check('bunny: tapping another animal is an oops', (await t.spoken()).at(-1).startsWith("That's the"));
  }
  await waitFor(() => !window.__mathplay.state.up || window.__mathplay.scene !== 'BunnyPop', null, 6000);
}
await results();
s = await state();
check('bunny: 14 of 16 (one oops, one missed)', s.score === 14 && s.total === 16, `${s.score}/${s.total}`);
await toMap();

// ---- Freeze Zoo: one wrong tap; the rules switch halfway ----
await openSkill('logic', 'logic-freeze-zoo');
await t.waitScene('FreezeZoo');
await sleep(300);
await t.shot(dir, 't3-freeze-rules');
await tap('go');
let wrong = false;
for (let i = 0; i < 24; i++) {
  if (i === 12) {
    await waitFor(() => window.__mathplay.state.step === 'rules' && window.__mathplay.state.part === 2, null, 6000);
    check('freeze: the rule switches halfway', (await t.spoken()).at(-1).startsWith('Switch!'));
    await tap('go');
  }
  await waitFor((n) => window.__mathplay.state.index === n && window.__mathplay.state.visible, i, 6000);
  s = await state();
  if (s.target) await tap('stage');
  else if (!wrong) {
    wrong = true;
    await tap('stage');
  }
  await waitFor(() => !window.__mathplay.state.visible || window.__mathplay.scene !== 'FreezeZoo', null, 6000);
}
await results();
s = await state();
check('freeze: 23 of 24 (one wrong tap)', s.score === 23 && s.total === 24, `${s.score}/${s.total}`);
await toMap();

// ---- Robo Path: one short run on the first puzzle, then right ----
// It climbs a level after each first-run win: 1, 1, 2, 3, 4 (stars), 5.
await openSkill('logic', 'logic-robo-path');
await t.waitScene('RoboPath');
const stages = [];
for (let i = 0; i < 6; i++) {
  await waitFor((n) => window.__mathplay.state.step === 'edit' && window.__mathplay.state.index === n, i, 8000);
  s = await state();
  stages.push(s.stage);
  if (s.puzzle.stars.length && !(await t.mp(() => window.__shotStars))) {
    await t.mp(() => (window.__shotStars = true));
    check('robo: from level 4 there are stars to collect', s.stage >= 4 && s.puzzle.stars.length >= 1, JSON.stringify({ stage: s.stage, stars: s.puzzle.stars }));
    check('robo: a star level says to collect them', (await t.spoken()).at(-1).startsWith('Collect every star'), (await t.spoken()).at(-1));
    await t.shot(dir, 't4b-robo-stars');
  }
  const moves = s.puzzle.solution.flatMap(({ dir: d, times }) => Array(times).fill(d));
  if (i === 0) {
    for (const move of moves.slice(0, -1)) await tap(`arrow:${move}`);
    await t.shot(dir, 't4-robo-program');
    await tap('run');
    await waitFor(() => window.__mathplay.state.step === 'failed', null, 8000);
    check('robo: stopping short fails the run', (await t.spoken()).at(-1).startsWith('The robot stopped'));
    await tap('try-again');
    await tap(`arrow:${moves.at(-1)}`);
  } else {
    for (const move of moves) await tap(`arrow:${move}`);
  }
  check(`robo ${i + 1}: program built`, (await state()).blocks.length === moves.length);
  await tap('run');
  await waitFor(() => window.__mathplay.state.step === 'goal', null, 8000);
  if (i === 1) check('robo: a first-run win levels up', (await t.spoken()).at(-1).includes('Level up!'), (await t.spoken()).at(-1));
}
await results();
s = await state();
check('robo: 5 of 6 (one failed run)', s.score === 5 && s.total === 6, `${s.score}/${s.total}`);
check('robo: levels climb after first-run wins', stages.join() === '1,1,2,3,4,5', stages.join());
const saved = await t.mp(() => JSON.parse(localStorage.getItem('mathplay2:profiles'))[0].roboLevel);
check("robo: the player's level is saved for next time", saved === 6, String(saved));
await toMap();

// ---- Robot Loops: repeat blocks, limited ----
await openSkill('logic', 'logic-loops', 'builders');
await t.waitScene('RoboPath');
await waitFor(() => window.__mathplay.state.step === 'edit');
s = await state();
check('loops: blocks are limited to the straight runs', s.puzzle.loops && s.puzzle.blockLimit === s.puzzle.solution.length);
for (const { dir: d, times } of s.puzzle.solution) {
  await tap(`arrow:${d}`);
  if (times > 1) await tap(`times:${times}`);
}
await t.shot(dir, 't5-loops');
await tap('run');
await waitFor(() => window.__mathplay.state.step === 'goal', null, 8000);
check('loops: the looped program reaches the cookie', (await state()).score === 1);
await tap('back');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');

// ---- Push & Roll: one too soft, then aim for the target ----
await openSkill('science', 'sci-push-roll');
await t.waitScene('PushRoll');
const shots = [];
for (let i = 0; i < 8; i++) {
  await waitFor((n) => window.__mathplay.state.step === 'aim' && window.__mathplay.state.shot === n, i, 8000);
  s = await state();
  const hold = i === 0 ? 80 : (s.zone.start + s.zone.width / 2) * s.fullPowerMs;
  const push = await t.box('push');
  await t.page.mouse.move(push.x + push.width / 2, push.y + push.height / 2);
  await t.page.mouse.down();
  await sleep(hold);
  if (i === 1) await t.shot(dir, 't6-push');
  await t.page.mouse.up();
  await waitFor(() => window.__mathplay.state.step === 'result', null, 8000);
  shots.push((await state()).result);
}
check('push: a short hold is too soft', shots[0] === 'tooSoft', shots[0]);
check('push: holding to the target hits it', shots.slice(1).filter((r) => r === 'hit').length >= 6, shots.join(','));
await results();
s = await state();
check('push: hits recorded', s.score === shots.filter((r) => r === 'hit').length && s.total === 8, `${s.score}/${s.total}`);
await toMap();

// ---- Feelings Friends: one wrong feeling ----
await openSkill('sel', 'sel-feelings-friends');
await t.waitScene('FeelingsFriends');
for (let i = 0; i < 4; i++) {
  await waitFor((n) => window.__mathplay.state.step === 'feeling' && window.__mathplay.state.index === n, i, 8000);
  s = await state();
  if (i === 0) {
    await sleep(300);
    await t.shot(dir, 't7-feelings');
    const box = await t.box(`choice:${s.answer}`);
    check('feelings: three faces to choose from', Boolean(box));
    const others = ['happy', 'sad', 'angry', 'scared', 'surprised', 'sleepy'].filter((f) => f !== s.answer);
    for (const other of others) {
      if (await t.box(`choice:${other}`)) {
        await tap(`choice:${other}`);
        break;
      }
    }
    check('feelings: a wrong face explains the story', (await t.spoken()).at(-1).includes('Look at the story again'));
  } else {
    await tap(`choice:${s.answer}`);
  }
  await waitFor((n) => window.__mathplay.state.step === 'help' && window.__mathplay.state.index === n, i, 8000);
  s = await state();
  if (i === 0) await t.shot(dir, 't8-help');
  await tap(`choice:${s.answer}`);
}
await results();
s = await state();
check('feelings: 7 of 8 (one wrong face)', s.score === 7 && s.total === 8, `${s.score}/${s.total}`);
process.exit(await t.finish());
