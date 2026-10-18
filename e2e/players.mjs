// Walkthrough: first run, creating players, picking one, narration on/off,
// back navigation, the grown-up check and deleting a player. Also the
// portrait "turn your device" screen.
//   node e2e/players.mjs <screenshotDir> <width> <height> <label>
import { URL, open, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { page, check, state, tap } = t;

await page.goto(URL);
await t.mp(() => localStorage.clear());
await page.goto(URL);

const rotate = await page.locator('#rotate').isVisible();
if (height > width) {
  check('portrait phone asks to turn the device', rotate);
  await t.shot(dir, 'rotate');
  const voiced = await t.mp(() => window.__mathplay.voice);
check('every sentence is spoken from a recording', voiced.length > 0 && voiced.every((v) => v.source === 'recording'), voiced.filter((v) => v.source !== 'recording').map((v) => v.text).join(' | '));
process.exit(await t.finish());
}
check('landscape shows the game, not the turn message', !rotate);

// ---- First run: the welcome screen ----
await t.waitScene('CreateProfile');
await sleep(400);
check('no players yet: the welcome screen opens', (await t.spoken()).some((line) => line.startsWith('Welcome')));
check('the first player has no back button', !(await t.box('back')));
check("can't save without a name", (await state()).canSave === false);
check('no language picker while there is only one language', !(await t.box('language:en')));
await tap('save');
check('tapping save with no name does nothing', (await t.scene()) === 'CreateProfile');

// The name field is a real input sitting where the scene put it.
const field = await page.locator('input').boundingBox();
const expected = await t.mp(() => window.__mathplay.toPage(640, 180));
check(
  'name field sits over the canvas in the right place',
  field && Math.abs(field.x + field.width / 2 - expected.x) < 6 && Math.abs(field.y + field.height / 2 - expected.y) < 6,
  JSON.stringify({ field, expected })
);
await page.locator('input').fill('Mia');
await tap('age:4');
await tap('avatar:🐼');
let s = await state();
check('name, age and buddy picked', s.name === 'Mia' && s.age === 4 && s.avatar === '🐼' && s.canSave, JSON.stringify(s));
await t.shot(dir, 'p1-create');
await tap('save');
await t.waitScene('WorldMap');
await sleep(300);
check('the map greets the new player', (await t.spoken()).at(-1) === 'Hi! Pick an island to play.');
check('narration is on for a 4-year-old', (await state()).narration === true);
await t.shot(dir, 'p2-home');

// ---- Narration off: nothing is read aloud, except when 🔊 is tapped ----
await tap('narration');
check('narration switched off', (await state()).narration === false);
let before = (await t.spoken()).length;
await tap('island:math');
await t.waitScene('Island');
await tap('skill:math-count-5');
await t.waitScene('Quiz');
await sleep(400);
check('with narration off the quiz stays quiet', (await t.spoken()).length === before);
await tap('say-again');
check('🔊 still reads the line', (await t.spoken()).length === before + 1);
await tap('back');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');
check('← goes back to the island, then the map', true);

// The setting is saved with the player.
await page.reload();
await t.waitScene('Profiles');
await t.shot(dir, 'p3-profiles');
check("a returning visit starts at Who's playing?", (await state()).players.join() === 'Mia');
await tap('player:Mia');
await t.waitScene('WorldMap');
check('narration stays off after a reload', (await state()).narration === false);
await tap('narration');
check('and can be switched back on', (await state()).narration === true);

// ---- A second player; ← from the form goes back to the list ----
await tap('switch-player');
await t.waitScene('Profiles');
await tap('new-player');
await t.waitScene('CreateProfile');
await tap('back');
await t.waitScene('Profiles');
check('← from New player goes back to the list', true);
await tap('new-player');
await t.waitScene('CreateProfile');
await page.locator('input').fill('Leo');
await tap('age:8');
await page.locator('input').press('Enter');
await t.waitScene('WorldMap');
check('Enter in the name field saves', (await state()).player === 'Leo');
check('narration is off by default for an 8-year-old reader', (await state()).narration === false);
await tap('switch-player');
await t.waitScene('Profiles');
check('both players listed', (await state()).players.join() === 'Mia,Leo');

// ---- Grown-up check, then delete Leo ----
await tap('manage');
await sleep(250);
s = await state();
check('manage asks the grown-up question', Boolean(s.gate));
await t.shot(dir, 'p4-gate');
for (const digit of '1') await tap(`key:${digit}`);
await tap('key:✓');
s = await state();
check('a wrong answer gets a new question', s.gateWrong && s.gateInput === '');
for (const digit of String(s.gateAnswer)) await tap(`key:${digit}`);
await tap('key:✓');
await sleep(250);
check('the right answer opens manage mode', (await state()).managing === true);
const leoId = await t.mp(() => JSON.parse(localStorage.getItem('mathplay2:profiles')).find((p) => p.name === 'Leo').id);
await t.mp((id) => localStorage.setItem(`mathplay2:progress:${id}`, '{"math-add-20":{}}'), leoId);
await tap('player:Leo');
await sleep(250);
await t.shot(dir, 'p5-delete');
await tap('confirm-delete');
await sleep(300);
check('Leo is deleted', (await state()).players.join() === 'Mia');
check("and so is Leo's progress", (await t.mp((id) => localStorage.getItem(`mathplay2:progress:${id}`), leoId)) === null);
await tap('manage');
check('Done leaves manage mode', (await state()).managing === false);
await tap('player:Mia');
await t.waitScene('WorldMap');
check('Mia can still play', (await state()).player === 'Mia');

const voiced = await t.mp(() => window.__mathplay.voice);
check('every sentence is spoken from a recording', voiced.length > 0 && voiced.every((v) => v.source === 'recording'), voiced.filter((v) => v.source !== 'recording').map((v) => v.text).join(' | '));
process.exit(await t.finish());
