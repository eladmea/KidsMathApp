// Walkthrough: the learning loop at normal speed. Map and islands, locked and
// coming-soon skills, age-band tabs, the worked example, adaptive steps (a
// hint after 3 wrong, a level up after 5 right), results, passing and
// unlocking, stickers, Daily Review and quit logging. Also screenshots the
// feedback for each answer type.
//   node e2e/learning.mjs <screenshotDir> <width> <height> <label>
import { PASSED, answerQuestion, open, seedPlayers, sleep } from './helpers.mjs';
import { SKILLS } from '../src/curriculum/skills.js';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const question = (i) => waitFor((i) => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step === 'question' && window.__mathplay.state.index === i, i, 8000);
const feedback = () => waitFor(() => window.__mathplay.state.step === 'feedback', null, 4000);
const results = () => waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 8000);
const log = () => t.mp(() => JSON.parse(localStorage.getItem(`mathplay2:play-log:${JSON.parse(localStorage.getItem('mathplay2:profiles'))[0].id}`) || '[]'));

const everything = Object.fromEntries(SKILLS.map((skill) => [skill.id, PASSED]));
await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }, { name: 'Leo', age: 8, avatar: '🐸', narration: false }], { Leo: everything });
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
await sleep(400);
let s = await state();
const math = s.islands.find((i) => i.subject === 'math');
check('the map shows five islands with progress in her band', s.islands.length === 5 && math.passed === 0 && math.total === 11 && math.next === 'math-count-5', JSON.stringify(math));
check('no Daily Review before anything is passed', s.reviews.length === 0 && !(await t.box('review')));
await t.shot(dir, 'l1-map');

// ---- Island: statuses, messages, band tabs ----
await tap('island:math');
await t.waitScene('Island');
await sleep(300);
s = await state();
const status = Object.fromEntries(s.skills.map((x) => [x.id, x.status]));
check(
  'island statuses: open and locked; every sprouts math game is open',
  status['math-count-5'] === 'ready' && status['math-count-10'] === 'locked' && ['math-bee-paths', 'math-pizza', 'math-birthday-cake', 'math-write-1-5', 'math-race-track'].every((id) => status[id] === 'ready') && s.next === 'math-count-5',
  JSON.stringify(status)
);
await t.shot(dir, 'l2-island');
await tap('skill:math-count-10');
check('a locked skill says what to play first', (await state()).message === 'First, play Count to 5.');
await tap('band:explorers');
await waitFor(() => window.__mathplay.state.band === 'explorers');
check('band tabs show another age band', (await state()).skills.some((x) => x.id === 'math-add-10'));
await tap('band:sprouts');
await waitFor(() => window.__mathplay.state.band === 'sprouts');
// A game not rebuilt yet (on Puzzle Island).
await tap('back');
await t.waitScene('WorldMap');
await tap('island:logic');
await t.waitScene('Island');
await sleep(300);
check('a game not rebuilt yet shows as coming soon', (await state()).skills.find((x) => x.id === 'logic-bunny-pop').status === 'soon');
await tap('skill:logic-bunny-pop');
check('and says so when tapped', (await state()).message === 'Bunny Pop is coming soon!', (await state()).message);
await tap('back');
await t.waitScene('WorldMap');
await tap('island:math');
await t.waitScene('Island');
await sleep(300);

// ---- Count to 5: worked example, a hint, a level up ----
await tap('skill:math-count-5');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step === 'example');
await sleep(500);
check('a skill not passed yet opens with a worked example', (await state()).skillId === 'math-count-5');
await t.shot(dir, 'l3-example');
await tap('start');
for (let i = 0; i < 3; i++) {
  await question(i);
  await answerQuestion(t, { wrong: true });
  await feedback();
  if (i === 0) {
    await sleep(250);
    await t.shot(dir, 'l4-wrong-choice');
  }
}
s = await state();
check('3 wrong in a row: a hint (no easier skill below Count to 5)', s.change === 'hint', JSON.stringify(s.change));
await waitFor(() => window.__mathplay.state.step === 'example', null, 6000);
check('the hint is a worked example', (await state()).note === "💡 Here's a hint");
await tap('start');
for (let i = 3; i < 10; i++) {
  await question(i);
  if (i === 8) check('5 right in a row: level up to Count to 10', (await state()).skillId === 'math-count-10' && (await state()).note.includes('Level up'), JSON.stringify((await state()).note));
  await answerQuestion(t);
  await feedback();
}
await results();
s = await state();
// Count to 5 went 5 of 8: not passed. The 2 level-up questions on Count to 10
// were both right, which passes that skill.
check('7 of 10: 2 stars, Count to 5 not passed yet', s.score === 7 && s.stars === 2 && !s.newlyPassed.includes('math-count-5'), JSON.stringify(s));
await t.shot(dir, 'l5-results');

