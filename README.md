# Desert Rose OE app prototype

A phone and tablet web app that shows the OE 2.0 idea: shift checklists, inspections on the move, and one problem list. Prototype only, with made-up demo data. The full brief is in [BRIEF.md](BRIEF.md).

**Status:** all six stages built. Ready for a live demo.

- UI showcase: [docs/ui-showcase](docs/ui-showcase) (key screens in phone frames, English and Arabic)
- Screenshots: [docs/screenshots/current](docs/screenshots/current)

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm run dev        # opens on http://localhost:5173
```

## Publish it (GitHub Pages)

The repository has a workflow that builds the app and publishes it every time this branch is pushed.

One-time setup, in the GitHub repository: **Settings → Pages → Build and deployment → Source: GitHub Actions.** After the next push (or **Actions → Publish prototype → Run workflow**), the app is at `https://<owner>.github.io/Desert-Rose-App-Prototype/`.

Any other static host works too: run `npm run build` and upload the `dist/` folder. The app uses relative paths and hash links, so it works from any folder. It must be served over HTTPS for "install to home screen" and offline use.

### On the phone or tablet

Open the link in Chrome (Android) or Safari (iPhone, iPad), then **Add to Home Screen**. After the first visit the app opens offline.

## Five-minute demo script

A captioned backup recording of this whole script is in [docs/demo-video](docs/demo-video) (2 min 20 s, phone size), in case the live demo hits a problem. The script is also an automated check: `node scripts/e2e/demo-run.mjs` plays every step in the real app and fails if any button named here is missing; `node scripts/e2e/demo-run.mjs <folder>` re-records the video.

Before the demo: open **Settings → Reset demo data**. Stay in English, or switch to Arabic at any point with the button at the top right; every screen works in both.

**1. Karim, pool attendant (1 minute)**
1. Home shows Karim. Tap **Next up: Quiet Pool → Start checklist**. (Or tap **Scan the code to start** and point the camera at the Quiet Pool code from the QR sheet.)
2. Tap the first task. Type initials **KA**, tap **Save initials**. The task turns teal with initials and time.
3. Tick tasks 2 to 5.
4. On task 6, *Drains and grids free from algae*, tap **Report a problem**. Type *Algae on the drain grid*, tap **Take photo**, pick **Care**, tap **Send problem**. You are back on the checklist.
5. Tick tasks 6 and 7. **Submit checklist** is now enabled. Tap it.

**2. Hassan, supervisor (1 minute)**
1. Tap the name at the top and pick **Hassan**. Switching person always opens that person's home. Home says checklists are *waiting for your check*: Karim's Quiet Pool, and the Activities Pool from earlier this morning.
2. Tap **Quiet Pool**. Point out: *Check the result, not the ticks.* Tap **Result looks right**.
3. Tap **Problems** at the bottom. Open **Algae on the drain grid**. Tap **Change owner or due date**, pick **Karim**, keep *tomorrow*, tap **Save**. The history shows *Hassan gave it to Karim*.

**3. Sara, auditor (1.5 minutes)**
1. Pick **Sara**. Tap **Vacant room inspection → Start inspection**. Type **5212**, tap **Room 5212**.
2. Mark items 1 to 4 **Yes / Good**, tapping **Next item** each time.
3. On *A/C grill*: **Yes** and **Needs work**. Type the note *Dust on the A/C grill*. Tap **Add as a problem**. The form is pre-filled, tagged **Renovated area** from the room. Pick **Care**, tap **Send problem**.
4. Tap **Next item** and mark the rest **Yes / Good**, then **Finish**. The summary shows **Steps followed 10 of 10** and **Result good 9 of 10**, side by side, never one score. Tap **Finish inspection**.
5. Start the same inspection for **4121**. On *Kettle and tray*: **Yes / Not acceptable**, **Add as a problem**: *Rust on the kettle screw*, **Condition**, send. Tap **See the problem**. It is tagged **Old area**. Tap **Send to capex list**, confirm. It leaves the open count but stays on the list.

**4. The rule against confirming your own fix (0.5 minutes)**
1. Pick **Karim**. Tap **Problems**. Open **Algae on the drain grid**. Tap **Mark as fixed**, then **Mark as fixed** again.
2. Tap **Confirm fixed**. The app stops him: *You fixed this, so someone else needs to check it.*
3. Pick **Hassan**. Tap **Problems**, open the algae problem, tap **Confirm fixed**. Closed and confirmed, with the full history.

