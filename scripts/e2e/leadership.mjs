// Screens and checks for the leadership page (GM, CEO, Owner views).
// Usage: npm run build && node scripts/e2e/leadership.mjs [screenshotDir]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'

const [shots] = process.argv.slice(2)
const server = serve()
const browser = await chromium.launch()
const errors = []
for (const [lang, vp, size] of [['en', { width: 360, height: 640 }, 'phone'], ['ar', { width: 360, height: 640 }, 'phone'], ['en', { width: 1024, height: 768 }, 'tablet']]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:4179/')
  for (const [user, view] of [['samir', 'gm'], ['ceo', 'ceo'], ['owner', 'owner']]) {
    await page.evaluate(([u, l]) => { localStorage.setItem('dr.user', u); localStorage.setItem('dr.lang', l) }, [user, lang])
    await page.goto(`http://localhost:4179/#/leadership?view=${view}`); await page.reload()
    await page.locator('h1:visible').first().waitFor(); await page.waitForTimeout(500)
    const w = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.ok(w <= vp.width, `${lang} ${view}: page wider than the screen (${w})`)
    if (shots) await page.screenshot({ path: `${shots}/${size}-${lang}-${view}.png`, fullPage: true })
  }
  // CEO and Owner land on their view from home
  await page.evaluate(() => localStorage.setItem('dr.user', 'owner'))
  await page.goto('http://localhost:4179/#/'); await page.reload(); await page.locator('h1:visible').first().waitFor()
  assert.ok(await page.locator('.scope [aria-selected="true"]').count())
  await ctx.close()
}
assert.deepEqual(errors, [])
await browser.close(); server.close()
console.log('Leadership checks passed')
