# Brief: Desert Rose OE app prototype

**For:** Claude Code
**From:** Omar Hikal, PCC, for Desert Rose Resort, Hurghada
**Date:** 9 October 2026

Logo files come with this brief in the `assets/` folder (see section 10.9). Read the whole brief before writing any code. Build in the stages in section 13. Stop at the end of each stage, show what you built, and wait for my go-ahead. If something in this brief is unclear or seems wrong, ask. Don't guess.

---

## 1. Context

Desert Rose is a 911-room all-inclusive resort in Hurghada, on Egypt's Red Sea coast. Since 2012 it has run a quality system called Organizational Excellence (OE): standards, audits, scorecards and reports. The system now has to evolve ("OE 2.0") so the resort can become Hurghada's leading upper-upscale resort by 2031.

Today, follow-up on problems runs on WhatsApp and paper. Audits are done on paper and typed up later. Shift checklists don't exist for most teams. The plan is for one simple phone and tablet app to do three jobs:

1. Shift checklists for each team
2. Inspections done on the move, with photos
3. One list of every problem found, tracked until it's fixed

The resort will most likely buy an existing tool for real use. **This prototype exists to show the idea and test it with real staff**, so we learn exactly what the bought tool must do.

The team is the same team that got the resort here. Many staff read Arabic far better than English. Everything must be simple enough for a 14-year-old to understand, without ever talking down to anyone.

## 2. Purpose and limits

- **Who sees it first:** Fady (owner side) and Ashraf (CEO), in a five-minute demo. After that, supervisors in two departments will try it.
- **What it is:** a working prototype with saved demo data. Every main flow works end to end.
- **What it is not:** a production system. No real guest or staff data. No real login security. No links to other systems.
- **Show on every screen:** a small "Prototype · demo data" label.

## 3. Users and roles

The prototype has a role switcher on the home screen, so one person can demo every role. No passwords.

| Role | Example demo user | What they do in the app |
|---|---|---|
| Line employee | Karim, pool attendant; Mona, room attendant | Open their shift checklist, tick tasks, add initials, report a problem with a photo |
| Supervisor | Hassan, Recreation supervisor; Nadia, Housekeeping supervisor | See which checklists are done, check the result of each one, confirm or send back, assign problems |
| OE auditor | Sara, Quality auditor | Run an inspection on the move, take photos, score steps and results, create problems from findings |
| Head of department / GM | Tarek, Recreation manager; Laila, Housekeeping manager; the GM | See the problem list for their area and a one-page summary |

All names are made up. Keep them made up.

## 4. Scope

**In scope**
- Home screen with role switcher and language switch
- Shift checklists (section 7.2)
- Inspections (section 7.3)
- The problem list (section 7.4)
- A one-page summary for heads and the GM (section 7.5)
- A printable page of QR codes, one per location
- Two departments: **Recreation** and **Housekeeping**
- Arabic and English, switchable at any time
- Works offline, catches up when the connection returns
- A "Reset demo data" button in settings

**Out of scope**
- Real login, user management or permissions beyond the role switcher
- Links to Opera, Power BI, WhatsApp or email (show a disabled "Export to Power BI" button with the note "Coming in the real tool")
- Any bonus, pay, score league table or ranking of staff
- Push notifications (show in-app badges instead)
- Any mention of money

## 5. Locations and demo content

### 5.1 Recreation

Locations: Quiet Pool, Activities Pool, Aqua Park, Zaitouna Pool, Beach (Lagoon), Beach (Open Sea), Towel Centre (Quiet Pool), Towel Centre (Beach).

**Shift checklist: Pool opening (morning shift).** Use this one in full. Make similar 5–7 item lists for the other locations.
1. Lifeguard in the chair before the first guest arrives
2. Lifebuoy, rescue tube and first aid bag in place and complete
3. Water clear; skim the surface and empty the skimmer baskets
4. Water test done and written down (chlorine and pH), within the limits on the board
5. Foot basin and shower working and clean
6. Drains and grids free from algae
7. Pool rules and depth signs in place and readable

**Shift checklist: Towel centre (morning shift).**
1. Towel stock counted and written in the log book
2. One towel per towel card
3. Clean and used towels kept on separate trolleys
4. Counter tidy and staffed from opening time

**Shift checklist: Aqua Park opening (morning shift).**
1. Lifeguard and beach boys in place; nobody leaves without a replacement
2. Slides, towers, stairs and ladders checked: clean, safe, nothing loose
3. Anti-slip mats in place
4. Height rule sign in place (minimum 120 cm)
5. Music, instruction boards and floaters ready

