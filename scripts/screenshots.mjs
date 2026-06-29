// Responsive screenshot harness for the manual QA checklist.
//
// Setup (one-time):
//   npm i -D playwright
//   npx playwright install chromium
//
// Run against a dev server (npm run dev in another terminal):
//   node scripts/screenshots.mjs http://localhost:3000
//
// Output: ./screenshots/<route>-<width>.png at 360/768/1024/1280/1440.
//
// Note: /podbor, /wardrobe and /favorites require an authenticated session,
// otherwise they render the login screen. To shoot them, set TEST_EMAIL and
// TEST_PASSWORD env vars for an existing account (the harness logs in first).
//
// For the mobile regression diff, run this on the pre-adaptation commit into
// ./screenshots-base and on HEAD into ./screenshots, then compare the 360px
// (and 768px) pairs with any image-diff tool (e.g. `pixelmatch`, ImageMagick
// `compare`, or git-lfs review).

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.argv[2] || 'http://localhost:3000'
const outDir = process.env.OUT_DIR || 'screenshots'
const widths = [360, 768, 1024, 1280, 1440]
const routes = {
  home: '/',
  podbor: '/podbor',
  wardrobe: '/wardrobe',
  favorites: '/favorites',
}

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext()

// Optional login so the authed screens render their real layout.
if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
  const page = await context.newPage()
  await page.goto(`${base}/podbor`, { waitUntil: 'networkidle' })
  await page.fill('#login-email', process.env.TEST_EMAIL)
  await page.fill('#login-password', process.env.TEST_PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForLoadState('networkidle')
  await page.close()
}

for (const [name, path] of Object.entries(routes)) {
  for (const w of widths) {
    const page = await context.newPage()
    await page.setViewportSize({ width: w, height: 900 })
    await page.goto(base + path, { waitUntil: 'networkidle' })
    await page.screenshot({ path: `${outDir}/${name}-${w}.png`, fullPage: true })
    await page.close()
  }
}

await browser.close()
console.log(`Saved screenshots to ./${outDir}`)
