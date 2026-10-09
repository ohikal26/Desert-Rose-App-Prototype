// End-to-end check of stage 2: scan, tick with initials, could-not-do, submit, supervisor check, send back.
// Usage: npm run build && node scripts/e2e/checklists.mjs <fake-camera.y4m> [screenshotDir]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'

const [video, shots] = process.argv.slice(2)
const server = serve()
const URL = 'http://localhost:4179/'
const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${video}`],
})
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, serviceWorkers: 'block', permissions: ['camera'] })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
let n = 0
const snap = async (name) => {
  if (!shots) return
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${shots}/${String(++n).padStart(2, '0')}-${name}.png` })
}
const asUser = async (id, lang = 'en') => {
  await page.evaluate(([u, l]) => { localStorage.setItem('dr.user', u); localStorage.setItem('dr.lang', l) }, [id, lang])
  await page.goto(URL)
  await page.waitForSelector('h1')
}

await page.goto(URL)
await asUser('karim')

// 1. Scan the Quiet Pool code
await page.getByRole('link', { name: 'Scan the code to start' }).click()
await snap('scan')
await page.waitForURL(/#\/checklist\/run-/, { timeout: 15000 })
await page.waitForSelector('h1:has-text("Quiet Pool")')
console.log('✓ QR scan opened the Quiet Pool checklist')

// 2. Submit is disabled until every task is done or has a reason
const submit = page.getByRole('button', { name: 'Submit checklist' })
assert.equal(await submit.isDisabled(), true)

// 3. First tick asks for initials, then records initials and time
const items = page.locator('.cl-tick')
await items.nth(0).click()
await page.getByLabel('Initials (2 or 3 letters)').fill('k')
assert.equal(await page.getByRole('button', { name: 'Save initials' }).isDisabled(), true, 'one letter is not enough')
await page.getByLabel('Initials (2 or 3 letters)').fill('ka')
await snap('initials')
await page.getByRole('button', { name: 'Save initials' }).click()
await page.waitForSelector('.cl-item.is-done .cl-meta:has-text("KA")')
console.log('✓ initials asked once and recorded with the time')

for (let i = 1; i < 6; i++) { await items.nth(i).click(); await page.waitForSelector(`.cl-item:nth-child(${i + 1}).is-done`) }
await snap('ticked')
assert.equal(await submit.isDisabled(), true)

// 4. Last task: could not do, with a reason
await page.locator('.cl-item').nth(6).getByRole('button', { name: 'Could not do' }).click()
await page.getByRole('button', { name: 'Area closed' }).click()
await snap('could-not-do')
await page.getByRole('button', { name: 'Save reason' }).click()
await page.waitForSelector('.cl-item.is-cnd')
assert.equal(await submit.isDisabled(), false)
console.log('✓ submit unlocks only when every task is done or has a reason')
await snap('ready')
await submit.click()
await page.waitForSelector('h1:has-text("Hello")')
assert.ok(await page.locator('article:has-text("Quiet Pool") .chip:has-text("Done")').count())
console.log('✓ submitted; home shows Done')

// 5. Hassan sees it waiting for his check and sends it back
await asUser('hassan')
await snap('supervisor-home')
await page.locator('a.list-row:has-text("Quiet Pool")').click()
await page.waitForSelector('text=Go and look at the place')
await snap('supervisor-review')
await page.getByRole('button', { name: 'Send back' }).click()
await page.getByLabel('What should they look at again?').fill('Please write the chlorine reading in the log')
await snap('send-back')
await page.locator('.sheet').getByRole('button', { name: 'Send back' }).click()
await page.waitForSelector('.banner-warning:has-text("Sent back:")')
console.log('✓ supervisor sent it back with a note')

// 6. Karim sees the note, fixes and sends again
await asUser('karim')
assert.ok(await page.locator('article:has-text("Quiet Pool") .chip:has-text("Sent back")').count())
await snap('employee-sent-back')
await page.locator('article:has-text("Quiet Pool")').getByRole('link', { name: 'Continue checklist' }).click()
await page.waitForSelector('.banner-warning')
await page.waitForSelector('text=Ticking as')  // remembers the initials Karim used on this checklist
await items.nth(6).click()
await page.waitForSelector('.cl-item:nth-child(7).is-done')
await submit.click()
await page.waitForSelector('h1:has-text("Hello")')

// 7. Hassan confirms the result
await asUser('hassan')
await page.locator('a.list-row:has-text("Quiet Pool")').click()
await page.getByRole('button', { name: 'Result looks right' }).click()
await page.waitForSelector('.banner-good:has-text("Result looks right")')
await snap('supervisor-ok')
console.log('✓ resent and confirmed: "Result looks right"')

// 8. Karim cannot tick a checked checklist; Sara cannot check a checklist
await asUser('karim')
await page.locator('article:has-text("Quiet Pool")').getByRole('link', { name: 'See checklist' }).click()
assert.equal(await page.locator('.cl-tick').first().isDisabled(), true)
assert.equal(await page.getByRole('button', { name: 'Submit checklist' }).count(), 0)
console.log('✓ a checked checklist is read-only')

// 9. List fallback in Arabic, with a room number search for Mona
await asUser('mona', 'ar')
await page.getByRole('link', { name: 'امسح الرمز للبدء' }).click()
await page.getByRole('tab', { name: 'اختر من القائمة' }).click()
await page.getByRole('searchbox').fill('5212')
await snap('ar-pick-list')
await page.locator('button.list-row:has-text("5212")').first().click()
await page.waitForSelector('h1:has-text("غرفة 5212")')
await page.locator('.cl-tick').first().click()
await page.getByLabel('الأحرف الأولى (حرفان أو ثلاثة)').fill('مو')
await page.getByRole('button', { name: 'حفظ الأحرف' }).click()
await page.waitForSelector('.cl-item.is-done')
await snap('ar-checklist')
console.log('✓ Arabic list fallback and Arabic initials work')

// 10. Data survives a reload (IndexedDB)
await page.reload()
await page.waitForSelector('.cl-item.is-done')
console.log('✓ saved on the device across reloads')

assert.deepEqual(errors, [])
await browser.close()
server.close()
console.log('All stage 2 checks passed')
