import { chromium } from 'playwright'
import { serve } from './serve.mjs'
const server = serve(); const browser = await chromium.launch()
const out = process.argv[2]
for (const [lang, vp, name] of [['en', { width: 360, height: 640 }, 'phone'], ['ar', { width: 360, height: 640 }, 'phone'], ['en', { width: 1024, height: 768 }, 'tablet']]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4179/')
  await page.evaluate((l) => { localStorage.setItem('dr.user', 'samir'); localStorage.setItem('dr.lang', l) }, lang)
  for (const [hash, label] of [['#/summary', 'summary'], ['#/qr-sheet', 'qr']]) {
    await page.goto('http://localhost:4179/' + hash); await page.reload()
    await page.locator('h1:visible').first().waitFor(); await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/${name}-${lang}-${label}.png`, fullPage: true })
  }
  // Tile taps open the filtered list
  await page.goto('http://localhost:4179/#/summary'); await page.locator('h1:visible').first().waitFor()
  await page.locator('.tile', { hasText: lang === 'en' ? 'Overdue' : 'متأخرة' }).click()
  await page.waitForURL(/status=overdue/)
  await ctx.close()
}
await browser.close(); server.close(); console.log('ok')
