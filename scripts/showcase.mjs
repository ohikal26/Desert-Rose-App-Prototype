// Captures the key screens for the UI showcase. Usage: npm run build && node scripts/showcase.mjs <outDir>
import { chromium } from 'playwright'
import { serve } from './e2e/serve.mjs'

const OUT = process.argv[2] ?? 'showcase'
const server = serve()
const URL = 'http://localhost:4179/'
const browser = await chromium.launch()

async function session(lang, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  await page.goto(URL)
  await page.evaluate((l) => { localStorage.clear(); localStorage.setItem('dr.lang', l) }, lang)
  const as = async (user, hash = '') => {
    await page.evaluate((u) => localStorage.setItem('dr.user', u), user)
    await page.goto(URL + hash)
    await page.reload()
    await page.locator('h1:visible').first().waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
  }
  const shot = (name) => page.screenshot({ path: `${OUT}/${lang}-${name}.png` })
  return { ctx, page, as, shot }
}

for (const lang of ['en', 'ar']) {
  const { ctx, page, as, shot } = await session(lang, { width: 360, height: 760 })
  // Fresh demo data
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('desert-rose-oe'); q.onsuccess = q.onerror = q.onblocked = r }))

  await as('karim'); await shot('1-home')

  // Karim part-way through the pool opening
  await page.locator('.next-card a').click()
  await page.locator('.cl-tick').first().waitFor()
  await page.locator('.cl-tick').nth(0).click()
  await page.locator('.ini-input').fill(lang === 'ar' ? 'كع' : 'KA')
  await page.locator('.sheet button[type=submit]').click()
  for (const i of [1, 2, 3]) { await page.locator('.cl-tick').nth(i).click(); await page.waitForTimeout(120) }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300); await shot('2-checklist')

  await as('hassan', '#/checklist/run-seed-1'); await shot('3-review')
  await as('hassan', '#/problems'); await shot('4-problems')
  await as('tarek', '#/problems/p-06'); await shot('5-safety')
  await as('karim', '#/problems/new?location=quiet-pool')
  await page.locator('.input').first().fill(lang === 'ar' ? 'طحالب على شبكة المصرف' : 'Algae on the drain grid')
  await page.locator('input[type=file]').setInputFiles('scripts/e2e/sample-photo.jpg')
  await page.locator('.thumb img').waitFor()
  await page.locator('.radio-card').nth(1).click()
  await page.waitForTimeout(250); await shot('6-report')
  await as('samir'); await shot('7-gm')
  await ctx.close()

  const tab = await session(lang, { width: 1024, height: 768 })
  await tab.as('hassan', '#/problems/p-06'); await tab.shot('tablet')
  await tab.ctx.close()
}
await browser.close()
server.close()
console.log('saved to', OUT)