### 5.2 Housekeeping

Locations: guest Buildings 1000 to 8000, with room numbers in the form 1101 or 4216 (building, floor, room). The HK stores and the laundry handover point are also locations.

**Old and renovated buildings (demo assumption, to be confirmed by Desert Rose):** treat Buildings 1000, 4000 and 6000 as old, and the others as renovated. Every room inherits its building's status.

**Shift checklist: Room attendant, start of shift.**
1. Trolley stocked and sorted; clean linen on the top shelves only
2. Colour-coded cloths ready (one colour for bathroom, one for room)
3. Chemicals labelled and diluted correctly
4. Room order for today checked with the supervisor
5. Lost and found bag on the trolley

**Shift checklist: Vacant room ready (one per room).**
1. Bathroom cleaned, sanitised and fully supplied
2. Drains open and clean
3. Kettle, cups and tea and coffee tray clean and full
4. A/C grill dust-free; A/C working
5. Minibar clean and filled
6. Safe box checked, cleaned and left open
7. Curtains clean, with no stains
8. Dusting done, behind and under the bed too

### 5.3 Inspection templates

Each inspection item has **two separate scores**, as section 6 explains.

**Recreation pool inspection (sample, 8 items):** lifeguard in position and alert; rescue equipment complete; water clarity; water test records up to date; drains and grids; foot basin and shower; sunbeds, tables and umbrellas; floor free from hazards.

**Housekeeping vacant room inspection (sample, 10 items):** entrance and door; bathroom; drains; kettle and tray; A/C grill; minibar; safe box; curtains; dusting; bed and linen.

### 5.4 Seed problems

Start the problem list with about 15 open problems so the demo looks real. Include at least these:

| Location | Problem | Type | Area | Status |
|---|---|---|---|---|
| Room 5212 | Dust on the A/C grill | Care | Renovated | Open, due tomorrow |
| Room 3103 | Stain on the curtain | Care | Renovated | Fixed, waiting for check |
| Room 4121 | Rust on the kettle screw | Condition | Old | Open |
| Room 6207 | Broken remote control | Condition | Old | Overdue |
| Building 1000 corridor | Moisture marks on the wall | Condition | Old | Sent to capex list |
| Zaitouna Pool | Broken tiles inside the pool | Condition | — | Open, safety, interim control: area roped off |
| Aqua Park | Algae on a drain grid | Care | — | Open |
| Quiet Pool | Uneven floor near the ladder | Condition | — | Overdue, safety |
| Towel Centre (Beach) | Log book not filled in | Care | — | Closed and confirmed |

## 6. Rules the app must follow

These rules come from the analysis of the current system. Each must be visible in the prototype, because the demo is partly about showing them.

1. **Checklists are never scored.** No percentages, no stars, no league tables. A checklist is done or not done.
2. **Each ticked task records who and when.** The person adds their initials (two or three letters); the app adds the time.
3. **Supervisors check the result, not the initials.** For each completed checklist, the supervisor taps "Result looks right" or "Send back", with a note and an optional photo.
4. **Inspections keep steps and results apart.** Each item gets two marks: "Steps followed" (yes / partly / no) and "Result" (good / needs work / not acceptable). Show two separate totals. Never merge them into one score.
5. **Every finding gets two tags:** old or renovated area (filled in automatically from the location), and condition (building, furniture, equipment) or care (cleaning, service, upkeep).
6. **Condition findings in an old area can be sent to the capex list.** They stay visible but leave the team's open count.
7. **Every problem has an owner, a due date and a status:** Open → Fixed (waiting for check) → Closed and confirmed. Also "Overdue" (automatic) and "Sent to capex list".
8. **The person who fixes a problem cannot confirm it.** Someone else must tap "Confirm fixed", and the app blocks the owner from doing it.
9. **Safety problems stand out.** A safety flag puts them at the top of every list, and they need a short "What we've done in the meantime" note.
10. **Plain words only.** No jargon anywhere on screen. Section 10.7 lists the words to use.

## 7. Screens

### 7.1 Home
- The Desert Rose horizontal logo, the "Prototype · demo data" label, the role switcher, the language switch (العربية / English)
- What appears next depends on the role: "My checklists today" (employee), "My team today" (supervisor), "Start an inspection" (auditor), "Summary" (head or GM)
- A connection indicator: "Online · saved" or "Offline · will sync"