// ---- Again, all right: passed, unlocked, stickers ----
await tap('again');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step === 'example');
await tap('start');
for (let i = 0; i < 10; i++) {
  await question(i);
  await answerQuestion(t);
  await feedback();
}
await results();
await sleep(300);
s = await state();
check('10 of 10: 3 stars, Count to 5 passed', s.stars === 3 && s.newlyPassed.includes('math-count-5'), JSON.stringify(s.newlyPassed));
check('passing unlocks the next skills', s.newlyUnlocked.length > 0, JSON.stringify(s.newlyUnlocked));
check('a sticker for passing it', s.stickers.length === 1, s.stickers.join(' '));
await t.shot(dir, 'l6-passed');
await tap('map');
await t.waitScene('Island');
await sleep(300);
s = await state();
check('back on the island: Count to 10 is open now', s.skills.find((x) => x.id === 'math-count-10').status === 'ready' && s.next !== 'math-count-5');
await tap('back');
await t.waitScene('WorldMap');
s = await state();
check('the map counts 2 passed on Number Island', s.islands.find((i) => i.subject === 'math').passed === 2);
await tap('stickers');
await t.waitScene('StickerBook');
await sleep(300);
check('the sticker book has both stickers', (await state()).count === 2);
await t.shot(dir, 'l7-stickers');
await tap('back');
await t.waitScene('WorldMap');

// ---- Quitting early is logged ----
await tap('island:math');
await t.waitScene('Island');
await tap('skill:math-count-5');
await question(0);
await tap('back');
await t.waitScene('Island');
check('leaving a round early is logged as a quit', (await log()).some((e) => e.type === 'quit' && e.skillId === 'math-count-5'));
check('every answer is logged', (await log()).filter((e) => e.type === 'answer').length === 20);
await tap('back');
await t.waitScene('WorldMap');

// ---- Daily Review: passed skills whose review day has come ----
await t.mp(() => {
  const id = JSON.parse(localStorage.getItem('mathplay2:profiles'))[0].id;
  const key = `mathplay2:progress:${id}`;
  const progress = JSON.parse(localStorage.getItem(key));
  Object.values(progress).forEach((record) => (record.dueDate = '2026-01-01'));
  localStorage.setItem(key, JSON.stringify(progress));
});
await t.page.reload();
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
check('reviews due: Daily Review appears', (await state()).reviews.length === 2 && Boolean(await t.box('review')));
await tap('review');
await question(0);
const skillsSeen = new Set();
for (let i = 0; i < 10; i++) {
  await question(i);
  s = await state();
  skillsSeen.add(s.skillId);
  if (i === 0) check('Daily Review is a review round', s.mode === 'review');
  await answerQuestion(t);
  await feedback();
}
check('Daily Review mixes the due skills', skillsSeen.size === 2, [...skillsSeen].join());
await results();
await tap('map');
await t.waitScene('WorldMap');
check('after the review, nothing is due', (await state()).reviews.length === 0);

// ---- What the other answer types look like after a wrong answer ----
await tap('switch-player');
await t.waitScene('Profiles');
await tap('player:Leo');
await t.waitScene('WorldMap');
for (const [subject, band, id] of [
  ['math', 'builders', 'math-number-line-100'],
  ['literacy', 'builders', 'lit-digraph-builder'],
  ['literacy', 'builders', 'lit-story-strip'],
  ['math', 'explorers', 'math-add-10'],
]) {
  await tap(`island:${subject}`);
  await t.waitScene('Island');
  if ((await state()).band !== band) {
    await tap(`band:${band}`);
    await waitFor((b) => window.__mathplay.state.band === b, band);
  }
  await tap(`skill:${id}`);
  await question(0);
  await sleep(500);
  await t.shot(dir, `l8-${id}`);
  await answerQuestion(t, { wrong: true });
  await feedback();
  await sleep(600);
  await t.shot(dir, `l9-${id}-wrong`);
  check(`${id}: a wrong answer is marked wrong`, (await state()).right === false);
  await tap('back');
  await t.waitScene('Island');
  await tap('back');
  await t.waitScene('WorldMap');
}

process.exit(await t.finish());
