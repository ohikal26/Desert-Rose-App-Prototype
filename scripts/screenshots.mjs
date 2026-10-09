// Takes stage screenshots of the built app. Usage: npm run build && node scripts/screenshots.mjs <outDir>
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const OUT = process.argv[2] ?? 'screenshots'
const DIST = new URL('../dist/', import.meta.url).pathname
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.endsWith('/')) p += 'index.html'
  try {
    const body = await readFile(join(DIST, p))
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
}).listen(4179)

const sizes = { phone: { width: 360, height: 640 }, tablet: { width: 1024, height: 768 }, 'tablet-portrait': { width: 768, height: 1024 } }
const shots = [
  { name: 'employee', user: 'karim' },
  { name: 'supervisor', user: 'hassan' },
  { name: 'auditor', user: 'sara' },
  { name: 'gm', user: 'samir' },
  { name: 'settings', user: 'karim', hash: '#/settings' },
  { name: 'role-switcher', user: 'karim', click: 'Users' },
  { name: 'checklist-in-progress', user: 'hassan', hash: '#/checklist/run-seed-2' },
  { name: 'checklist-review', user: 'hassan', hash: '#/checklist/run-seed-1' },
  { name: 'checklist-sent-back', user: 'hassan', hash: '#/checklist/run-seed-3' },
  { name: 'checklist-employee', user: 'mona', hash: '#/checklist/run-seed-5' },
]
const browser = await chromium.launch()
for (const [sizeName, viewport] of Object.entries(sizes)) {
  for (const lang of ['en', 'ar']) {
    for (const s of shots) {
      if (sizeName === 'tablet-portrait' && s.name.startsWith('checklist')) continue
      if (sizeName !== 'phone' && ['settings', 'role-switcher', 'auditor', 'checklist-in-progress', 'checklist-sent-back'].includes(s.name)) continue
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, serviceWorkers: 'block' })
      await ctx.addInitScript(([l, u]) => { localStorage.setItem('dr.lang', l); localStorage.setItem('dr.user', u) }, [lang, s.user])
      const page = await ctx.newPage()
      await page.goto(`http://localhost:4179/${s.hash ?? ''}`)
      await page.waitForSelector('h1')
      if (s.click) await page.locator('.who .btn').click()
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(300)
      // Grow the viewport to the page height so the sticky bottom bar lands at the end, as on a device.
      if (!s.click) {
        const h = await page.evaluate(() => document.documentElement.scrollHeight)
        await page.setViewportSize({ width: viewport.width, height: Math.max(h, viewport.height) })
      }
      await page.screenshot({ path: `${OUT}/${sizeName}-${lang}-${s.name}.png` })
      await ctx.close()
    }
  }
}
await browser.close()
server.close()
console.log('saved to', OUT)
