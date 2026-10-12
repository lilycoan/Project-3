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
js/search.js          place search sheet (native <dialog>): results, keyboard, Use my location
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

**Running locally:** `python3 -m http.server 8137 --bind 127.0.0.1` from the repo root, then open `http://127.0.0.1:8137`. Device location works on `127.0.0.1`. (Changed from port 8000 at CP12b; see Revisions.) Tests: `node --test`.

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
- [x] **CP4: Character art prototype (Developer review).** Gather Meteocons and Lucide SVGs into `assets/icons/`. Combine an Open Peeps head with the original body, one Warm outfit, and the layer, umbrella, hat and sunglasses. *Result:* a test page showing the character with every add-on combination. *Check:* the Developer approves the style before more outfits are made. *Approved by the Developer on 2026-10-09: Short wavy head, Wayfarer sunglasses, Meteocons fill icons.*
- [x] **CP5: Remaining outfits.** The other 11 outfits plus the waving pose for first visit, all layering on the approved body. *Result:* the test page shows all 12 outfits × add-ons. *Check:* Developer review; nothing overlaps or misaligns. *Approved by the Developer on 2026-10-09, with the Hot 1 bare shoulders and the Cold 3 pom-pom under the sun hat kept as drawn.*
- [ ] **CP6: Main screen, phone.** Render the state into the phone layout from `sketch-main-phone.jpg`: header (location, date, Now/Forecast, units, source, ⓘ), the character with alt text, the recommendation text, weather tiles, reminders, and the bottom controls (city/ZIP + locate, 7-day strip, Day/Evening with time-based default). *Result:* live Austin weather drives the full phone screen. *Check:* R7, R8, R10–R15, R17, R30 at 390 px; fixtures for each category and reminder.
- [ ] **CP7: Checkable reminders.** Real checkboxes with ticks kept per date|window in memory. *Check:* R16 (switch away and back, reload, keyboard Space).
- [ ] **CP8: Laptop layout.** At ≥ 768 px: header controls, week strip with icons and feels-like high/low, character left, details right, per `sketch-main-laptop.jpg`. *Check:* R12, R29 at 1440×900 and while resizing across 768 px.
- [ ] **CP9: Location flows.** Search sheet with multiple matches and no results; use my location with the Nominatim name; denied, non-US and Nominatim-failure handling; save and restore the last location. *Check:* R3–R6, R22, R24.
- [ ] **CP10: States.** Loading, service error with Retry, missing values as "—", window ended, and first visit with no requests, per `sketch-states-phone.jpg`, announced through a live region. *Check:* R9, R21, R23, R25 using fixtures, throttling and network blocking.
- [ ] **CP11: Info screen.** Phone (← Back) and laptop (✕ Close, "On this page") per `sketch-info-phone-laptop.jpg`: creator, data sources, method table, privacy, credits, safety note. *Check:* R20, R26, R27; Back/Close keeps location, date and window.
- [ ] **CP12: Accessibility and polish pass.** Contrast, focus styles, keyboard order, labels, 44 px targets, 320 px reflow, reduced motion. *Check:* R30–R32 with axe DevTools, keyboard-only and VoiceOver walkthroughs.
- [ ] **CP12b: Character style choice (R34).** Second head and waving head (Open Peeps "Medium"), 2 new outfits for the Short wavy style, a two-preview style control, style saved with the location, and alt text and wording per style. Update Info privacy and credits. *Check:* R34, R6 (DevTools shows only location and style), R11/R14 text matching for both styles, keyboard and VoiceOver.
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
- [ ] Prepare the usability test below *(session guide drafted by the Agent on 2026-10-11; Developer to review)*
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] **Improvement (from usability findings):** a concise, plain-language explanation of the Day and Evening controls, and a more visible privacy summary near the location feature. Exact wording and placement to be specified with the Developer before building.
- [ ] Implement, verify, and redeploy at least one meaningful revision

**Requirement sweep, 2026-10-11** (Agent; automated checks run against the local copy and the deployed site at commit `3e3286a`). ✅ = shown by an automated check · 👤 = still needs the Developer's own check (real phone, VoiceOver or judgement).

