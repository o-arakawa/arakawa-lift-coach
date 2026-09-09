// Render cover.html -> cover.jpg (1600x2560) with headless Chromium via Playwright.
// Usage: node book/build/render_cover.js book/build/cover.html book/dist/cover.jpg
// Requires: `npm i -g playwright` (or a local install) and a Chromium. Set CHROME_PATH to use a specific binary.
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
(async () => {
  const [htmlPath, outPath] = process.argv.slice(2);
  const launch = { args: ['--no-sandbox'] };
  if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1600, height: 2560 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(htmlPath));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 92, fullPage: false });
  await browser.close();
  console.log('rendered', outPath);
})().catch(e => { console.error(e); process.exit(1); });
