// Plays the README's five-minute demo script, click by click, in the real app.
// It checks every step and can record a captioned backup video.
// Usage: npm run build && node scripts/e2e/demo-run.mjs [videoDir]
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { serve } from './serve.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const [videoDir] = process.argv.slice(2)
const server = serve()
const URL = 'http://localhost:4179/'
const browser = await chromium.launch()
// With a video, the top 64px is a caption strip above the app; the app itself still gets 360 × 760.
const viewport = { width: 360, height: videoDir ? 824 : 760 }
const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, serviceWorkers: 'block' })
const page = await ctx.newPage()

// Full-resolution recording: Chromium screencast frames (at device pixels), joined by ffmpeg at the end.
const frames = []
let cdp
if (videoDir) {
  mkdirSync(`${videoDir}/frames`, { recursive: true })
  cdp = await ctx.newCDPSession(page)
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = `${videoDir}/frames/${String(frames.length).padStart(5, '0')}.jpg`
    writeFileSync(file, Buffer.from(data, 'base64'))
    frames.push({ file, t: metadata.timestamp })
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 720, maxHeight: 1648, everyNthFrame: 1 })
}
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const pause = (ms = 700) => page.waitForTimeout(videoDir ? ms : 50)

// A caption strip at the bottom of the screen, for the backup video.
async function caption(text) {
  if (!videoDir) return
  await page.evaluate((t) => {
    let el = document.getElementById('demo-caption')
    if (!el) {
      const style = document.createElement('style')
      style.textContent = 'html{padding-top:64px}.header{top:64px!important}'
      document.head.appendChild(style)
      el = document.createElement('div')
      el.id = 'demo-caption'
      el.style.cssText = 'position:fixed;left:0;right:0;top:0;height:64px;z-index:99;background:#1F2A2E;color:#fff;display:flex;align-items:center;'
        + 'font:600 15px/1.35 "Nunito Sans",sans-serif;padding:0 14px;pointer-events:none;direction:ltr;text-align:left'
      document.body.appendChild(el)
    }
    el.textContent = t
  }, text)
  await pause(1600)
}
const tap = async (locator, ms) => { await locator.scrollIntoViewIfNeeded(); await pause(250); await locator.click(); await pause(ms) }
const switchTo = async (name) => {
  await tap(page.locator('.role-chip'))
  await tap(page.locator('.person-btn', { hasText: name }).first())
  await page.waitForSelector(`.role-chip-name:text-is("${name}")`)
}
const step = (s) => console.log('✓', s)

// Before the demo: reset demo data, English
await page.goto(URL)
await page.evaluate(() => { localStorage.setItem('dr.lang', 'en'); localStorage.setItem('dr.user', 'karim') })
await page.goto(URL + '#/settings'); await page.reload()
await page.getByRole('button', { name: 'Reset demo data' }).click()
await page.getByRole('button', { name: 'Yes, reset' }).click()
await page.waitForSelector('text=Demo data is back to the start.')
await page.goto(URL + '#/')
await page.waitForSelector('h1:has-text("Hello, Karim")')

// 1. Karim
await caption('1 · Karim, pool attendant, opens the morning pool checklist.')
await tap(page.locator('.next-card').getByRole('link', { name: 'Start checklist' }))
await page.waitForSelector('h1:has-text("Quiet Pool")')
const ticks = page.locator('.cl-tick')
await tap(ticks.nth(0))
await caption('Each tick records his initials and the time.')
await page.locator('.ini-input').pressSequentially('KA', { delay: videoDir ? 150 : 0 })
await tap(page.getByRole('button', { name: 'Save initials' }))
for (let i = 1; i < 5; i++) await tap(ticks.nth(i), 350)
await caption('Algae on the drain: he reports it with a photo, from the task.')
await tap(page.locator('.cl-item', { hasText: 'Drains and grids' }).getByRole('link', { name: 'Report a problem' }))
await page.getByLabel('What is the problem?').pressSequentially('Algae on the drain grid', { delay: videoDir ? 40 : 0 })
await page.locator('input[type=file]').setInputFiles('scripts/e2e/sample-photo.jpg')
await page.waitForSelector('.thumb img'); await pause()
await tap(page.getByRole('radio', { name: /Care/ }))
await tap(page.getByRole('button', { name: 'Send problem' }))
await page.waitForSelector('h1:has-text("Quiet Pool")')
await tap(ticks.nth(5), 350); await tap(ticks.nth(6), 350)
await caption('Every task done: "Submit checklist" unlocks. A count, never a score.')
await tap(page.getByRole('button', { name: 'Submit checklist' }))
await page.waitForSelector('h1:has-text("Hello, Karim")')
step('1. Karim ticked the checklist, reported algae with a photo, submitted')