| Req | Status | Evidence |
|---|---|---|
| R1 Live Open-Meteo | ✅ | Only `api.open-meteo.com` contacted for weather. Screen values equal the API's hourly values for 4 live days. |
| R2 7-day range | ✅ | 7 days starting "today" in Austin, Honolulu and New York. |
| R3 Manual entry | ✅ | "Austin" lists TX/MN/IN (no loose matches). "78705" gives Austin, TX. Nonsense gives "No US places found" and the field stays usable. |
| R4 Device location | ✅ 👤 | Named "Austin, TX". A second tap makes no new Nominatim request (simulated). 👤 Real permission prompt on a phone. |
| R5 Non-US location | ✅ | Toronto shows the US-only message and keeps the place. |
| R6 Saved data | ✅ | Two keys only (`wearcast.location`, `wearcast.style`), no cookies. The place is restored on reload. |
| R7 Date selection | ✅ 👤 | All 7 days update every output. Laptop strip shows icon and range per window. 👤 VoiceOver reads "selected". |
| R8 Day/Evening | ✅ | Default by local hour (unit tests, and a 9pm test clock opens Evening). Today uses remaining hours (unit test at 2pm). |
| R9 Ended window | ✅ | Message, no outfit, See Evening and See tomorrow both work. |
| R10 Context | ✅ | Place, date, Now/Forecast, °F · mph and source visible at every width. |
| R11 One state | ✅ | Umbrella ⇔ reminder and hat/sunglasses ⇔ sunscreen for every value, both looks, all variants (unit + browser). |
| R12 Character focus | ✅ | Fully visible and the largest element at 390×844 and 1440×900. |
| R13 Weather details | ✅ | Equal to the API max/min over the window, rounded down (revision). |
| R14 Written recommendation | ✅ | Text and alt text match the drawn outfit for 2 looks × 12 outfits. |
| R15 Reminder rules | ✅ | Below/at every threshold and gust-only fixtures. "Headwind" never appears. |
| R16 Checkable reminders | ✅ 👤 | Space and Tab, kept per date and window, cleared on reload. 👤 VoiceOver reads "checked". |
| R17 No reminders | ✅ | "Nothing extra to bring." |
| R18 Variations | ✅ | 20 real reloads: 3/3 outfits, 3/3 wordings for each reminder, 19 distinct combinations. |
| R19 Same on return | ✅ | Day 3 → day 4 → day 3 identical. |
| R20 Info screen | ✅ | All sections and the safety note on both layouts. 21 links resolve. Back/Close keeps the view and scroll. |
| R21 Loading | ✅ | Greyed outline, bars, "Getting the weather…", announced. |
| R22 Location denied | ✅ 👤 | Message, focus on the field, place kept (simulated). 👤 Real denial on a phone. |
| R23 Errors and missing data | ✅ | Error at 10.0 s, blocked network, Retry recovers. "UV —" with no sunscreen, hat or sunglasses. |
| R24 Nominatim failure | ✅ | "Your location" and the weather loads. |
| R25 First visit | ✅ | Waving character, look choice, both buttons. No requests. |
| R26 Privacy | ✅ | No cookies. Only Open-Meteo (and Nominatim on a tap) contacted. Info text matches the re-checked policies. |
| R27 Credits | ✅ | Every asset credited with its license. |
| R28 Deployment | ✅ 👤 | HTTPS on GitHub Pages serving the latest commit. Repo and history search finds no secrets. 👤 Open on a real phone and laptop. |
| R29 Layouts | ✅ | Switches at 768 px. Nothing lost from 1440 to 320 px. Date, window and ticks survive resizing. |
| R30 One-handed | ✅ 👤 | Controls in the bottom 20% at 390×844. Every target ≥ 44 px. 👤 Thumb reach on a real phone. |
| R31 Accessibility | ✅ 👤 | axe 0 violations on 8 states × 2 sizes (local and deployed). 12/12 contrast pairs. Keyboard focus rings and order. Live region. 320 px reflow. 👤 VoiceOver walkthrough. |
| R32 Visual direction | 👤 | Developer judgement. |
| R33 Test mode | ✅ | Banner and no Open-Meteo request with `?fixture=`. Normal URL shows no banner and uses live data. |
| R34 Character look | ✅ 👤 | 24 checks on local and deployed (chooser, switch, saved, swapped outfits, keyboard, axe). 👤 VoiceOver names the two looks. |

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

