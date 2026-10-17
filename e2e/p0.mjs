// P0 browser walkthrough: plays Count to 5 and two pizzas through the
// window.__mathplay test hook (src/services/testBridge.js) and saves
// screenshots. Needs Playwright and a running build:
//
//   npm run build && npx vite preview --port 8765
//   URL=http://localhost:8765/ node e2e/p0.mjs <screenshotDir> <width> <height> <label>
//
// e.g. 844 390 phone, 1180 820 tablet. Each check prints PASS or FAIL.
import { chromium } from 'playwright';
const [W, width, height, label] = [process.argv[2] || '.', Number(process.argv[3] || 844), Number(process.argv[4] || 390), process.argv[5] || 'phone'];
const URL = process.env.URL || 'http://localhost:8765/KidsMathApp/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const errors = [];
const check = (name, ok, extra = '') => {
  const line = `${ok ? 'PASS' : 'FAIL'} [${label}] ${name} ${extra}`;
  checks.push(line);
  console.log(line);
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: width < 1000 });
await context.addInitScript(() => {
  const fake = [
    { name: 'Fred', lang: 'en-US', voiceURI: 'fred', default: true, localService: true },
    { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', voiceURI: 'aria-natural', default: false, localService: false },
  ];
  window.__utter = [];
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const synth = window.speechSynthesis;
  synth.getVoices = () => fake;
  synth.speak = (u) => window.__utter.push({ text: u.text, voice: u.voice ? u.voice.voiceURI : null });
  synth.cancel = () => {};
});
const page = await context.newPage();
page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console ' + m.text()); });

const mp = (fn, arg) => page.evaluate(fn, arg);
const state = () => mp(() => window.__mathplay.state);
const waitFor = (fn, arg, timeout = 8000) => page.waitForFunction(fn, arg, { timeout });
async function tap(name) {
  const box = await mp((n) => window.__mathplay.box(n), name);
  if (!box) throw new Error(`no ${name}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function drag(points, steps = 4) {
  const page0 = await mp((pts) => pts.map(([x, y]) => window.__mathplay.toPage(x, y)), points);
  await page.mouse.move(page0[0].x, page0[0].y);
  await page.mouse.down();
  for (const p of page0.slice(1)) await page.mouse.move(p.x, p.y, { steps });
  await page.mouse.up();
  await sleep(120);
}

await page.goto(URL);
// A phone held upright gets the "turn your device" screen instead.
const rotate = await page.locator('#rotate').isVisible();
if (height > width) {
  check('portrait phone asks to turn the device', rotate);
  await page.screenshot({ path: `${W}/${label}-rotate.png` });
  await browser.close();
  process.exit(checks.some((c) => c.startsWith('FAIL')) ? 1 : 0);
}
check('landscape shows the game, not the turn message', !rotate);
await waitFor(() => window.__mathplay && window.__mathplay.scene === 'Home');
await sleep(600);
await page.screenshot({ path: `${W}/${label}-1-home.png` });
const view = await mp(() => {
  const rect = document.querySelector('canvas').getBoundingClientRect();
  return { w: rect.width, h: rect.height };
});
check('canvas fills the screen (no black bars)', Math.abs(view.w - width) < 2 && Math.abs(view.h - height) < 2, JSON.stringify(view));
check('greeting spoken', (await mp(() => window.__mathplay.spoken)).some((t) => t.startsWith('Hi, Mia')));

// ---- Count to 5 ----
await tap('math-count-5');
await waitFor(() => window.__mathplay.scene === 'Quiz' && window.__mathplay.state.step);
check('first play shows the how-to card', (await state()).step === 'howTo');
await page.screenshot({ path: `${W}/${label}-2-howto.png` });
await tap('start');
for (let i = 0; i < 10; i++) {
  await waitFor((i) => window.__mathplay.state.step === 'question' && window.__mathplay.state.index === i, i);
  const s = await state();
  if (i === 0) {
    await sleep(700);
    await page.screenshot({ path: `${W}/${label}-3-question.png` });
    check('4 answer choices', s.choices.length === 4, s.choices.join(','));
  }
  const pickValue = i === 2 ? s.choices.find((c) => c !== s.answer) : s.answer;
  await tap(`choice:${pickValue}`);
  if (i === 2) {
    await sleep(300);
    await page.screenshot({ path: `${W}/${label}-4-wrong.png` });
  }
}
await waitFor(() => window.__mathplay.state.step === 'results', null, 10000);
const result = await state();
check('9 of 10 recorded, passed with 2 stars', result.correct === 9 && result.stars === 2 && result.passed);
await sleep(500);
await page.screenshot({ path: `${W}/${label}-5-results.png` });
await tap('home');
await waitFor(() => window.__mathplay.scene === 'Home');

// ---- Pizza ----
await tap('math-pizza');
await waitFor(() => window.__mathplay.scene === 'Pizza' && window.__mathplay.state.step === 'trace');
await sleep(400);
await page.screenshot({ path: `${W}/${label}-6-pizza.png` });
let s = await state();
// Pizza 1: the usual stroke order.
for (const stroke of s.guide) await drag(stroke);
await waitFor(() => window.__mathplay.state.step === 'spread');
check('pizza 1: number written in sauce', true, `number ${s.number}`);
await page.screenshot({ path: `${W}/${label}-7-written.png` });
async function spread() {
  const pizza = [470, 190];
  for (let row = 0; row < 12 && (await state()).step === 'spread'; row++) {
    const y = pizza[1] + 40 + row * 34;
    await drag([[pizza[0] + 30, y], [pizza[0] + 430, y]], 6);
  }
}
await spread();
await waitFor(() => window.__mathplay.state.step === 'done');
check('pizza 1: sauce spread', true);
await sleep(600);
await page.screenshot({ path: `${W}/${label}-8-sauced.png` });

// Pizza 2: scribble over everything first (too messy), then write it backwards.
await waitFor(() => window.__mathplay.state.step === 'trace' && window.__mathplay.state.pizza === 1, null, 6000);
s = await state();
const scribble = [];
for (let row = 0; row < 14; row++) scribble.push([row % 2 ? 900 : 500, 210 + row * 30]);
await drag(scribble, 6);
s = await state();
check('messy sauce over the whole pizza starts over', s.restarts === 1 && s.step === 'trace', JSON.stringify({ restarts: s.restarts, onNumber: s.onNumber }));
for (const stroke of [...s.guide].reverse()) await drag([...stroke].reverse());
await waitFor(() => window.__mathplay.state.step === 'spread');
check('pizza 2: any stroke order counts', true, `number ${s.number}`);
await spread();
await waitFor(() => window.__mathplay.state.step === 'results', null, 8000);
check('round recorded', (await state()).points >= 1);
await page.screenshot({ path: `${W}/${label}-9-pizza-done.png` });

// Idle reminder.
await tap('again');
await waitFor(() => window.__mathplay.state.step === 'trace');
await sleep(5600);
check('reminder after 5 s without a touch', (await mp(() => window.__mathplay.spoken.at(-1))).startsWith('Start at the green dot'));
await page.screenshot({ path: `${W}/${label}-10-reminder.png` });

const utter = await mp(() => window.__utter);
check('speech uses the natural voice', utter.length > 0 && utter.every((u) => u.voice === 'aria-natural'), utter.at(-1)?.voice);
check('no page errors', errors.length === 0, errors.join(' | '));
await browser.close();
process.exit(checks.some((c) => c.startsWith('FAIL')) ? 1 : 0);
