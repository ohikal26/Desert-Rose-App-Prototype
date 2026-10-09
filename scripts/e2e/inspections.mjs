// End-to-end check of stage 4 (demo step 3): Sara inspects Room 5212 and Room 4121.
// Usage: npm run build && node scripts/e2e/inspections.mjs [screenshotDir]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'

const [shots] = process.argv.slice(2)
const server = serve()
const URL = 'http://localhost:4179/'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, serviceWorkers: 'block' })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
let n = 0
const snap = async (name, full = false) => {
  if (!shots) return
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${shots}/${String(++n).padStart(2, '0')}-${name}.png`, fullPage: full })
}
await page.goto(URL)
await page.evaluate(() => { localStorage.setItem('dr.user', 'sara'); localStorage.setItem('dr.lang', 'en') })
await page.reload()
await page.waitForSelector('h1')

// Room 5212: steps followed, result needs work on the A/C grill
await page.locator('article:has-text("Vacant room inspection")').getByRole('link', { name: 'Start inspection' }).click()
await page.getByRole('searchbox').fill('5212')
await page.locator('button.list-row:has-text("5212")').click()
await page.waitForSelector('h1:has-text("Entrance and door")')
await snap('item-1')
const mark = async (steps, result) => {
  await page.getByRole('radio', { name: steps, exact: true }).click()
  await page.getByRole('radio', { name: result, exact: true }).click()
}
for (let i = 0; i < 4; i++) { await mark('Yes', 'Good'); await page.getByRole('button', { name: 'Next item' }).click() }
await page.waitForSelector('h1:has-text("A/C grill")')
await mark('Yes', 'Needs work')
await page.getByLabel(/Note/).fill('Dust on the A/C grill')
await snap('ac-grill')
await page.getByRole('button', { name: 'Add as a problem' }).click()
await page.waitForSelector('text=From the task:')
assert.equal(await page.getByLabel('What is the problem?').inputValue(), 'Dust on the A/C grill', 'note pre-fills the title')
assert.ok(await page.locator('.tag:has-text("Renovated area")').count(), 'tag from the place')
await page.getByRole('radio', { name: /Care/ }).click()
await snap('ac-problem', true)
await page.getByRole('button', { name: 'Send problem' }).click()
await page.waitForSelector('h1:has-text("A/C grill")')
assert.ok(await page.getByRole('button', { name: 'See the problem' }).count(), 'item now links to its problem')
console.log('✓ Room 5212: item marked steps yes / result needs work; problem created, tagged care + renovated')
for (let i = 5; i < 10; i++) { await page.getByRole('button', { name: 'Next item' }).click(); await mark('Yes', 'Good') }
await page.getByRole('button', { name: 'Finish' }).click()
await page.waitForSelector('text=Problems created: 1')
const stepsText = await page.locator('.total').nth(0).innerText()
const resultText = await page.locator('.total').nth(1).innerText()
assert.match(stepsText, /10\s*of 10/)
assert.match(resultText, /9\s*of 10/)
await snap('summary-5212', true)
await page.getByRole('button', { name: 'Finish inspection' }).click()
await page.waitForSelector('h1:has-text("Hello")')
console.log('✓ summary shows two separate totals: steps 10 of 10, result good 9 of 10')

// Room 4121: rusty kettle → condition, old → capex
await page.locator('article:has-text("Vacant room inspection")').getByRole('link', { name: 'Start inspection' }).click()
await page.getByRole('searchbox').fill('4121')
await page.locator('button.list-row:has-text("4121")').click()
await page.waitForSelector('h1:has-text("Entrance and door")')
for (let i = 0; i < 3; i++) { await mark('Yes', 'Good'); await page.getByRole('button', { name: 'Next item' }).click() }
await page.waitForSelector('h1:has-text("Kettle and tray")')
await mark('Yes', 'Not acceptable')
await page.getByRole('button', { name: 'Add as a problem' }).click()
await page.getByLabel('What is the problem?').fill('Rust on the kettle screw')
assert.ok(await page.locator('.tag:has-text("Old area")').count())
await page.getByRole('radio', { name: /Condition/ }).click()
await page.getByRole('button', { name: 'Send problem' }).click()
await page.waitForSelector('h1:has-text("Kettle and tray")')
await page.getByRole('button', { name: 'See the problem' }).click()
await page.waitForSelector('h1:has-text("Rust on the kettle screw")')
await page.getByRole('button', { name: 'Send to capex list' }).click()
await page.locator('.sheet').getByRole('button', { name: 'Send to capex list' }).click()
await page.waitForSelector('.split-detail .chip:has-text("Sent to capex list")')
await snap('kettle-capex', true)
console.log('✓ Room 4121: rusty kettle tagged condition + old, sent to the capex list by Sara')

// Tablet layout: list beside the item
await page.setViewportSize({ width: 1024, height: 768 })
await page.goto(URL + '#/')
await page.locator('a.list-row:has-text("Room 4121")').first().click()
await page.waitForSelector('.insp-list')
assert.ok(await page.locator('.insp-item').count() === 10)
await snap('tablet')
console.log('✓ tablet shows the item list beside the open item')

assert.deepEqual(errors, [])
await browser.close()
server.close()
console.log('All stage 4 checks passed')