**Recording:** written notes only (Developer decision, 2026-10-11). No audio, video or screen recordings, and no names.

**Session guide** (prepared 2026-10-11, *Developer to review*):

- **Test link (all 4 tasks):** https://lilycoan.github.io/Project-3/?fixture=usability. Tasks 1–2 use the saved test forecast. In task 3, choosing a place by search or "Use my location" leaves test mode by itself and loads live weather, so the tester never needs a second link.
- **Before each session:**
  - Wait at least 10 minutes after any deploy (GitHub Pages caches files for 10 minutes).
  - Do a quick run-through yourself on the test link.
  - Send the link to the tester (text or AirDrop) and have them open it in their usual browser.
  - Have the P-table below ready.
  - Don't show or explain the app first.
- **Intro script (read aloud):** "Thanks for helping. I'm testing the app, not you, so there are no wrong answers. Please think out loud as you go: what you're looking at, what you expect, anything that surprises you. Hold your phone the way you normally would, one-handed if that's natural. I'll mostly stay quiet. I'm taking written notes without your name, and you can stop at any time."
- **Help rule:** only step in if the tester is stuck for over a minute. Then use a neutral nudge ("What would you try next?"), and mark the task "with help".
- **What success looks like** (outfits vary by tester; the day, window and advice don't):

  | Task | Tester should end on | Correct answer contains |
  |---|---|---|
  | 1. Tomorrow morning | Tomorrow · **Day** | a Warm outfit **plus a light layer for the morning**, sunscreen (UV 7), water (feels-like 83°) |
  | 2. Friday evening | Friday · **Evening** | a Warm outfit, **a light layer for later that night**, **an umbrella** (70% rain around 10pm) |
  | 3. Where you are | their own place, test banner gone | via "Use my location" (allowing the prompt) or a typed city or ZIP |
  | 4. Trust and privacy | the Info screen | weather from Open-Meteo; only the last place and the chosen look are saved on the phone |

- **Watch for (observations, not interpretations):**
  - **Date strip:** do they find tomorrow and Friday in the bottom strip?
  - **Day/Evening:** do they notice and use the toggle, or stay on the default?
  - **Advice:** do they mention the layer and the umbrella, or only the main outfit?
  - **Reminders:** do they read or tick them?
  - **Look switch:** do they notice or use the switch in the character card corner?
  - **Info:** do they find the ⓘ button?
  - **One-handed:** do they reach the controls with one thumb, or switch hands?
  - **Banner:** do they notice the "Test data" banner?
- **After the tasks:** ask the two follow-ups, then thank them.

**Note format** (one table per session, labeled P1, P2, P3, with no names):

| Task | What the tester did or said (observation) | Success? (yes / with help / no) | Barriers or questions | Possible change (interpretation) |
|---|---|---|---|---|

**Sessions:**

*P1* (October 11, 2026)

| Task | What the tester did or said (observation) | Success? (yes / with help / no) | Barriers or questions | Possible change (interpretation) |
|---|---|---|---|---|
| 1. Tomorrow morning | Entered a city into the search field and looked for tomorrow's weather and outfit recommendation. Selected Day to see what to wear. | yes | Wasn't immediately sure whether Day meant the current day or morning hours. | Add a short label explaining that Day represents 8 AM–8 PM. Make the forecast date more prominent. |
| 2. Friday evening | Selected Evening and looked for clothing recommendations and weather reminders. | with help | Was unsure whether Evening changed the forecast or only the outfit. | Add a clear explanation that Evening uses 5 PM–11 PM weather conditions to generate recommendations. |
| 3. Where you are | Clicked Use my location and encountered the browser's location permission prompt. | yes | Wanted to know why location access was needed. | Add brief supporting text explaining that location is used to retrieve local weather and that city search is an alternative. |
| 4. Trust and privacy | Opened About this app and navigated to Privacy to learn what information is stored. | with help | Had to scroll and read several paragraphs to understand what was saved and shared. | Make the privacy summary easier to scan, using concise headings and a prominent summary near the main interface. |
| Follow-ups | Said the outfit recommendations were useful but wanted to understand how the app chose them. | — | The recommendation logic was not immediately obvious from the main screen. | Surface a brief explanation of how temperature, rain, UV, and wind affect recommendations. |

*P2* (October 11, 2026)

| Task | What the tester did or said (observation) | Success? (yes / with help / no) | Barriers or questions | Possible change (interpretation) |
|---|---|---|---|---|
| 1. Tomorrow morning | Used the city search and looked for the weather information and recommended outfit for the following morning. | with help | Expected a separate Tomorrow option instead of having to understand the forecast and Day controls. | Make forecast dates and the selected time period easier to distinguish. Clarify that Day and Evening control the hours used for recommendations. |
| 2. Friday evening | Switched from Day to Evening and reviewed the resulting outfit and reminders. | yes | Wanted confirmation that the recommendation reflected evening temperatures rather than the daily high. | Add a visible label explaining which hours the recommendation uses. |
| 3. Where you are | Looked for a way to get local weather without manually typing a city or ZIP code. Found Use my location. | yes | Was concerned about whether location would be stored or repeatedly accessed. | Explain when location is requested, what is retained, and how users can choose manual search instead. |
| 4. Trust and privacy | Opened the app information and read the privacy section, focusing on location data and third-party services. | with help | Found it difficult to distinguish information stored locally from information sent to external services. | Separate local storage, third-party weather requests, and hosting logs into clearly labeled sections. |
| Follow-ups | Asked whether the recommendations were based on the actual forecast and whether the app tracked searches. | — | Needed more transparency about weather sources and data handling. | Provide concise explanations near the relevant features, with links to the full privacy details and data sources. |

*P3* (October 11, 2026)

| Task | What the tester did or said (observation) | Success? (yes / with help / no) | Barriers or questions | Possible change (interpretation) |
|---|---|---|---|---|
| 1. Tomorrow morning | Entered a location and searched for an outfit recommendation for the next morning. Reviewed the weather conditions and reminders. | yes | Wanted to know whether the recommendation was based on the feels-like temperature or the regular temperature. | Explain more prominently that outfit recommendations use feels-like temperatures. |
| 2. Friday evening | Switched to Evening and checked whether the suggested clothing and reminders changed. | yes | Was unsure why some reminders appeared and others did not. | Explain the conditions that trigger umbrella, sunscreen, water, and biking wind reminders. |
| 3. Where you are | Clicked Use my location and successfully accessed local weather after granting permission. | with help | Wanted to know what would happen if location permission were denied. | Provide clear guidance for denied permissions and emphasize that city or ZIP search remains available. |
| 4. Trust and privacy | Navigated to Privacy in About this app and looked for information about tracking and saved data. | with help | Needed to read the full section to understand that some location information is stored and that external services receive certain requests. | Add a short, plain-language privacy summary, while keeping detailed disclosures accessible. |
| Follow-ups | Said the website was straightforward overall but suggested making the purpose of each control clearer. | — | Some behavior required reading the About section instead of being self-explanatory. | Improve labels and contextual explanations without adding unnecessary steps to the primary weather experience. |

**Findings and chosen improvement:**

Across the three peer sessions, the main usability themes were clarity of the Day and Evening controls, transparency around location permissions, and the discoverability of privacy information. The testers were generally able to find the core weather and outfit features, but some controls required additional explanation. The privacy section also contained useful information that could be difficult to understand quickly because users had to read through multiple paragraphs.

**Chosen improvement:** Add a concise, plain-language explanation of the Day and Evening controls and a more visible privacy summary near the location feature.

This improvement addresses two important questions users may have while using WearCast: how the app generates its recommendations and what happens when they share their location. Clearer labels and contextual explanations could reduce uncertainty without adding significant complexity to the interface.

**How to check the improvement worked:** In follow-up testing, record whether participants independently select the correct time period, explain what information is stored or shared, and identify an alternative to location access. Compare completion rates and the number of questions or requests for help before and after the changes.

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
- **2026-10-09 (CP4): icons are static.** Meteocons v2.0.0 icons are animated. The copies in `assets/icons/` have their animation removed, which suits reduced motion (R31) and keeps the page still. The Developer chose the fill style, so the line set was removed.
- **2026-10-09 (CP4): `art-test.html`** is the art review page. It isn't linked from the app and is marked `noindex`.
- **2026-10-09 (CP5): outfits come from a generator.** `tools/make-outfits.py` builds all 12 outfits, and the raised-sleeve version of Warm 1 for first visit, from shared garment shapes. That keeps every outfit on the same body. Edit the script and re-run it rather than editing the generated SVGs.
- **2026-10-09 (CP5): character details.**
  - The Cold 3 beanie is drawn above the head (`outfit-cold-3-top.svg`). On a cold, sunny day it sits under the sun hat with the pom-pom showing.
  - Cold outfits never get the tied jacket, because the layer rule needs a cooler low category than the high, and nothing is cooler than Cold.
  - Outerwear is drawn open so the top named in the text (sweater, hoodie, thermal) is visible.
  - First visit uses `body-wave.svg`, `outfit-wave.svg` and `head-wave.svg` (Open Peeps "Cute" face, a wink).
- **2026-10-09 (CP6): test forecasts come from a generator.** `tools/make-fixtures.py` writes `usability`, `hot-all-reminders`, `mild-layer`, `cold-sunny` and `calm-nothing`. The threshold, missing-value and error fixtures are added at CP10.
- **2026-10-09 (CP6): temporary search.** Until the search sheet is built at CP9, pressing Enter in City or ZIP picks the first US match, so live weather can be checked on a phone. The locate button does nothing until CP9.
- **2026-10-09 (after CP6): CP12b added for the character style choice** requested by the Developer (spec R34, R6 change). It is scheduled after CP12 and before usability testing, so the core checkpoints finish first.
- **2026-10-11 (CP7): focus is kept across re-renders.** The date strip and reminder list are rebuilt on each render, which dropped keyboard focus after every date press. That bug was introduced in CP6. `renderMain` now restores focus to the same date or reminder. Reminders also show a count ("2 of 4 ready") beside the heading.
- **2026-10-11 (CP8): one set of markup for both layouts.** At 768 px and up, `.main-screen` becomes a CSS grid, and the controls wrapper (a plain `<div>` with no role) uses `display: contents`, so the search, week strip and toggle can sit in the header and strip rows. Landmarks (`main`, `section`, `form`) are never set to `display: contents`, to avoid Safari dropping their roles. The ⓘ button, the visible app name and the recommendation text moved in the markup so each can be placed in both layouts. "Use my location" shows as text from 1024 px. Between 768 and 1023 px it's icon-only, with the same accessible name.
- **2026-10-11 (CP9): search results are filtered** (approved by the Developer). Only towns and cities whose name starts with what was typed are kept (ZIP searches are exempt). Periods and St/Ft/Mt ↔ Saint/Fort/Mount are ignored when comparing. A typed ", ST" or state name narrows the list. Airports and other features are dropped. When two places would share a label, the county is added.
- **2026-10-11 (CP9): device coordinates are rounded to 2 decimals (about 1 km)** before they go to Nominatim and Open-Meteo or are saved. That's enough for city weather and shares less precise location data. The Info privacy text (CP11) should say so. *Approved by the Developer on 2026-10-11.*
- **2026-10-11 (CP9): a fresh position on every tap.** The first version allowed a 10-minute-old position, which kept the old place when the simulated location changed. That would also break the R5 check with DevTools Sensors.
- **2026-10-11 (CP10): states share one status panel.** Loading, error, ended window and first visit each put their message and buttons in `#status-panel`, rendered from the state. The panel is announced through the live region when the status changes. Retry keeps the date, window and variation picks (spec: *How variations are chosen and kept*). A new location starts fresh.
- **2026-10-11 (CP10): test forecast extras.** A fixture's `fixture` block can fix the local hour (`"now": {"hour": 21}`, used by `ended`) or force a failure (`"fail": "timeout"`, used by `error-timeout`). Both work only in `?fixture=` mode. New fixtures: `storm-evening`, `missing-uv`, `edges-below`, `edges-at`, `edges-gust`, `ended`, `error-timeout`.
- **2026-10-11 (CP11): Info content checked against sources.** The Open-Meteo terms (CC BY 4.0, 90-day logs, not shared), GitHub Pages IP logging and the Nominatim attribution requirement were re-read online. The Nominatim retention claim was wrong and is corrected (see the `spec.md` revision). All 21 Info links resolve. The phone shows ← Back and the laptop ✕ Close (one button, layout-specific text). Back/Close restores the place, date, window and scroll position, and focus returns to ⓘ.
- **2026-10-11 (CP12): accessibility audit.** axe-core 4.14 (WCAG 2.2 A/AA) was run on 8 states at 390 and 1440 px. Before fixes:
  - the date buttons' spoken names didn't contain their visible text (2.5.3)
  - the loading outline had an invalid `aria-hidden` value
  - the feels-like paragraph had an `aria-label`, which isn't allowed on a paragraph
  - the laptop Info links were 36 px tall

  All are fixed, and every run now has 0 violations and no controls under 44 px. The weather condition is now written beside "Feels like", because pale icons (clouds) fall below 3:1 and shouldn't carry it alone (1.4.11). The placeholder text now uses the muted colour (7.0:1). All 12 colour pairs pass. A keyboard Tab walk reaches every control, and every stop shows a focus ring.
- **2026-10-11 (CP12): controls come before the content in the markup** (approved by the Developer). The laptop focus order used to jump from the reminders back up to the header controls. The order is now Open-Meteo, ⓘ, City or ZIP, Use my location, the 7 dates, Day/Evening, then the reminders, on both layouts. On phone, CSS `order` still draws the controls at the bottom.
- **CP12, still for the Developer to verify (R31, R32):** a VoiceOver walkthrough on a real phone:
  1. Find "Use my location" or type a city, and pick a place from the sheet.
  2. Swipe to a date. It should read "Mon 12 October, selected" or similar.
  3. Switch Day/Evening.
  4. Swipe to the character. It should read the outfit, for example "Character wearing a tee, …".
  5. Tick a reminder. It should read "checked".
  6. Open Info and go Back.

  Also confirm the deployed look matches the approved soft-neutral direction.
- **2026-10-11 (CP12b): character style choice built** (decisions by the Developer).
  - **Short wavy outfits:** "Sleeveless tee, running shorts and sneakers" replaces Hot 3, and "Polo shirt, chino shorts and sneakers" replaces Warm 2. The Medium-hair look keeps all 12 outfits.
  - **Placement:** both looks are offered on the first-visit screen, and a small two-figure switch sits in the character card corner when an outfit shows. The default is Short wavy.
  - **Storage:** the look is saved under its own key (`wearcast.style`), alongside `wearcast.location`.
  - **Switching:** changing look keeps the date, window and variant number.
  - **Code:** `content.js` holds the per-style outfits (`outfitFor`), and `tools/make-outfits.py` draws the two new outfits.
  - **Checks:** 24 browser checks, 0 axe violations, and 45 unit tests passing.
- **2026-10-11 (CP12b): local server moved to port 8137.** Another local app answers on `127.0.0.1:8000`, so `localhost:8000` sometimes reached it instead of WearCast, and test runs failed for that reason alone.
- **Known deploy risk: cached modules.** GitHub Pages lets browsers cache files for about 10 minutes. A visitor who had the old version open within 10 minutes of a deploy can get new and old modules mixed, which shows a blank page until they reload. *Mitigation:* wait about 10 minutes after a deploy before usability sessions, and reload once if a page is blank.
- **2026-10-11 (usability prep): choosing a place leaves test mode** (approved by the Developer). A dry run showed that searching "Denver" on the test link showed "Denver, CO" over the Austin test weather. Choosing a place in test mode now saves it and reloads the normal URL, so task 3 gets live weather without a second link.
- **2026-10-11 (revision from usability findings): explanations in context built** (spec R35 and R20 change, approved by the Developer).
  - **Hours:** the Day and Evening buttons show their hours, the context line shows the window and the hours used ("Evening, 10pm–11pm" for the rest of today), and the "Based on how warm it feels, …" line links to *How recommendations work*.
  - **Location:** a location note with "Privacy details" sits under "Use my location" in the search sheet (pinned to the sheet's bottom edge so it's visible with 10 matches) and on the first-visit screen. "Finding your location…" shows while the position is found.
  - **Privacy on Info:** now has three labeled parts with one-line summaries.
  - **Checks:** 17 new browser checks pass, and every earlier suite still passes (unit 46, axe 0, CP7, CP9, CP10, CP12b, sweep, resize).

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
