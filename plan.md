# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into an ordered, trackable build and verification plan.

## Instructions for the Developer

Set priorities, review the checklist, verify results rather than relying only on the Agent's report, and keep the project documents current as the work changes. Expect the build to take many rounds of testing and fixing; record material changes under Revisions.

To begin planning, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me create the Project 3 implementation plan.`

After approving the plan, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me implement the approved Project 3 plan in working checkpoints.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, `spec.md`, and this file, then inspect the relevant project files. Propose concrete tasks and checks without expanding the approved scope.

During implementation, follow the approved plan in working checkpoints and keep it current. Never mark approvals or items requiring Developer verification complete on the Developer's behalf.

## Approach

Summarize the structure, data flow, dependencies, task order, and main risks.

**Structure:** a static site in plain HTML, CSS and JavaScript (ES modules), with no build step and no runtime dependencies. GitHub Pages serves the repo root.

```
index.html            app shell: Main and Info screens
styles.css            cream palette, phone layout, laptop layout at ≥ 768 px
js/app.js             wires inputs → state → render; screen switching
js/api.js             Open-Meteo forecast + geocoding, Nominatim reverse lookup, 10 s timeout
js/recommend.js       pure functions: window hours, weather inputs, condition ranking, rules, state
js/content.js         outfit and reminder wording (3 each)
js/variation.js       in-memory random picks and check marks keyed by date|window
js/render.js          draws character layers, icons, text, reminders, states from the state
js/storage.js         save/restore the most recent location only
js/fixtures.js        loads test forecasts when the URL has ?fixture=<name>
fixtures/*.json       saved test forecasts (thresholds, storm, missing UV, error, ended window)
assets/character/     Open Peeps head parts + original SVG body, outfits, add-ons
assets/icons/         Meteocons and Lucide SVGs, copied into the repo
tests/*.test.js       node --test unit tests for recommend.js and variation.js
```

**Data flow:** follows `spec.md`. A location produces one Open-Meteo request (7 days hourly + current). The date and window select the window hours, `recommend.js` builds the single recommendation state, and `render.js` draws every output from that state only (R11).

**Verification:**
- **Logic:** unit tests with Node's built-in runner (`node --test`, no installs) for every rule and threshold edge (39/40%, UV 2.9/3, 79/80°F, 19/20 mph, 29/30 mph gusts), window hours, and variation independence and stability.
- **Screens:** test forecasts loaded with `?fixture=<name>` show each category, add-on, reminder and state in the browser, with a visible "Test data, not live weather" banner. They also stay available on the deployed site for consistent usability tests.
- **Manual:** browser DevTools (network blocking, throttling, location simulation, device sizes), axe DevTools, keyboard-only and VoiceOver walkthroughs, and real-phone and laptop checks of the deployed URL.

**Running locally:** `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000`. Device location works on `localhost`. Tests: `node --test`.

**Task order:** set up and deploy an empty shell first to prove HTTPS and Pages, then logic with tests, then a character art prototype for Developer review, then the phone Main screen, laptop layout, location flows, states, Info, an accessibility pass, deploy, usability tests and revision. Art runs alongside from checkpoint 3.

**Main risks:**
- **Character art time and consistency.** 18 original SVG pieces must line up on one body. *Mitigation:* the art prototype is checkpoint 3, with one outfit and all add-ons approved before the other 11 outfits are made.
- **Time zones and "remaining hours".** Wrong hours would give wrong recommendations. *Mitigation:* use Open-Meteo `timezone=auto` and its local times. Unit tests cover the Day and Evening edges and the "window ended" case.
- **Nominatim usage policy.** *Mitigation:* one lookup per tap, cached for the session, never automatic.
- **Test mode reaching Users.** *Mitigation:* only active with `?fixture=`, always shows the banner, and is never linked from the app.
- **Scope.** Two extra features (Day/Evening, checkable reminders) on top of the brief. *Mitigation:* checkable reminders come after the core reminders work.

Approach, build checkpoints and usability test plan approved by the Developer on 2026-10-04.

## Checklist

### Approvals

- [x] Research approved
- [x] Specification approved
- [x] Plan approved

### Build

- [ ] Create or source the assets listed in `spec.md`, starting early
- [ ] **CP1: Setup and empty deploy.** Folder structure, `index.html` shell with the WearCast name, `styles.css` palette, a local server, `node --test` running one passing test. Enable GitHub Pages. *Result:* the shell loads at the public HTTPS URL. *Check:* open the URL on a phone and a laptop (R28).
- [ ] **CP2: Data layer.** `api.js` (forecast, geocoding search, Nominatim reverse, 10 s timeout), `storage.js` (last location only), `fixtures.js` with the test banner, and the first fixtures. *Result:* the console shows parsed hourly data for Austin, and `?fixture=` loads a saved forecast. *Check:* R1–R3, R6 (DevTools storage shows only name, lat, lon).
- [ ] **CP3: Recommendation logic and tests.** `recommend.js` (window hours with remaining hours today, weather inputs, condition ranking, category, layer, reminders, ended window, null handling) and `variation.js` (independent random picks, kept per date|window, reset on reload). *Result:* `node --test` passes all threshold, window and variation tests. *Check:* R8, R9, R11, R13, R15, R18, R19, R23 logic.
- [ ] **CP4: Character art prototype (Developer review).** Gather Meteocons and Lucide SVGs into `assets/icons/`. Combine an Open Peeps head with the original body, one Warm outfit, and the layer, umbrella, hat and sunglasses. *Result:* a test page showing the character with every add-on combination. *Check:* the Developer approves the style before more outfits are made.
- [ ] **CP5: Remaining outfits.** The other 11 outfits plus the waving pose for first visit, all layering on the approved body. *Result:* the test page shows all 12 outfits × add-ons. *Check:* Developer review; nothing overlaps or misaligns.
- [ ] **CP6: Main screen, phone.** Render the state into the phone layout from `sketch-main-phone.jpg`: header (location, date, Now/Forecast, units, source, ⓘ), the character with alt text, the recommendation text, weather tiles, reminders, and the bottom controls (city/ZIP + locate, 7-day strip, Day/Evening with time-based default). *Result:* live Austin weather drives the full phone screen. *Check:* R7, R8, R10–R15, R17, R30 at 390 px; fixtures for each category and reminder.
- [ ] **CP7: Checkable reminders.** Real checkboxes with ticks kept per date|window in memory. *Check:* R16 (switch away and back, reload, keyboard Space).
- [ ] **CP8: Laptop layout.** At ≥ 768 px: header controls, week strip with icons and feels-like high/low, character left, details right, per `sketch-main-laptop.jpg`. *Check:* R12, R29 at 1440×900 and while resizing across 768 px.
- [ ] **CP9: Location flows.** Search sheet with multiple matches and no results; use my location with the Nominatim name; denied, non-US and Nominatim-failure handling; save and restore the last location. *Check:* R3–R6, R22, R24.
- [ ] **CP10: States.** Loading, service error with Retry, missing values as "—", window ended, and first visit with no requests, per `sketch-states-phone.jpg`, announced through a live region. *Check:* R9, R21, R23, R25 using fixtures, throttling and network blocking.
- [ ] **CP11: Info screen.** Phone (← Back) and laptop (✕ Close, "On this page") per `sketch-info-phone-laptop.jpg`: creator, data sources, method table, privacy, credits, safety note. *Check:* R20, R26, R27; Back/Close keeps location, date and window.
- [ ] **CP12: Accessibility and polish pass.** Contrast, focus styles, keyboard order, labels, 44 px targets, 320 px reflow, reduced motion. *Check:* R30–R32 with axe DevTools, keyboard-only and VoiceOver walkthroughs.
- [ ] Use the approved screen drawings to guide layout and interaction work
- [ ] Keep one recommendation state driving every visual and written output
- [ ] Test and fix each checkpoint against the specification before starting the next
- [ ] Commit meaningful working checkpoints
- [ ] Deploy to a public HTTPS URL

### Verify and revise

- [ ] Check every specification requirement
- [ ] Test multiple locations, current and forecast dates, recommendation categories, outfit and reminder variations, and failure states
- [ ] Verify that eligible outfit and reminder variations are selected independently rather than as fixed pairs
- [ ] Verify that returning to a previously selected date shows the same variations
- [ ] Test the deployed app, independently of the local version, on a real phone and a laptop, including both screens, accessibility, and one-handed controls
- [ ] Prepare the usability test below
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] Implement, verify, and redeploy at least one meaningful revision

### Deliver

- [ ] Confirm all brief deliverables, sources, privacy information, and asset credits
- [ ] Save all chat transcripts
- [ ] Complete the debrief

## Usability testing

Before testing, record the purpose, a few realistic tasks, non-leading prompts, and a consistent note format. For each session, use a non-identifying label and record the task, what the tester did or said, successes, barriers or questions, and possible changes. Keep observations separate from interpretations. After all three sessions, summarize the strongest findings and the improvement they support.

**Purpose:** find out whether peers can quickly decide what to wear and bring using WearCast, especially one-handed on a phone and when planning ahead, and where they hesitate or misread the recommendation.

**Setup:** the deployed URL on each tester's own phone, held one-handed where possible. Tasks 1–2 use the same test forecast (`?fixture=usability`, a warm morning with a cool start and a rainy evening) so sessions are comparable. Tasks 3–4 use live data. Around 10 minutes per session. Testers think aloud. The Developer observes and doesn't help unless they're stuck for over a minute.

**Tasks and non-leading prompts:**

1. *Morning check:* "You're getting dressed for a class tomorrow morning in Austin. Use the app to decide what to wear."
2. *Evening plans:* "You're meeting friends Friday evening. What would you wear and bring?"
3. *Your own location:* "Check what the app suggests for where you are right now."
4. *Trust and privacy:* "Find out where the weather comes from and what the app keeps about you."

Follow-ups after the tasks: "What, if anything, was confusing?" "What would make you use this, or not?"

**Note format** (one table per session, labeled P1, P2, P3, with no names):

| Task | What the tester did or said (observation) | Success? (yes / with help / no) | Barriers or questions | Possible change (interpretation) |
|---|---|---|---|---|

**Sessions:**

*(P1–P3 notes are added here after testing.)*

**Findings and chosen improvement:**

*(Summarize the strongest findings across the three sessions, then name the improvement and the evidence for it.)*

## Revisions

Record material plan changes and why they were made.

- **2026-10-05 (CP1): test command changed to `node --test`.** `node --test tests/` fails on Node 24 (it treats the folder as a file). Plain `node --test` finds `tests/*.test.js` by default.
- **2026-10-09 (CP2): test forecasts are moved to start today.** A fixture is a saved Open-Meteo response with a `fixture` block (description, location). On load, its dates are shifted so the first day is today in the fixture's time zone, and the hours and values are kept. This means `?fixture=usability` shows the same weather for "tomorrow morning" and "Friday evening" whatever day a session runs. The real clock is still used for "Now" and remaining hours. *Developer to review.*
- **2026-10-09 (CP2): temporary DevTools helper.** `app.js` exposes `wearcast.choose()`, `searchPlaces()` and `reverseLookup()` so the data layer can be checked before the location controls exist. It is removed in CP9.
- **2026-10-09 (CP3): rule details where the spec was open.** *Developer to review.*
  - **Window edges included:** Day uses the 8am through 8pm readings (13 hours), Evening 5pm through 11pm (7 hours). For today, the current hour counts as remaining, so Day "ends" at 9pm.
  - **No feels-like data at all** for a window is shown as the missing-data error. A single missing value only blanks its tile (R23).
  - **Eight conditions, not seven:** the ranking in the spec lists 8 conditions and *Assets* lists 8 icons. The code uses all 8.
  - **"Bring a light layer for …"** is "this morning" / "the morning" when the low is before noon in Day, "this evening" / "the evening" otherwise, and "later tonight" / "later that night" for an Evening low from 8pm.
  - **`{time}`** is the first hour reaching the rain peak.
- **2026-10-09 (CP3): `js/content.js` added** for outfit and reminder wording, so copy can change without touching the rules in `recommend.js`.
- **2026-10-09 (CP4): how the character is built.** Every character piece is its own SVG file in one shared viewBox (`80 -100 840 3060`, the Open Peeps head coordinates). The pieces are stacked as `<img>` layers in this order: body → outfit → layer → head → sunglasses → hat → umbrella. The heads and sunglasses are rendered from `react-peeps` to plain SVG in a scratch folder, so React is never part of the app. The umbrella is drawn closed and hanging from the hand, so it never covers the head or the text.
- **2026-10-09 (CP4): icons are static.** Meteocons v2.0.0 icons are animated. The copies in `assets/icons/` have their animation removed, which suits reduced motion (R31) and keeps the page still. Both fill and line styles are in the repo until the Developer picks one, and the other set is then deleted.
- **2026-10-09 (CP4): `art-test.html`** is the art review page. It isn't linked from the app and is marked `noindex`.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
