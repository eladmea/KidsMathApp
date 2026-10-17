// Smoke test for a deployed site: opens it in Chromium and reports whether the
// game started, plus every failed download and script error, so a broken
// publish shows up in the CI log with its cause.
//   URL=https://eladmea.github.io/KidsMathApp/ node e2e/smoke.mjs
import { chromium } from 'playwright';

const url = process.env.URL;
if (!url) throw new Error('Set URL to the site to check');
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let failed = false;
for (const [width, height, label] of [
  [1280, 720, 'desktop'],
  [844, 390, 'phone'],
]) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: label === 'phone', hasTouch: label === 'phone' });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
  const response = await page.goto(url, { waitUntil: 'load' });
  console.log(`[${label}] ${url} -> HTTP ${response.status()}`);
  const html = await page.content();
  console.log(`[${label}] scripts: ${[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]).join(', ') || '(none)'}`);
  let scene = null;
  try {
    await page.waitForFunction(() => window.__mathplay && window.__mathplay.scene, null, { timeout: 20000 });
    scene = await page.evaluate(() => window.__mathplay.scene);
  } catch (e) {
    // Reported below.
  }
  const status = await page.evaluate(() => document.getElementById('status')?.innerText || null);
  console.log(`[${label}] game started: ${scene ? `yes (${scene})` : 'NO'}${status ? ` | page says: ${status.replace(/\s+/g, ' ')}` : ''}`);
  problems.forEach((p) => console.log(`[${label}]   ${p}`));
  if (!scene) failed = true;
  await context.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
