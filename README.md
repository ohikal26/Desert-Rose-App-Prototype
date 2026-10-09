# Desert Rose OE app prototype

A phone and tablet web app that shows the OE 2.0 idea: shift checklists, inspections on the move, and one problem list. Prototype only, with made-up demo data. The full brief is in [BRIEF.md](BRIEF.md).

**Status:** stage 1 of 6 (skeleton). Screenshots are in [docs/screenshots/stage-1](docs/screenshots/stage-1).

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm run dev        # opens on http://localhost:5173
```

## Publish as a static site

```bash
npm run build      # output in dist/
```

Upload the `dist/` folder to any static host (Netlify, GitHub Pages, Azure Static Web Apps, an S3 bucket). The app uses relative paths and hash links, so it works from any folder with no server setup. It must be served over HTTPS for "install to home screen" and offline use.

## Where things are

| What | Where |
|---|---|
| Demo seed data (readable, English) | `src/data/seed.json` |
| Every Arabic string, for native-speaker review | `src/i18n/ar.json` |
| English screen text | `src/i18n/en.json` |
| Design tokens (brand colours, type, spacing) | `src/styles/tokens.css` |
| Brand logo files | `assets/` (web copies made by `npm run icons`) |
| Screenshot script | `scripts/screenshots.mjs` (`npm run build && node scripts/screenshots.mjs <folder>`) |

## Stack

React with TypeScript, built with Vite. Data is kept on the device in IndexedDB (through the small `idb` library) and loaded from `seed.json` on first run; "Reset demo data" reloads it. `vite-plugin-pwa` makes it installable and caches the app and fonts for offline use. Icons are Lucide. Fonts (Tenor Sans, Nunito Sans, Noto Naskh Arabic, IBM Plex Sans Arabic) are bundled from npm, so nothing loads from the internet.

The demo script is added in stage 6.