### 7.2 Shift checklists
- **Start:** scan a QR code at the location, or pick the location from a list (keep the fallback; cameras fail)
- **The checklist:** location, shift and date at the top, then 5–9 large tappable items. Tapping an item marks it done with initials and time. Each item has a "Report a problem" link.
- **Finish:** "Submit checklist" is enabled only when every item is done or has a reason ("Could not do: …")
- **Supervisor view:** today's checklists by location, showing done, in progress, not started and sent back. Tap one to see who did what and when, then mark "Result looks right" or "Send back"

### 7.3 Inspections
- Pick a template and a location
- One item per screen on a phone; a list with a side panel on a tablet
- For each item: the steps mark, the result mark, an optional photo (the camera opens directly), and an optional note
- "Add as a problem" on any item creates a problem, pre-filled with the location, the item, the photo and both tags
- **Summary at the end:** the two totals side by side ("Steps followed: 8 of 9", "Result good: 6 of 9") and the list of problems created

### 7.4 The problem list
- Filters: my problems, my area, all; status; safety; condition or care; old or renovated
- Each card shows: what, where, the photo thumbnail, the owner, the due date, the status chip, and the tags
- The problem screen shows its full history (who created it, assigned it, fixed it, confirmed it, with times) and the actions allowed for the current role
- Creating a problem: what (short text), where (location picker), photo, condition or care, safety yes or no, owner, due date (default: tomorrow)

### 7.5 One-page summary (head of department and GM)
- Open problems, overdue problems, problems closed on time this week, and repeats (the same item at the same location twice in 30 days)
- Old and renovated areas shown separately; condition and care shown separately
- Checklists completed today and sent back today
- Large numbers and short labels. One small bar chart at most. Each number is tappable and opens the filtered list.

### 7.6 QR code sheet
- A printable A4 page with one QR code per location, each labelled in Arabic and English

### 7.7 Settings
- Language, text size (normal / large), reset demo data, and an about screen describing the prototype and its limits

## 8. Data model

Keep it simple. Suggested entities:

- **Location:** id, name (Arabic and English), department, type, building, old or renovated, QR value
- **ChecklistTemplate:** id, department, location type, shift, items (Arabic and English text)
- **ChecklistRun:** id, template, location, date, shift, item entries (done, initials, time, could-not-do reason), submitted at, supervisor check (result OK or sent back, note, photo, by, at)
- **InspectionTemplate / InspectionRun:** like the above, with steps mark, result mark, photo and note per item
- **Problem:** id, title, location, photo, condition or care, old or renovated, safety flag, interim action, owner, due date, status, history entries, source (checklist, inspection or reported)
- **User:** id, name, role, department, initials

## 9. Language

- Arabic and English, switchable from any screen. The choice is remembered.
- **Arabic must be right-to-left throughout:** layout, icons with direction, lists, progress, swipe.
- Use Western digits (0–9) in both languages, as the resort's reports do.
- All demo content (locations, checklist items, problems) exists in both languages.
- I've drafted the core Arabic terms below. Mark every Arabic string in one file so a native speaker can review it before the demo.

| English | Arabic (draft) |
|---|---|
| Checklist | قائمة المهام |
| Shift | الوردية |
| Morning / Evening / Night shift | الوردية الصباحية / المسائية / الليلية |
| Done | تم |
| Could not do | تعذّر التنفيذ |
| Submit | إرسال |
| Report a problem | الإبلاغ عن مشكلة |
| Problem list | قائمة المشكلات |
| Owner | المسؤول |
| Due date | الموعد المحدد |
| Open / Fixed / Closed | مفتوحة / تم الإصلاح / مغلقة |
| Confirm fixed | تأكيد الإصلاح |
| Overdue | متأخرة |
| Sent to capex list | أُحيلت لقائمة الاستثمار |
| Inspection | جولة تفتيش |
| Steps followed | الخطوات المتّبعة |
| Result | النتيجة |
| Condition | حالة المبنى والمعدات |
| Care | العناية والخدمة |
| Old area / Renovated area | منطقة قديمة / منطقة مجدَّدة |
| Safety | سلامة |
| Result looks right / Send back | النتيجة سليمة / إعادة |
| Online · saved / Offline · will sync | متصل · تم الحفظ / غير متصل · ستتم المزامنة |

## 10. Design standards

### 10.1 Feel
Calm, clear, local. It should feel like a Desert Rose tool, not a generic app: warm pearl and white backgrounds, the brand teal, and one orange accent, as in the Desert Rose Brand Manual. No decoration that doesn't help someone finish a task.

