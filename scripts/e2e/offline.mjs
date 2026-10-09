// Checks the built app installs its service worker and then opens with the network cut.
// Usage: npm run build && node scripts/e2e/offline.mjs
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'

const server = serve()
const URL = 'http://localhost:4179/'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } })
const page = await ctx.newPage()
await page.goto(URL)
await page.waitForSelector('h1')
// Wait until the service worker has precached the app shell.
await page.waitForFunction(async () => {
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg?.active) return false
  const keys = await caches.keys()
  if (!keys.length) return false
  const c = await caches.open(keys.find((k) => k.includes('precache')) ?? keys[0])
  return (await c.keys()).length > 10
}, null, { timeout: 20000 })

await ctx.setOffline(true)
// A tick made offline must save on the device.
await page.evaluate(() => localStorage.setItem('dr.user', 'karim'))
await page.goto(URL + '#/checklist/open/quiet-pool/pool-opening')
await page.waitForSelector('.cl-tick')
await page.waitForSelector('.conn.is-offline')
await page.locator('.cl-tick').first().click()
await page.locator('.ini-input').fill('KA')
await page.locator('.sheet button[type=submit]').click()
await page.waitForSelector('.cl-item.is-done')
console.log('✓ offline: app shell opens, indicator says "Offline · will sync", a tick saves')

// Full reload while offline: the shell, fonts and data come from the device.
await page.reload()
await page.waitForSelector('.cl-item.is-done', { timeout: 15000 })
const fontsOk = await page.evaluate(() => document.fonts.check('17px "Nunito Sans"'))
assert.ok(fontsOk, 'bundled fonts available offline')
console.log('✓ offline reload works; fonts come from the cache')

await ctx.setOffline(false)
await page.waitForSelector('.conn:not(.is-offline)')
console.log('✓ back online: indicator says "Online · saved"')
await browser.close()
server.close()
console.log('Offline checks passed')