// 2. Hassan
await caption('2 · Hassan, supervisor: checklists waiting for his check.')
await switchTo('Hassan')
await page.waitForSelector('text=waiting for your check')
await tap(page.locator('a.list-row', { hasText: 'Quiet Pool' }).first())
await caption('He goes and looks at the pool: he checks the result, not the ticks.')
await tap(page.getByRole('button', { name: 'Result looks right' }))
await page.waitForSelector('.banner-good:has-text("Result looks right")')
await caption('He gives the algae problem to Karim, due tomorrow.')
await tap(page.getByRole('link', { name: 'Back' }).or(page.getByRole('button', { name: 'Back' })).first())
await tap(page.locator('.bottom-nav').getByRole('link', { name: /Problems/ }))
await tap(page.locator('.problem-card', { hasText: 'Algae on the drain grid' }).locator('a.stretched'))
await tap(page.getByRole('button', { name: 'Change owner or due date' }))
await page.locator('.sheet select').selectOption('karim'); await pause()
await tap(page.locator('.sheet').getByRole('button', { name: 'Save' }))
await page.waitForSelector('text=Hassan gave it to Karim')
assert.ok(await page.locator('dd:has-text("Due tomorrow")').count())
step('2. Hassan confirmed the result and assigned the algae to Karim, due tomorrow')

// 3. Sara
await caption('3 · Sara, quality auditor, inspects Room 5212.')
await switchTo('Sara')
await tap(page.locator('article', { hasText: 'Vacant room inspection' }).getByRole('link', { name: 'Start inspection' }))
await page.getByRole('searchbox').pressSequentially('5212', { delay: videoDir ? 120 : 0 })
await tap(page.locator('button.list-row', { hasText: '5212' }))
const mark = async (steps, result) => {
  await tap(page.getByRole('radio', { name: steps, exact: true }), 200)
  await tap(page.getByRole('radio', { name: result, exact: true }), 200)
}
await caption('Two marks per item: were the steps followed, and is the result good?')
for (let i = 0; i < 4; i++) { await mark('Yes', 'Good'); await tap(page.getByRole('button', { name: 'Next item' }), 300) }
await page.waitForSelector('h1:has-text("A/C grill")')
await caption('A/C grill: steps followed, but the result needs work.')
await mark('Yes', 'Needs work')
await page.getByLabel(/Note/).pressSequentially('Dust on the A/C grill', { delay: videoDir ? 40 : 0 })
await tap(page.getByRole('button', { name: 'Add as a problem' }))
await page.waitForSelector('.tag:has-text("Renovated area")')
await caption('The problem is pre-filled and tagged "renovated area" from the room.')
await tap(page.getByRole('radio', { name: /Care/ }))
await tap(page.getByRole('button', { name: 'Send problem' }))
await page.waitForSelector('h1:has-text("A/C grill")')
for (let i = 5; i < 10; i++) { await tap(page.getByRole('button', { name: 'Next item' }), 300); await mark('Yes', 'Good') }
await tap(page.getByRole('button', { name: 'Finish' }))
await page.waitForSelector('text=Problems created: 1')
assert.match(await page.locator('.total').nth(0).innerText(), /10\s*of 10/)
assert.match(await page.locator('.total').nth(1).innerText(), /9\s*of 10/)
await caption('Two separate totals: steps followed 10 of 10, result good 9 of 10. Never one score.')
await tap(page.getByRole('button', { name: 'Finish inspection' }))
await caption('Room 4121, an old building: rust on the kettle.')
await tap(page.locator('article', { hasText: 'Vacant room inspection' }).getByRole('link', { name: 'Start inspection' }))
await page.getByRole('searchbox').pressSequentially('4121', { delay: videoDir ? 120 : 0 })
await tap(page.locator('button.list-row', { hasText: '4121' }))
for (let i = 0; i < 3; i++) { await mark('Yes', 'Good'); await tap(page.getByRole('button', { name: 'Next item' }), 300) }
await page.waitForSelector('h1:has-text("Kettle and tray")')
await mark('Yes', 'Not acceptable')
await tap(page.getByRole('button', { name: 'Add as a problem' }))
await page.getByLabel('What is the problem?').pressSequentially('Rust on the kettle screw', { delay: videoDir ? 40 : 0 })
await page.waitForSelector('.tag:has-text("Old area")')
await tap(page.getByRole('radio', { name: /Condition/ }))
await tap(page.getByRole('button', { name: 'Send problem' }))
await tap(page.getByRole('button', { name: 'See the problem' }))
await caption('Condition, in an old area: it goes to the capex list and leaves the team’s open count.')
await tap(page.getByRole('button', { name: 'Send to capex list' }))
await tap(page.locator('.sheet').getByRole('button', { name: 'Send to capex list' }))
await page.waitForSelector('.split-detail .chip:has-text("Sent to capex list")')
step('3. Sara inspected 5212 (two totals 10/10 and 9/10) and sent the 4121 kettle to the capex list')