### 10.2 Colour

These are the official Desert Rose brand colours, taken from the Desert Rose Brand Manual (version 1.0, by The Brand Company). Use these hex values exactly.

| Token | Hex | Brand name | Use |
|---|---|---|---|
| teal | #007681 | Teal (primary) | Primary buttons, headers, selected states, links |
| orange | #E05E27 | Orange (primary) | One accent per screen: the main call to action, a key number or the logo icon. Never small text on light backgrounds (contrast too low) |
| stone | #A44E3A | Stone (secondary) | Orange-family text on light backgrounds, e.g. labels and counts that need warmth |
| sage | #698272 | Sage green (secondary) | Quiet accents and illustrations; large text only |
| pearl | #E8E3DB | Pearl (secondary) | Panels, chips and section bands; use ink text on it, not teal |
| dusty-pink | #B07C6F | Dusty pink (secondary) | Decoration only, never for text or status |
| page | #FAF8F4 | (light tint of pearl) | Page background |
| card | #FFFFFF | | Cards and inputs |
| ink | #1F2A2E | | Main text |
| grey | #5F676B | | Secondary text |
| hairline | #DDD6CA | | Borders and dividers |
| good | #3F6B52 | (darkened sage) | "Closed and confirmed", "Result looks right" |
| warning | #8A5A12 | | "Due soon", "Needs work" |
| critical | #B42318 | | "Overdue", "Not acceptable", safety |

- **Contrast:** text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Teal on white or page passes. Teal on pearl does not pass for small text, so use ink there. Orange passes only for large text, so use stone when orange-family text is small. Check every combination you use.
- **Colour never carries meaning alone.** Every status chip has a word and an icon as well as a colour. Many staff work in bright sun.

### 10.3 Type
- **The brand typefaces are Optima** (primary, for headlines and text) **and Brandon Text** (supporting, for body and captions). The script face in the brand manual, Beautifully Delicious, is not used in the app.
- Optima and Brandon Text are commercial fonts. If Desert Rose provides licensed web font files, use them. Until then, use these stacks:
  - Titles: `Optima, "Tenor Sans", "Segoe UI", sans-serif` (Optima is built into iPhone and iPad; Tenor Sans comes from Google Fonts)
  - Body: `"Brandon Text", "Nunito Sans", "Segoe UI", sans-serif` (Nunito Sans comes from Google Fonts)
  - Arabic titles: Noto Naskh Arabic. Arabic body: IBM Plex Sans Arabic. Both come from Google Fonts. The brand manual has no Arabic typeface.
- Bundle the web fonts so they work offline.
- **Sizes:** body 17px minimum (19px in large-text mode), labels 15px minimum, screen titles 24–28px, key numbers on the summary 40px or more
- **Line height:** 1.4 for Latin and 1.7 for Arabic
- **Sentence case** everywhere. The brand manual uses spaced capitals for small labels ("HURGHADA RED SEA"); use them only for one-word section labels, never for sentences or buttons.
### 10.4 Layout
- **Phone first:** design for a 360 × 640 screen, a low-cost Android phone. Then a tablet at 768–1024 px, landscape and portrait.
- **Touch targets** at least 48 × 48 px; checklist items at least 64 px tall
- **Spacing** on an 8 px grid; 16 px side margins on phones
- **One main action per screen,** placed at the bottom within thumb reach on phones
- **Tablet:** list on one side and detail on the other, flipped in Arabic

### 10.5 Components
- Cards with 12 px rounded corners, a white fill and a hairline border (pearl for grouped panels); no heavy shadows
- Status chips: pill shape, word plus icon plus colour
- Checklist items: a large row, a circle that fills teal with a white tick when done, initials and time shown beneath
- Buttons: primary is a teal fill with white text; secondary is a teal outline; destructive actions are text only, with a confirmation
- Photos: a square thumbnail; tap for full screen
- Use one simple line-icon set throughout (for example Lucide). Icons always come with a label.

### 10.6 States
Design every screen for: loading, empty ("No problems here. Good work."), offline, error ("That didn't save. We'll try again when you're online."), and success (a short confirmation that disappears on its own).

### 10.7 Words on screen
- Short, plain and friendly, written the way a good supervisor talks
- Say "Problem", not "non-conformity" or "finding". Say "Check", not "audit", in employee views (auditors may see "Inspection"). Say "Fixed", not "remediated".
- Never blame. Write "Sent back: please check the drain again", not "Failed".
- Write button labels as verbs: "Start checklist", "Take photo", "Confirm fixed"

