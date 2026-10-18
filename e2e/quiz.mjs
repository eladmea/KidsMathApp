// Walkthrough: every quiz skill in every subject and age band, through the
// real map -> island -> quiz -> results flow. Each round answers one question
// wrong and the rest right, so it should pass with 3 stars. Saves a
// screenshot of each skill's first question and of its wrong answer.
//   node e2e/quiz.mjs <screenshotDir> <width> <height> <label>
import { PASSED, answerQuestion, open, seedPlayers, sleep } from './helpers.mjs';
import { SKILLS } from '../src/curriculum/skills.js';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 1280), Number(process.argv[4] || 720), process.argv[5] || 'laptop'];
const t = await open({ width, height, label });
const { check, state, waitFor, tap } = t;
const SUBJECTS = ['math', 'literacy', 'science', 'logic', 'sel'];
const BANDS = ['sprouts', 'explorers', 'builders', 'masters'];

// Everything passed, so every skill is open and no worked example opens a
// round (examples are covered by e2e/learning.mjs).
const progress = Object.fromEntries(SKILLS.map((skill) => [skill.id, PASSED]));
await seedPlayers(t, [{ name: 'Sam', age: 10, avatar: '🦊', narration: false }], { Sam: progress }, '?fast');
await t.waitScene('Profiles');

let played = 0;
const failures = [];
const seen = new Set();
for (const band of BANDS) {
  for (const subject of SUBJECTS) {
    // Fresh map each island, so the history stays short.
    if ((await t.scene()) !== 'WorldMap') {
      if ((await t.scene()) === 'Profiles') await tap('player:Sam');
      await t.waitScene('WorldMap');
    }
    await tap(`island:${subject}`);
    await t.waitScene('Island');
    if ((await state()).band !== band) {
      await tap(`band:${band}`);
      await waitFor((b) => window.__mathplay.scene === 'Island' && window.__mathplay.state.band === b, band);
    }
    const list = (await state()).skills;
    for (const { id, status } of list) {
      if (status !== 'ready') continue;
      await tap(`skill:${id}`);
      await waitFor(() => window.__mathplay.scene !== 'Island');
      const scene = await t.scene();
      if (scene !== 'Quiz') {
        // A rebuilt game (Pizza): not part of this walkthrough.
        await tap('back');
        await t.waitScene('Island');
        continue;
      }
      try {
        for (let i = 0; i < 10; i++) {
          await waitFor((i) => window.__mathplay.state.step === 'question' && window.__mathplay.state.index === i, i, 6000);
          const s = await state();
          if (i === 0 && !seen.has(id)) {
            seen.add(id);
            await sleep(150);
            await t.shot(dir, `q-${id}`);
          }
          await answerQuestion(t, { wrong: i === 1 });
          // On a slow machine a tap can land just before the answers take
          // input: answer once more if nothing happened.
          const answered = () => waitFor((i) => window.__mathplay.state.step === 'feedback' || window.__mathplay.state.index !== i, i, 2500);
          await answered().catch(async () => {
            await answerQuestion(t, { wrong: i === 1 });
            await answered();
          });
          if (i === 1) {
            await sleep(120);
            await t.shot(dir, `q-${id}-wrong`);
            const fb = await state();
            if (fb.right !== false) failures.push(`${id}: the wrong answer counted as right (${s.type})`);
          }
        }
        await waitFor(() => window.__mathplay.scene === 'Results' && window.__mathplay.state.step === 'results', null, 8000);
        const r = await state();
        if (r.stars !== 3 || r.score !== 9) failures.push(`${id}: ${r.score}/${r.total}, ${r.stars} stars`);
        played += 1;
      } catch (error) {
        failures.push(`${id}: ${error.message.split("\n")[0]}`);
        console.log("FAILED", id, error.message.split("\n")[0], JSON.stringify(await state()).slice(0, 300), t.errors.slice(-3));
        await t.shot(dir, `fail-${id}`);
      }
      await tap('map');
      await t.waitScene('Island');
    }
    await tap('back');
    await t.waitScene('WorldMap');
  }
}
const saved = await t.mp(() => {
  const profile = JSON.parse(localStorage.getItem('mathplay2:profiles'))[0];
  return Object.keys(JSON.parse(localStorage.getItem(`mathplay2:progress:${profile.id}`) || '{}')).length;
});
check('every quiz skill played through to Results with 9/10 and 3 stars', failures.length === 0 && played >= 50, `${played} played; ${failures.join(' | ')}`);
check('progress saved for every skill played', saved >= played, `${saved} saved`);
process.exit(await t.finish());
