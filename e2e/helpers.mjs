// Shared pieces for the browser walkthroughs: a Playwright page with fake
// device voices (every utterance is recorded), PASS/FAIL checks, and taps and
// drags through the window.__mathplay test hook (src/services/testBridge.js).
import { chromium } from 'playwright';

export const URL = process.env.URL || 'http://localhost:8765/KidsMathApp/';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function open({ width, height, label }) {
  const checks = [];
  const errors = [];
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: width < 1000 });
  await context.addInitScript(() => {
    const fake = [
      { name: 'Fred', lang: 'en-US', voiceURI: 'fred', default: true, localService: true },
      { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', voiceURI: 'aria-natural', default: false, localService: false },
    ];
    window.__utter = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    const synth = window.speechSynthesis;
    synth.getVoices = () => fake;
    synth.speak = (u) => window.__utter.push({ text: u.text, voice: u.voice ? u.voice.voiceURI : null });
    synth.cancel = () => {};
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console ' + m.text());
  });

  const mp = (fn, arg) => page.evaluate(fn, arg);
  const t = {
    page,
    browser,
    errors,
    checks,
    mp,
    check(name, ok, extra = '') {
      const line = `${ok ? 'PASS' : 'FAIL'} [${label}] ${name} ${extra}`;
      checks.push(line);
      console.log(line);
    },
    state: () => mp(() => window.__mathplay.state),
    scene: () => mp(() => window.__mathplay && window.__mathplay.scene),
    spoken: () => mp(() => window.__mathplay.spoken.slice()),
    waitFor: (fn, arg, timeout = 8000) => page.waitForFunction(fn, arg, { timeout }),
    waitScene: (key, timeout = 8000) => page.waitForFunction((k) => window.__mathplay && window.__mathplay.scene === k, key, { timeout }),
    box: (name) => mp((n) => window.__mathplay.box(n), name),
    async tap(name) {
      const box = await t.box(name);
      if (!box) throw new Error(`nothing tagged "${name}" in ${await t.scene()}`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await sleep(80);
    },
    async drag(points, steps = 4) {
      const onPage = await mp((pts) => pts.map(([x, y]) => window.__mathplay.toPage(x, y)), points);
      await page.mouse.move(onPage[0].x, onPage[0].y);
      await page.mouse.down();
      for (const p of onPage.slice(1)) await page.mouse.move(p.x, p.y, { steps });
      await page.mouse.up();
      await sleep(120);
    },
    shot: (dir, name) => page.screenshot({ path: `${dir}/${label}-${name}.png` }),
    async finish() {
      t.check('no page errors', errors.length === 0, errors.join(' | '));
      await browser.close();
      return checks.some((c) => c.startsWith('FAIL')) ? 1 : 0;
    },
  };
  return t;
}

// Puts players in storage before the app starts: [{ name, age, avatar, narration }].
export async function seedPlayers(t, players, progress = {}) {
  await t.page.goto(URL);
  await t.mp(
    ({ players, progress }) => {
      localStorage.clear();
      const list = players.map((p, i) => ({ id: `p${i}`, createdAt: i, narration: true, ...p }));
      localStorage.setItem('mathplay2:profiles', JSON.stringify(list));
      list.forEach((p) => progress[p.name] && localStorage.setItem(`mathplay2:progress:${p.id}`, JSON.stringify(progress[p.name])));
    },
    { players, progress }
  );
  await t.page.goto(URL);
}
