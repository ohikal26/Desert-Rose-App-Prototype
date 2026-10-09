// Lays the captured screens out in phone frames and renders one PNG per language.
// Usage: node scripts/showcase.mjs docs/ui-showcase/raw && node scripts/build-showcase.mjs
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = resolve('docs/ui-showcase')
const font = (p) => resolve('node_modules/@fontsource', p)
const copy = {
  en: {
    dir: 'ltr', title: 'Desert Rose OE', sub: 'How the app could look and work · prototype screens, demo data',
    tabletCap: 'On a tablet, the list and the problem sit side by side.',
    shots: [
      ['1-home', 'Home: employee', 'One clear next step. Today’s checklist sits within reach of the thumb.'],
      ['2-checklist', 'Shift checklist', 'Big rows. Each tick shows initials and time. Progress is a count, never a score.'],
      ['3-review', 'Supervisor check', 'The supervisor checks the place, not the ticks, then confirms or sends back.'],
      ['4-problems', 'Problem list', 'Safety first, then overdue. Every card shows what, where, who and when.'],
      ['5-safety', 'Safety problem', 'What has been done in the meantime always sits on top.'],
      ['6-report', 'Report a problem', 'What, where, a photo and two tags. Under a minute.'],
      ['7-gm', 'Home: general manager', 'Large numbers. Each one opens the list behind it.'],
    ],
  },
  ar: {
    dir: 'rtl', title: 'Desert Rose OE', sub: 'كيف يمكن أن يبدو التطبيق ويعمل · شاشات النموذج، بيانات تجريبية',
    tabletCap: 'على الجهاز اللوحي، تظهر القائمة والمشكلة جنباً إلى جنب.',
    shots: [
      ['1-home', 'الرئيسية: الموظف', 'خطوة تالية واضحة. قائمة مهام اليوم في متناول الإبهام.'],
      ['2-checklist', 'قائمة مهام الوردية', 'صفوف كبيرة. كل مهمة تُظهر الأحرف الأولى والوقت. التقدم عدد، وليس تقييماً.'],
      ['3-review', 'مراجعة المشرف', 'يراجع المشرف المكان لا العلامات، ثم يؤكد النتيجة أو يعيدها.'],
      ['4-problems', 'قائمة المشكلات', 'السلامة أولاً ثم المتأخرة. كل بطاقة تُظهر ماذا وأين ومن ومتى.'],
      ['5-safety', 'مشكلة سلامة', 'ما تم فعله في الوقت الحالي يظهر دائماً في الأعلى.'],
      ['6-report', 'الإبلاغ عن مشكلة', 'ماذا وأين وصورة ووسمان. في أقل من دقيقة.'],
      ['7-gm', 'الرئيسية: المدير العام', 'أرقام كبيرة. كل رقم يفتح القائمة التي خلفه.'],
    ],
  },
}

function page(lang) {
  const c = copy[lang]
  const phones = c.shots.map(([f, h, cap]) => `
    <figure class="phone-fig">
      <div class="phone"><img src="raw/${lang}-${f}.png" alt="${h}"></div>
      <figcaption><strong>${h}</strong><span>${cap}</span></figcaption>
    </figure>`).join('')
  return `<!doctype html><html lang="${lang}" dir="${c.dir}"><head><meta charset="utf-8">
<style>
@font-face { font-family: 'Tenor Sans'; src: url('file://${font('tenor-sans/files/tenor-sans-latin-400-normal.woff2')}'); }
@font-face { font-family: 'Nunito Sans'; font-weight: 400; src: url('file://${font('nunito-sans/files/nunito-sans-latin-400-normal.woff2')}'); }
@font-face { font-family: 'Nunito Sans'; font-weight: 700; src: url('file://${font('nunito-sans/files/nunito-sans-latin-700-normal.woff2')}'); }
@font-face { font-family: 'Noto Naskh Arabic'; font-weight: 600; src: url('file://${font('noto-naskh-arabic/files/noto-naskh-arabic-arabic-600-normal.woff2')}'); }
@font-face { font-family: 'IBM Plex Sans Arabic'; font-weight: 400; src: url('file://${font('ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2')}'); }
@font-face { font-family: 'IBM Plex Sans Arabic'; font-weight: 700; src: url('file://${font('ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2')}'); }
* { box-sizing: border-box; }
body { margin: 0; width: 2400px; background: #FAF8F4; color: #1F2A2E;
  font-family: ${lang === 'ar' ? "'IBM Plex Sans Arabic', 'Nunito Sans'" : "'Nunito Sans'"}, sans-serif; }
header { display: flex; align-items: center; gap: 28px; padding: 64px 96px 40px; }
header img { height: 88px; }
h1 { margin: 0; font-family: 'Tenor Sans', serif; font-weight: 400; font-size: 56px; color: #007681; }
header p { margin: 6px 0 0; font-size: 26px; color: #5F676B; }
.band { height: 10px; background: linear-gradient(90deg, #007681 0 70%, #E8E3DB 70% 92%, #E05E27 92%); }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 56px 48px; padding: 64px 96px 40px; }
.phone-fig { margin: 0; display: flex; flex-direction: column; gap: 22px; align-items: center; }
.phone { width: 400px; padding: 14px; background: #1F2A2E; border-radius: 56px; box-shadow: 0 30px 60px -30px rgba(31,42,46,.45); }
.phone img { display: block; width: 100%; border-radius: 42px; }
figcaption { width: 400px; display: flex; flex-direction: column; gap: 6px; font-size: 22px; line-height: 1.45; }
${lang === 'ar' ? 'figcaption { line-height: 1.7; } h1 { font-family: "Tenor Sans"; }' : ''}
figcaption strong { font-size: 24px; color: #007681; }
figcaption span { color: #5F676B; }
.tablet-fig { grid-column: 1 / -1; display: grid; grid-template-columns: 1400px 1fr; align-items: center; gap: 48px; margin-top: 24px !important; }
.tablet { padding: 16px; background: #1F2A2E; border-radius: 36px; }
.tablet img { display: block; width: 100%; border-radius: 22px; }
footer { padding: 24px 96px 64px; font-size: 20px; color: #5F676B; }
</style></head><body>
<div class="band"></div>
<header><img src="../../public/logo/DR_logo_icon.png" alt=""><div><h1>${c.title}</h1><p>${c.sub}</p></div></header>
<div class="grid">${phones}
  <figure class="tablet-fig" style="margin:0">
    <div class="tablet"><img src="raw/${lang}-tablet.png" alt=""></div>
    <figcaption style="width:auto"><strong>${lang === 'ar' ? 'الجهاز اللوحي' : 'Tablet'}</strong><span>${c.tabletCap}</span></figcaption>
  </figure>
</div>
<footer>${lang === 'ar' ? 'نموذج تجريبي ببيانات غير حقيقية. الأسماء من اختراعنا.' : 'Prototype with made-up demo data. All names are made up.'}</footer>
</body></html>`
}

const stamp = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}` })()
const browser = await chromium.launch()
for (const lang of ['en', 'ar']) {
  const file = `${DIR}/showcase-${lang}.html`
  writeFileSync(file, page(lang))
  const p = await browser.newPage({ viewport: { width: 2400, height: 1000 }, deviceScaleFactor: 1 })
  await p.goto('file://' + file)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${DIR}/UI-showcase_${lang.toUpperCase()}_${stamp}.png`, fullPage: true })
  await p.close()
}
await browser.close()
console.log('done')
