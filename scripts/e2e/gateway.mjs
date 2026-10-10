// Screens and checks for the Excellence Gateway: dashboard, morning briefing, department pages,
// guest feedback and the draft scorecard. Also: a guest concern becomes a problem in the OE app.
// Usage: npm run build && node scripts/e2e/gateway.mjs [screenshotDir]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'

const [shots] = process.argv.slice(2)
const server = serve()
const browser = await chromium.launch()
const errors = []
const BASE = 'http://localhost:4179/'
const PAGES = [
  ['dashboard', '/gateway'], ['briefing', '/gateway/briefing'], ['resort', '/gateway/dept/resort'],
  ['recreation', '/gateway/dept/recreation'], ['housekeeping', '/gateway/dept/housekeeping'], ['kitchen', '/gateway/dept/kitchen'],
  ['guest', '/gateway/guest'], ['scorecard', '/gateway/scorecard'],
]
for (const [lang, vp, size] of [['en', { width: 360, height: 640 }, 'phone'], ['ar', { width: 360, height: 640 }, 'phone'], ['en', { width: 1024, height: 768 }, 'tablet'], ['ar', { width: 1024, height: 768 }, 'tablet']]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(BASE)
  await page.evaluate(([l]) => { localStorage.setItem('dr.user', 'samir'); localStorage.setItem('dr.lang', l) }, [lang])
  for (const [name, path] of PAGES) {
    await page.goto(`${BASE}#${path}`); await page.reload()
    await page.locator('h1:visible').first().waitFor(); await page.waitForTimeout(400)
    const w = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.ok(w <= vp.width, `${lang} ${size} ${name}: page wider than the screen (${w})`)
    const body = await page.locator('main').innerText()
    assert.ok(!/gw\.[a-z]/.test(body), `${lang} ${name}: untranslated key on page`)
    if (shots) await page.screenshot({ path: `${shots}/${size}-${lang}-${name}.png`, fullPage: true })
  }
  await ctx.close()
}

// Who sees the Gateway tab: leaders and the OE team, not line staff or supervisors.
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(BASE)
  for (const [u, sees] of [['karim', false], ['hassan', false], ['sara', true], ['tarek', true], ['amr', true], ['samir', true], ['ceo', true], ['owner', true]]) {
    await page.evaluate((x) => { localStorage.setItem('dr.user', x); localStorage.setItem('dr.lang', 'en') }, u)
    await page.goto(BASE + '#/'); await page.reload(); await page.locator('h1:visible').first().waitFor()
    assert.equal(await page.locator('.bottom-nav a[href="#/gateway"]').count(), sees ? 1 : 0, `${u}: gateway tab`)
  }
  // Line staff sent to the Gateway by link go home.
  await page.evaluate(() => localStorage.setItem('dr.user', 'karim'))
  await page.goto(BASE + '#/gateway'); await page.reload(); await page.waitForTimeout(400)
  assert.ok(!page.url().includes('gateway'), 'karim is sent home')

  // Director turns a guest concern into a problem; the briefing then links to it.
  await page.evaluate(() => localStorage.setItem('dr.user', 'amr'))
  await page.goto(BASE + '#/gateway/dept/recreation'); await page.reload(); await page.locator('h1:visible').first().waitFor()
  const before = await page.locator('.concern .btn').count()
  await page.locator('.concern').filter({ hasText: 'Broken tile' }).getByRole('link', { name: 'Add as a problem' }).click()
  await page.waitForURL(/problems\/new/)
  assert.ok((await page.getByLabel('What is the problem?').inputValue()).includes('Broken tile'))
  await page.getByRole('button', { name: 'Send problem' }).click()
  await page.waitForURL(/#\/problems\/p-/)
  assert.ok((await page.locator('main').innerText()).includes('Guest feedback'), 'source shows guest feedback')
  await page.goto(BASE + '#/gateway/dept/recreation'); await page.locator('h1:visible').first().waitFor()
  assert.equal(await page.locator('.concern .btn').count(), before - 1)
  assert.equal(await page.locator('.concern .chip-good').count(), 1)
  await ctx.close()
}
assert.deepEqual(errors, [])
await browser.close(); server.close()
console.log('Gateway checks passed')