### 10.8 Accessibility
- Works with large text and the screen reader on both iOS and Android
- Every image and icon has a text label
- Nothing depends on colour, hover or long-press alone

### 10.9 Logo and assets

The `assets/` folder holds the official logo, taken from the Desert Rose Brand Manual:

| File | What it is | Where to use it |
|---|---|---|
| `DR_logo_horizontal.png` | Icon and DESERT ROSE side by side, full colour | App header on every screen; QR code sheet |
| `DR_logo_primary.png` | Icon above DESERT ROSE and HURGHADA RED SEA, full colour | Splash screen and the about screen |
| `DR_logo_icon.png` | The orange sun-rose icon alone | Home-screen app icon and browser tab icon (place it on pearl or white with even padding) |
| `DR_logo_reversed.png` | Primary lockup in pearl, for use on teal | Splash screen if it has a teal background |

All four are transparent PNGs. Brand rules from the manual:
- Never recolour, stretch, rotate or rearrange the logo, and never place it on a busy background
- Keep clear space around it equal to twice the height of the wordmark
- Use the full-colour version on light backgrounds and the reversed version on teal
- The logo belongs to Desert Rose; the PCC logo does not appear in the app

## 11. Technical approach

- **A web app that installs to the home screen** (a Progressive Web App). Nothing comes from an app store, and it opens from a link.
- **Stack:** your choice, kept simple and well known, for example React with TypeScript and Vite. Tell me what you chose and why in one paragraph.
- **No backend.** All data lives on the device (IndexedDB), seeded from a JSON file. "Reset demo data" reloads the seed.
- **Offline:** the app shell and fonts are cached by a service worker, and all actions work offline. Simulate "syncing" with the indicator, since there's no server.
- **Camera:** use the device camera through a standard file input with capture, and store photos on the device, resized to keep them small.
- **QR scanning:** use a maintained browser library. Always keep the "pick from a list" fallback.
- **Must run on:** current Chrome on Android, current Safari on iPhone and iPad.
- **Deliver:** the source code, a README with how to run it locally and how to publish it as a static site, and the seed data in a separate, readable file.

## 12. Definition of done

- All flows in section 7 work in both languages, on a phone and on a tablet, online and offline
- The rules in section 6 are enforced, not just displayed
- The seed data from section 5 loads, and "Reset demo data" restores it
- Every screen has been checked at 360 px wide in Arabic and in English
- Every Arabic string sits in one file, ready for review
- A README, plus the demo script below

## 13. Build in stages

Stop after each stage and show me.

1. **Skeleton:** home, role switcher, language switch with full right-to-left support, design tokens, the seed data loaded. Show me screenshots in both languages at phone and tablet sizes.
2. **Shift checklists:** the employee flow and the supervisor check, with QR scanning and the list fallback.
3. **Problem list:** create, assign, fix, confirm (with the rule against confirming your own fix), capex, safety, filters, history.
4. **Inspections:** the two marks per item, photos, "Add as a problem", the summary with two totals.
5. **Summary page and QR sheet.**
6. **Offline, polish and the README:** offline behaviour, every empty and error state, the large-text mode, a contrast check, and the demo script.

## 14. Demo script (five minutes, for Fady and Ashraf)

Write this into the README as a click-by-click walk-through:

1. Karim scans the QR code at the Quiet Pool, ticks the opening checklist and reports algae on a drain with a photo. *(1 minute)*
2. Switch to Hassan, the supervisor. He sees the checklist, marks "Result looks right" and assigns the algae problem to Karim, due tomorrow. *(1 minute)*
3. Switch to Sara, the auditor. She inspects Room 5212: steps followed, but the result needs work. Dust on the A/C grill becomes a problem tagged care, renovated. She also inspects Room 4121 and sends the rusty kettle to the capex list as condition, old. *(1.5 minutes)*
4. Karim marks the algae fixed and tries to confirm it himself; the app stops him. Hassan confirms it. *(0.5 minutes)*
5. Switch to the GM. The summary shows open and overdue problems, old and renovated areas apart, and condition and care apart. Tap through to the Zaitouna Pool safety problem. *(1 minute)*
6. Switch the language to Arabic and show the same screen. *(Throughout)*

## 15. Open points (for Omar, not for Claude Code to decide)

- Confirm which buildings are old and which are renovated
- Native-speaker review of all Arabic strings
- Licensed web font files for Optima and Brandon Text, if Desert Rose wants the exact brand fonts in the prototype
- Where to publish the prototype link