// 4. Karim fixes, cannot confirm; Hassan confirms
await caption('4 · Karim cleans the drain and marks it fixed.')
await switchTo('Karim')
await tap(page.locator('.bottom-nav').getByRole('link', { name: /Problems/ }))
await tap(page.locator('.problem-card', { hasText: 'Algae on the drain grid' }).locator('a.stretched'))
await tap(page.getByRole('button', { name: 'Mark as fixed' }))
await tap(page.locator('.sheet').getByRole('button', { name: 'Mark as fixed' }))
await caption('He tries to confirm his own fix. The app stops him.')
await tap(page.getByRole('button', { name: 'Confirm fixed' }))
await page.waitForSelector('text=You fixed this, so someone else needs to check it')
await pause(1800)
await tap(page.getByRole('button', { name: 'OK' }))
await caption('Hassan checks it and confirms.')
await switchTo('Hassan')
await tap(page.locator('.bottom-nav').getByRole('link', { name: /Problems/ }))
await tap(page.locator('.problem-card', { hasText: 'Algae on the drain grid' }).locator('a.stretched'))
await tap(page.getByRole('button', { name: 'Confirm fixed' }))
await page.waitForSelector('.split-detail .chip:has-text("Closed and confirmed")')
await caption('Closed and confirmed, with the full history: who reported, assigned, fixed and confirmed.')
await page.locator('#hist').scrollIntoViewIfNeeded(); await pause(1500)
step('4. Karim blocked from confirming his own fix; Hassan confirmed it')

// 5. GM
await caption('5 · Samir, the GM: the whole resort at a glance.')
await switchTo('Samir')
await tap(page.getByRole('link', { name: 'See the full summary' }))
await page.waitForSelector('h1:has-text("Summary")')
await caption('Old and renovated areas apart; condition and care apart; repeats called out.')
await page.locator('#repeats').scrollIntoViewIfNeeded(); await pause(1800)
await page.evaluate(() => window.scrollTo(0, 0)); await pause()
await caption('Tap a number to see the list behind it: safety first.')
await tap(page.locator('.tile', { hasText: 'Safety' }))
await tap(page.locator('.problem-card', { hasText: 'Broken tiles inside the pool' }).locator('a.stretched'))
await page.waitForSelector('.banner-critical:has-text("Area roped off")')
step('5. GM summary, safety tile, Zaitouna Pool with its interim note')

// Leadership
await caption('Leadership: what the GM, CEO and Owner each look at, and how often.')
await tap(page.getByRole('button', { name: 'Back' }))
await tap(page.locator('.bottom-nav').getByRole('link', { name: /Home/ }))
await tap(page.getByRole('link', { name: 'Leadership view' }))
await page.waitForSelector('h1:has-text("Leadership")')
await pause(1200)
await tap(page.getByRole('tab', { name: 'CEO' }), 1500)
await page.locator('#ceo-trend').scrollIntoViewIfNeeded(); await pause(1800)
await page.evaluate(() => window.scrollTo(0, 0))
await tap(page.getByRole('tab', { name: 'Owner' }), 1500)
await page.locator('#own-capex').scrollIntoViewIfNeeded(); await pause(1800)
assert.ok(await page.locator('.capex-items a', { hasText: 'Rust on the kettle screw' }).count(), 'demo capex item reaches the owner view')
step('Leadership: GM, CEO and Owner tabs; the kettle Sara sent shows on the Owner’s capex list')

// 6. Arabic
await page.evaluate(() => window.scrollTo(0, 0))
await caption('6 · The same screen in Arabic, right to left.')
await tap(page.getByRole('button', { name: 'Switch language to Arabic' }), 1200)
await page.waitForSelector('h1:has-text("القيادة")')
assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl')
await pause(2000)
step('6. Arabic, right to left')

assert.deepEqual(errors, [])
if (cdp) {
  await pause(1500)
  await cdp.send('Page.stopScreencast')
  // Each frame lasts until the next one arrives.
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.02, ((frames[i + 1]?.t ?? f.t + 1.5) - f.t)).toFixed(3)}`).join('\n')
  writeFileSync(`${videoDir}/frames.txt`, `${list}\nfile '${frames[frames.length - 1].file}'\n`)
  const out = `${videoDir}/demo.mp4`
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${videoDir}/frames.txt`,
    '-vf', 'scale=720:-2,fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out])
  console.log('video:', out)
}
await ctx.close()
await browser.close()
server.close()
console.log('Demo script passed end to end')
