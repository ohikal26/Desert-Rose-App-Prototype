// End-to-end check of stage 3: report, assign, fix, the rule against confirming your own fix, capex, safety, filters.
// Usage: npm run build && node scripts/e2e/problems.mjs <photo.jpg> [screenshotDir]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'

const [photo, shots] = process.argv.slice(2)
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
const asUser = async (id, hash = '', lang = 'en') => {
  await page.evaluate(([u, l]) => { localStorage.setItem('dr.user', u); localStorage.setItem('dr.lang', l) }, [id, lang])
  await page.goto(URL + hash)
  await page.reload()
  await page.waitForSelector('h1')
}
const openProblem = async (title) => {
  await page.locator('.problem-card', { hasText: title }).first().locator('a.stretched').click()
  await page.waitForSelector(`h1:has-text("${title}")`)
}

await page.goto(URL)

// 1. Karim reports algae from the Quiet Pool checklist, with a photo
await asUser('karim')
await page.locator('a[href="#/checklist/open/quiet-pool/pool-opening"]').click()
await page.locator('.cl-item', { hasText: 'Drains and grids' }).getByRole('link', { name: 'Report a problem' }).click()
await page.waitForSelector('text=From the task:')
assert.ok(await page.locator('.card:has-text("Quiet Pool")').count(), 'place is pre-filled')
await page.getByRole('button', { name: 'Send problem' }).click()
assert.ok(await page.locator('text=Write a few words about the problem.').count(), 'missing title is flagged')
await page.getByLabel('What is the problem?').fill('Algae on the drain grid')
await page.locator('input[type=file]').setInputFiles(photo)
await page.waitForSelector('.thumb img')
await page.getByRole('radio', { name: /Care/ }).click()
assert.equal(await page.locator('select').first().inputValue(), 'hassan', 'default owner is the supervisor')
await snap('report-form', true)
await page.getByRole('button', { name: 'Send problem' }).click()
await page.waitForSelector('h1:has-text("Quiet Pool")')
console.log('✓ problem reported from a checklist task, with photo; back on the checklist')

// 2. Hassan gives it to Karim, due tomorrow
await asUser('hassan', '#/problems')
await snap('supervisor-list')
await openProblem('Algae on the drain grid')
await page.getByRole('button', { name: 'Change owner or due date' }).click()
await page.locator('.sheet select').selectOption('karim')
await page.locator('.sheet').getByRole('button', { name: 'Save' }).click()
await page.waitForSelector('text=Hassan gave it to Karim')
assert.ok(await page.locator('dd:has-text("Due tomorrow")').count())
await snap('assigned', true)
console.log('✓ supervisor assigned it to Karim, due tomorrow')

// 3. Karim marks it fixed, then tries to confirm it himself and is stopped
await asUser('karim', '#/problems')
await openProblem('Algae on the drain grid')
await page.getByRole('button', { name: 'Mark as fixed' }).click()
await page.locator('.sheet').getByRole('button', { name: 'Mark as fixed' }).click()
await page.waitForSelector('.split-detail .chip:has-text("Fixed, waiting for check")')
await page.getByRole('button', { name: 'Confirm fixed' }).click()
await page.waitForSelector('text=You fixed this, so someone else needs to check it')
await snap('blocked-self-confirm')
await page.getByRole('button', { name: 'OK' }).click()
assert.ok(await page.locator('.split-detail .chip:has-text("Fixed, waiting for check")').count(), 'still not closed')
console.log('✓ Karim blocked from confirming his own fix (rule 8)')

// 4. Hassan confirms
await asUser('hassan', '#/problems?status=fixed')
await openProblem('Algae on the drain grid')
await page.getByRole('button', { name: 'Confirm fixed' }).click()
await page.waitForSelector('.split-detail .chip:has-text("Closed and confirmed")')
await page.waitForSelector('text=Hassan confirmed it')
await snap('confirmed', true)
console.log('✓ Hassan confirmed; full history shown')

// 5. An employee from another team cannot confirm either
await asUser('karim', '#/problems?scope=all&status=fixed')
await openProblem('Stain on the curtain')
await page.getByRole('button', { name: 'Confirm fixed' }).click()
await page.waitForSelector('text=A supervisor, manager or auditor confirms fixes.')
console.log('✓ employees cannot confirm other people\'s fixes')

// 6. Capex: only condition problems in old areas, and they leave the open count
await asUser('laila', '#/problems')
const countText = async () => Number((await page.locator('p[aria-live]').innerText()).match(/\d+/)[0])
const before = await countText()
await openProblem('Dust on the A/C grill')
assert.equal(await page.getByRole('button', { name: 'Send to capex list' }).count(), 0, 'not for care / renovated')
await page.goto(URL + '#/problems')
await openProblem('Rust on the kettle screw')
await page.getByRole('button', { name: 'Send to capex list' }).click()
await snap('capex-confirm')
await page.locator('.sheet').getByRole('button', { name: 'Send to capex list' }).click()
await page.waitForSelector('.split-detail .chip:has-text("Sent to capex list")')
await page.goto(URL + '#/problems')
assert.equal(await countText(), before - 1)
console.log('✓ capex allowed only for condition + old area; it leaves the open count')

// 7. Safety needs an interim note and goes to the top
await asUser('sara', '#/problems/new')
await page.getByLabel('What is the problem?').fill('Loose ladder step')
await page.getByRole('button', { name: 'Pick the place' }).click()
await page.getByRole('searchbox').fill('Activities')
await page.locator('.sheet button.list-row', { hasText: 'Activities Pool' }).click()
await page.getByRole('radio', { name: /Condition/ }).click()
await page.getByRole('radio', { name: 'Yes, safety risk' }).click()
await page.getByRole('button', { name: 'Send problem' }).click()
assert.ok(await page.locator('text=Say what has been done to keep people safe for now.').count())
await page.getByLabel("What we've done in the meantime").fill('Ladder closed with tape')
await snap('safety-form', true)
await page.getByRole('button', { name: 'Send problem' }).click()
await page.waitForSelector('.banner-critical:has-text("Ladder closed with tape")')
await page.goto(URL + '#/problems')
const first = await page.locator('.problem-card').first().innerText()
assert.ok(first.includes('Safety'), 'safety first')
console.log('✓ safety needs an interim note and sorts to the top (rule 9)')

// 8. Filters, including from the URL (used by the summary)
await page.getByRole('button', { name: 'Safety', exact: true }).click()
const cards = await page.locator('.problem-card').allInnerTexts()
assert.ok(cards.length > 0 && cards.every((c) => c.includes('Safety')))
await page.goto(URL + '#/problems?scope=all&status=all&kind=condition&area=old')
const oldCond = await page.locator('.problem-card').allInnerTexts()
assert.ok(oldCond.every((c) => c.includes('Condition') && c.includes('Old area')))
await snap('filters')
console.log('✓ filters work, also from a link')

// 9. Arabic, phone and tablet split view
await asUser('hassan', '#/problems', 'ar')
await snap('ar-list')
await page.setViewportSize({ width: 1024, height: 768 })
await page.locator('.problem-card').first().locator('a.stretched').click()
await page.waitForSelector('.split-detail h1')
await snap('ar-tablet-split')
await asUser('hassan', '#/problems', 'en')
await page.locator('.problem-card').first().locator('a.stretched').click()
await page.waitForSelector('.split-detail h1')
await snap('en-tablet-split')
console.log('✓ tablet shows list and detail side by side')

assert.deepEqual(errors, [])
await browser.close()
server.close()
console.log('All stage 3 checks passed')
