// Walkthrough: the illustrated map and islands: stops for each skill with
// how far the child got, the avatar at the next stop and on the island they
// last visited, and the treasure chest at the end of the road.
//   node e2e/islands.mjs <screenshotDir> <width> <height> <label>
import { PASSED, open, seedPlayers, sleep } from './helpers.mjs';

const [dir, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const t = await open({ width, height, label });
const { check, state, tap } = t;
const MASTERED = { ...PASSED, passedDays: ['2026-10-15', '2026-10-16'] };

// Word Woods for ages 3-4 is done (its chest can open); Number Island has
// one stop passed and one mastered.
await seedPlayers(t, [{ name: 'Mia', age: 4, avatar: '🦁' }], {
  Mia: { 'lit-rhymes': PASSED, 'lit-first-sound': PASSED, 'math-count-5': PASSED, 'math-shapes': MASTERED },
});
await t.waitScene('Profiles');
await tap('player:Mia');
await t.waitScene('WorldMap');
await sleep(500);
check('the avatar starts on Number Island', (await state()).home === 'math');
await t.shot(dir, 'i1-map');

await tap('island:math');
await t.waitScene('Island');
await sleep(300);
let s = await state();
const stop = Object.fromEntries(s.skills.map((x) => [x.id, x.stop]));
check('stops show passed, mastered, ready and locked', stop['math-count-5'] === 'passed' && stop['math-shapes'] === 'mastered' && stop['math-count-10'] === 'ready' && stop['math-write-6-9'] === 'locked', JSON.stringify(stop));
check('passed stops still open their game', s.skills.find((x) => x.id === 'math-count-5').status === 'ready');
await tap('chest');
check('the chest stays shut until every stop is passed', (await state()).message.startsWith('Finish every stop'));
await t.shot(dir, 'i2-island');
await tap('skill:math-count-5');
await t.waitScene('Quiz');
await tap('back');
await t.waitScene('Island');
await tap('back');
await t.waitScene('WorldMap');

await tap('island:literacy');
await t.waitScene('Island');
s = await state();
check('Word Woods is complete', s.complete === true && s.skills.length > 0, JSON.stringify(s.skills));
await tap('chest');
await t.page.waitForFunction(() => window.__mathplay.state.chest);
s = await state();
check('opening the chest gives a treasure sticker', s.chest === 'opened' && Boolean(s.sticker), s.sticker);
await sleep(400);
await t.shot(dir, 'i3-chest');
await tap('chest');
await t.page.waitForFunction(() => window.__mathplay.state.chest === 'already');
check('a chest gives its sticker once', true);
await tap('back');
await t.waitScene('WorldMap');
check('the avatar waits on the island visited last', (await state()).home === 'literacy');
await tap('stickers');
await t.waitScene('StickerBook');
check('the treasure sticker is in the book', (await state()).count === 1, String((await state()).count));
process.exit(await t.finish());
