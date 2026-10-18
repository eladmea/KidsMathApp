// Walkthrough: the game in Hebrew. A Hebrew player sees and hears Hebrew on
// the map, the islands and the first question of every quiz skill (all age
// bands), and in the drawn games. The grown-ups switch a child's language on
// the dashboard, and "New player" offers the language picker.
//   node e2e/hebrew.mjs <screenshotDir> <width> <height> <label>
import { PASSED, answerQuestion, open, seedPlayers, sleep } from './helpers.mjs';
import { SKILLS } from '../src/curriculum/skills.js';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;

const LATIN = /[A-Za-z]/;
const HEBREW = /[֐-׿]/;
const latinLines = (lines) => lines.filter((line) => LATIN.test(line));
const spokenSince = async (from) => (await t.spoken()).slice(from);

const everything = Object.fromEntries(SKILLS.map((skill) => [skill.id, PASSED]));
await seedPlayers(t, [{ name: 'נועה', age: 4, avatar: '🦁', language: 'he' }, { name: 'Leo', age: 8, avatar: '🐸', language: 'en' }], { נועה: everything });
await t.waitScene('Profiles');
await sleep(300);
await tap('player:נועה');
await t.waitScene('WorldMap');
await sleep(400);
check('the page is Hebrew, right to left', (await t.mp(() => [document.documentElement.lang, document.documentElement.dir].join())) === 'he,rtl');
let lines = await t.spoken();
check('the map greets in Hebrew', HEBREW.test(lines.at(-1)) && !LATIN.test(lines.at(-1)), lines.at(-1));
await t.shot(dir, 'h1-map');

// ---- Every quiz skill, in every band: the first question is Hebrew ----
const quizSkills = SKILLS.filter((skill) => skill.generator);
const bands = ['sprouts', 'explorers', 'builders', 'masters'];
let checked = 0;
const english = [];
for (const subject of ['math', 'literacy', 'science', 'logic', 'sel']) {
  await tap(`island:${subject}`);
  await t.waitScene('Island');
  await sleep(300);
  if (subject === 'literacy') await t.shot(dir, 'h2-island');
  for (const band of bands) {
    const skills = quizSkills.filter((skill) => skill.subject === subject && skill.band === band);
    if (!skills.length) continue;
    await tap(`band:${band}`);
    await waitFor((b) => window.__mathplay.state.band === b, band);
    await sleep(150);
    for (const skill of skills) {
      const from = (await t.spoken()).length;
      await tap(`skill:${skill.id}`);
      await waitFor(() => window.__mathplay.scene === 'Quiz' && ['example', 'question'].includes(window.__mathplay.state.step), null, 8000);
      if ((await state()).step === 'example') {
        await sleep(200);
        await tap('start');
      }
      await waitFor(() => window.__mathplay.state.step === 'question', null, 8000);
      await sleep(250);
      const s = await state();
      const shown = [s.prompt, ...(s.choices || []).map(String), ...(s.tiles || []).map((tile) => tile.text)].filter(Boolean);
      const bad = latinLines([...shown, ...(await spokenSince(from))]);
      if (bad.length) english.push(`${skill.id}: ${bad.join(' | ')}`);
      if (['math-count-5', 'lit-rhymes', 'lit-word-builder', 'sci-weather', 'sel-faces', 'logic-patterns', 'math-add-10', 'lit-story-strip'].includes(skill.id)) await t.shot(dir, `h3-${skill.id}`);
      // One answer, to see the feedback is Hebrew too.
      const before = (await t.spoken()).length;
      await answerQuestion(t);
      await waitFor(() => window.__mathplay.state.step === 'feedback', null, 4000);
      await sleep(300);
      const after = latinLines(await spokenSince(before));
      if (after.length) english.push(`${skill.id} feedback: ${after.join(' | ')}`);
      checked += 1;
      await tap('back');
      await t.waitScene('Island');
      await sleep(200);
    }
  }
  await tap('back');
  await t.waitScene('WorldMap');
}
check(`every quiz skill asks and answers in Hebrew (${checked} skills)`, checked === quizSkills.length && english.length === 0, english.slice(0, 6).join(' || '));

// ---- Drawn games ----
async function openGame(subject, skillId, scene, shot) {
  await tap(`island:${subject}`);
  await t.waitScene('Island');
  await sleep(300);
  const skill = SKILLS.find((s) => s.id === skillId);
  await tap(`band:${skill.band}`);
  await waitFor((b) => window.__mathplay.state.band === b, skill.band);
  const from = (await t.spoken()).length;
  await tap(`skill:${skillId}`);
  await t.waitScene(scene);
  await sleep(1200);
  await t.shot(dir, shot);
  const bad = latinLines(await spokenSince(from));
  check(`${scene} speaks Hebrew`, bad.length === 0 && (await spokenSince(from)).length > 0, bad.join(' | '));
  await tap('back');
  await t.waitScene('Island');
  await tap('back');
  await t.waitScene('WorldMap');
}
await openGame('math', 'math-pizza', 'PizzaShop', 'h4-pizza');
await openGame('math', 'math-birthday-cake', 'BirthdayCake', 'h5-cake');
await openGame('sel', 'sel-feelings-friends', 'FeelingsFriends', 'h6-friends');

// ---- Grown-ups: switch a child's language ----
await tap('switch-player');
await t.waitScene('Profiles');
await tap('grown-ups');
await waitFor(() => window.__mathplay.state.gate);
const gate = await state();
for (const digit of String(gate.gateAnswer)) await tap(`key:${digit}`);
await tap('key:✓');
await t.waitScene('ParentDashboard');
await waitFor(() => window.__mathplay.state.step === 'child');
let s = await state();
check('the dashboard shows the language setting', s.language === 'he' && Boolean(await t.box('language:en')) && Boolean(await t.box('language:he')), JSON.stringify(s.language));
await t.shot(dir, 'h7-dashboard');
await tap('language:en');
await waitFor(() => window.__mathplay.scene === 'ParentDashboard' && window.__mathplay.state.step === 'child' && window.__mathplay.state.language === 'en');
check('switching the signed-in child to English redraws the dashboard in English', (await t.mp(() => document.documentElement.dir)) === 'ltr');
await tap('language:he');
await waitFor(() => window.__mathplay.scene === 'ParentDashboard' && window.__mathplay.state.step === 'child' && window.__mathplay.state.language === 'he');
const stored = await t.mp(() => JSON.parse(localStorage.getItem('mathplay2:profiles')).map((p) => p.language).join());
check('the language is saved with the child', stored === 'he,en', stored);
await tap('tab:p1');
await waitFor(() => window.__mathplay.state.child === 'Leo');
check("another child's language is theirs: Leo stays English", (await state()).language === 'en' && (await t.mp(() => document.documentElement.dir)) === 'rtl');

// ---- New player: the language picker ----
await tap('back');
await t.waitScene('Profiles');
await tap('new-player');
await t.waitScene('CreateProfile');
await sleep(300);
check('"New player" offers both languages', Boolean(await t.box('language:en')) && Boolean(await t.box('language:he')));
await t.shot(dir, 'h8-new-player');
await tap('language:en');
await t.waitScene('CreateProfile');
await sleep(300);
check('picking English turns the form English', (await t.mp(() => document.documentElement.lang)) === 'en');

process.exit(await t.finish());