**5. The general manager (1 minute)**
1. Pick **Samir**. Home shows the key numbers. Tap **See the full summary**.
2. Point out: old and renovated areas apart, condition and care apart, and the repeat at Room 5212.
3. Tap the **Safety** tile. The list shows safety problems first. Open **Broken tiles inside the pool** (Zaitouna Pool): the interim note *Area roped off* sits at the top.

**Leadership page (optional, 1 minute)** Pick **Samir** and tap **Leadership view**, or pick **CEO** or **Owner** from the name menu. Three tabs show what each person looks at, and how often:
- **GM**, every morning: safety now, each department today, and overdue problems that need a push.
- **CEO**, a daily glance plus the weekly trend: safety and overdue against last week, open and overdue over 9 weeks, the two inspection totals, care against condition.
- **Owner**, weekly: safety in one line, the capex list by building, whether renovated areas hold up, and progress toward 2031.

Weeks before the current one are made-up history (`leadershipHistory` in the seed file); the current week comes from the app.

**6. Arabic (throughout)** Tap **العربية** at the top right. The same screen appears in Arabic, right to left.

## Where things are

| What | Where |
|---|---|
| Demo seed data (readable, English) | `src/data/seed.json` |
| Every Arabic string, for native-speaker review | `src/i18n/ar.json` |
| English screen text | `src/i18n/en.json` |
| Design tokens (brand colours, type, spacing) | `src/styles/tokens.css` |
| Who may do what on a problem (rules 6–9) | `src/lib/problems.ts` |
| The two inspection totals (rule 4) | `src/lib/inspections.ts` |
| The one-page summary numbers | `src/lib/summary.ts` |
| Leadership views (GM, CEO, Owner) | `src/lib/leadership.ts`, `src/screens/Leadership.tsx` |
| Brand logo files | `assets/` (web copies made by `npm run icons`) |
| Publishing workflow | `.github/workflows/pages.yml` |

## Checks

Automated end-to-end checks run the real app in a browser at 360 px. Run them after `npm run build`:

| Check | Command |
|---|---|
| Checklists: scan, tick, could not do, send back, confirm | `node scripts/e2e/checklists.mjs <fake-camera.y4m>` (make the camera file with `node scripts/e2e/make-qr-video.mjs DR-LOC:quiet-pool qr.y4m`) |
| Problems: report, assign, fix, confirm (not your own), capex, safety, filters | `node scripts/e2e/problems.mjs scripts/e2e/sample-photo.jpg` |
| Inspections: two marks, add as a problem, summary totals | `node scripts/e2e/inspections.mjs` |
| Offline: service worker, offline tick, offline reload | `node scripts/e2e/offline.mjs` |
| Leadership: three views in both languages, no overflow at 360 px | `node scripts/e2e/leadership.mjs` |
| The full demo script, step by step (and the backup video) | `node scripts/e2e/demo-run.mjs [videoFolder]` |
| Screenshots in both languages at phone and tablet sizes | `node scripts/screenshots.mjs <folder>` |
| UI showcase sheets | `node scripts/showcase.mjs docs/ui-showcase/raw && node scripts/build-showcase.mjs` |

Contrast: every text and background pair used passes WCAG AA (teal on white 5.4:1, teal on page 5.1:1, ink on pearl 11.5:1, each status chip above 4.6:1). Orange is used only in the logo and as a dot in the prototype label.

## Stack

React with TypeScript, built with Vite. Data is kept on the device in IndexedDB (through the small `idb` library) and loaded from `seed.json` on first run; "Reset demo data" reloads it. `vite-plugin-pwa` makes it installable and caches the app and fonts for offline use. Icons are Lucide. QR codes are read on the device with `@zxing/browser`, with "pick from a list" always available. Fonts (Tenor Sans, Nunito Sans, Noto Naskh Arabic, IBM Plex Sans Arabic) are bundled from npm, so nothing loads from the internet.

## Known limits

- No horizontal logo file was supplied, so the header shows the icon alone. Add `assets/DR_logo_horizontal.png`, run `npm run icons`, and change `HEADER_LOGO` in `src/components/Header.tsx`.
- Seed problems have no photos; anything reported during the demo has its photo.
- The QR sheet shows one code per building; the real tool would print one per room.
- "Sync" is simulated: there is no server, so the indicator only reports whether the device is online.
