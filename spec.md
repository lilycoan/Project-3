# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved research, project brief, and hand-drawn screen designs into testable requirements.

## Instructions for the Developer

Make and approve the product decisions, draw every proposed screen, provide the drawings to the Agent, and keep this file current as the intended result changes.

To begin, open the project repository in a fresh chat and enter:

`Read ./spec.md and help me begin the Project 3 specification.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, and this file. Review the screen drawings the Developer provides. Ask one focused question at a time, surface gaps and trade-offs without inventing requirements, and keep the specification concise and testable.

## Goal

State what the app should help its Users accomplish and name the user story or stories that define that need.

WearCast helps college students in Austin decide what to wear, and what to bring, for the hours they'll be out (the morning routine or evening plans with friends) by turning live forecast data into a character's outfit and short reminders. Defined by user stories 1 and 2 in `research.md`.

## Screen designs

Draw every proposed screen by hand, in both phone and laptop layouts, on paper, a tablet, a whiteboard, or another hand-drawing surface. Save photos or exports in `reference/`, provide them to the Agent, and link them here. Use the drawings to define layout, hierarchy, controls, navigation, and important interaction states.

Hand-drawn by the Developer on 2026-10-04. Photos are stored as JPG in `reference/` (the original HEIC photos were removed from the repo and remain in git history at commit `41f9ac8`).

| Drawing | Shows |
|---|---|
| [Main, phone](reference/sketch-main-phone.jpg) | **Top:** location, date, units (°F, mph), ⓘ Info button, Open-Meteo credit. **Middle (focus):** character box (outfit + layer + umbrella + hat/sunglasses). Weather icon with feels-like high/low. Rain, UV and wind tiles. Checkable reminders list. **Bottom (thumb reach):** city/ZIP field and use-my-location button, 7-day date strip, Day/Evening toggle. |
| [Main, laptop](reference/sketch-main-laptop.jpg) | **Header:** app name "WearCast", city/ZIP field, use-my-location button, Day/Evening toggle, ⓘ. **Below:** location, date and units line, then the 7-day strip (icon + feels-like high/low per day, selected day highlighted). **Body:** large character on the left. On the right: written recommendation, a weather details card (icon, feels-like, rain, UV, wind), and checkable reminders in a grid. |
| [Info, phone and laptop](reference/sketch-info-phone-laptop.jpg) | **Phone:** ← Back, "About this app", stacked sections for Creator, Weather data, How recommendations work, Privacy, Art credits & licenses. **Laptop:** header with ✕ Close, an "On this page" sidebar linking to each section, and the content column, with a feels-like → outfit and reminder threshold table. |
| [States, phone](reference/sketch-states-phone.jpg) | **a. Loading:** greyed character outline, placeholder bars, "Getting the weather…". **b. Location denied:** "Location is off for this site. Type city or ZIP instead," with the city/ZIP field. **c. Service error / missing data:** "Couldn't load the weather," the reason, and Retry. **d. Search results:** a bottom sheet with a search field, matching places (e.g., Austin TX / MN / IN) and use-my-location. **e. First visit:** a waving character in a default outfit, "What should I wear today?", and Use location / Type city or ZIP. |

**Additions not shown in the drawings** (the Developer chose to describe them here instead of redrawing):

- **Current vs forecast label:** a small tag beside the date on Main (phone and laptop), reading **"Now"** for today and **"Forecast"** for future dates.
- **Written recommendation on phone:** one or two lines of recommendation text directly below the character, matching the laptop's recommendation text.

**Clarifications to the drawings:**

- Numbers in the drawings are placeholders. Thresholds follow the approved `research.md`: sunscreen at UV ≥ 3; bike wind at ≥ 20 mph sustained or ≥ 30 mph gusts; layer only when the window's feels-like low is < 70°F. The Info table must show these values.
- The bike reminder says "strong wind" or "gusty", not "headwind", because the app doesn't know the direction of travel.
- Loading, error, denied, search and first-visit states use the same structure on laptop: a message in the main content area and the search results under the header search field. No separate laptop drawings were made.

## Requirements

Translate every fixed brief requirement and the selected research-driven feature into a testable requirement. Define the chosen behavior, content, controls, current and forecast data, responsive layout, accessibility, error handling, privacy, credits, and deployment. The main screen should make clear the location, date, units, data source, and whether conditions are current or forecast. Include an acceptance check for each requirement.

Each requirement has an ID and an acceptance check (✓). "Window" means the selected time window: Day (8am–8pm) or Evening (5pm–11pm, the last hour Open-Meteo returns). Times are the location's local time.

### Weather data

- **R1. Live data from Open-Meteo.** Current conditions and hourly forecast come from the [Open-Meteo Forecast API](https://open-meteo.com/en/docs) in °F and mph, using the location's time zone. No API key is used.
  ✓ The network panel shows requests only to `api.open-meteo.com` for weather. Values shown match the raw API response for the same location and hour.
- **R2. 7-day range.** Users can pick today plus the next 6 days.
  ✓ The date strip shows exactly 7 days, starting today in the location's time zone.

### Location

- **R3. Manual entry.** Users type a US city or ZIP. Results come from the Open-Meteo Geocoding API filtered to the US. When there are several matches, Users pick one from a list showing city and state.
  ✓ "Austin" lists Austin TX, MN and IN. Picking Austin TX loads Austin weather. "78705" finds Austin, TX. A non-US place or nonsense text shows "No US places found" with the field still usable.
- **R4. Device location.** "Use my location" asks the browser for permission, then names the place with one Nominatim reverse lookup, shown as "City, ST". Results are cached for the session, and lookups only happen on a tap.
  ✓ On a phone in Austin, tapping it shows "Austin, TX". A second tap at the same coordinates makes no new Nominatim request.
- **R5. Non-US device location.** If the reverse lookup returns a country other than the US, the app shows "WearCast covers US locations. Type a US city or ZIP" and keeps the previous location.
  ✓ Simulating coordinates outside the US (e.g., in browser DevTools) shows the message and doesn't change the location.
- **R6. Save only the most recent location.** Only the last chosen location (name, latitude, longitude) is saved on the device, in `localStorage`, and it's restored on the next visit. Nothing else is stored: not dates, windows, variations, check marks or weather.
  ✓ After choosing a location and reloading, the same location loads. DevTools → Application shows a single `localStorage` key holding only name, latitude and longitude, and no cookies.

### Date, window and labels

- **R7. Date selection.** On phone, the date strip sits in the bottom control area. On laptop it sits below the header and shows each day's weather icon and feels-like high/low for the selected window. The selected day is visually highlighted and announced to screen readers.
  ✓ Selecting each of the 7 days updates the character, text, weather and reminders. The selected state is visible and is read out as "selected" by VoiceOver.
- **R8. Day/Evening window (additional feature).** A Day/Evening toggle chooses the window. On load it defaults to Day before 5pm and Evening from 5pm. For today, only the window's remaining hours, from the current hour on, are used.
  ✓ Opening at 10am shows Day. Opening at 6pm shows Evening. At 2pm today, Day's feels-like range reflects 2pm–8pm only (compare with the API's hourly values).
- **R9. Ended window.** If today's selected window has no remaining hours, the app shows "Today's daytime has ended. See Evening or pick another day," with buttons for both, and no outfit.
  ✓ Selecting Day today after 8pm shows the message. Both buttons work.
- **R10. Always-visible context.** The main screen shows the location, date, units (°F, mph), the data source ("Weather: Open-Meteo"), and a **"Now"** tag for today or **"Forecast"** for future dates.
  ✓ All five appear on phone and laptop for today and a future date, with the tag switching correctly.

### Recommendation and character

- **R11. One recommendation state.** The location, date, window and weather produce a single recommendation state that drives the character, weather icon, written recommendation and reminders (see *Recommendation state and data flow*).
  ✓ A test forecast that crosses each threshold changes the character, icon, text and reminders together. None ever disagree. For example, the umbrella shows on the character if and only if the umbrella reminder is shown.
- **R12. Character is the focus.** The character is the largest element on Main: above the fold on phone, and the left column on laptop. It shows the category outfit, plus the layer, umbrella, hat and sunglasses when their rules trigger.
  ✓ On a 390×844 phone viewport and a 1440×900 laptop viewport, the character is fully visible without scrolling and is the largest element.
- **R13. Weather details.** For the window, Main shows a weather icon, feels-like high/low, max rain chance, max UV, and max wind and gusts.
  ✓ The values equal the max/min of the API's hourly values over the window's hours.
- **R14. Written recommendation.** One or two lines below the character on phone, and beside it on laptop, naming the outfit and any layer (e.g., "Light tee and shorts. Bring a light layer for this morning").
  ✓ The text matches the outfit and layer shown on the character in every category.

### Reminders

- **R15. Reminder rules.** Shown when their thresholds are met over the window: umbrella at max rain chance ≥ 40%; sunscreen at max UV ≥ 3; hydration at max feels-like ≥ 80°F; bike wind at max wind ≥ 20 mph or gusts ≥ 30 mph. Each has an icon and short text, and the bike reminder says "strong wind" or "gusty", never "headwind".
  ✓ Test forecasts just below and at each threshold (39/40%, UV 2.9/3, 79/80°F, 19/20 mph, 29/30 mph gusts) hide or show the reminder correctly.
- **R16. Checkable reminders.** Each reminder is a real checkbox. Ticks are kept per date and window while the page is open, and reset on reload.
  ✓ Tick a reminder, switch date and back: still ticked. Reload: unticked. Works by keyboard (Space) and with VoiceOver.
- **R17. No reminders.** When none trigger, the area shows a short "Nothing extra to bring" line rather than disappearing.
  ✓ A cool, dry, calm, low-UV test forecast shows the line.

### Content variation

- **R18. Variations.** At least 3 outfit variations per category and 3 wordings per reminder, picked independently at random (see *Content variation*).
  ✓ Over 20 reloads of the same forecast, all 3 outfits and all 3 wordings of each reminder appear, and in different combinations.
- **R19. Same variations on return.** Returning to a date and window viewed earlier in the same visit shows the same outfit and wordings. A reload may pick new ones.
  ✓ View Tue Day, switch to Wed, back to Tue Day: identical outfit and wording.

### Info screen

- **R20. Info screen content.** It identifies the creator (Lily Coan), weather data source (Open-Meteo, CC BY 4.0, linked), place names (© OpenStreetMap contributors, ODbL, via Nominatim), how recommendations work (category table, reminder thresholds, EPA/NWS/CDC sources linked), privacy practices (see R26), art credits and licenses (see *Assets*), and a safety note: "WearCast isn't a safety service. Check [weather.gov](https://www.weather.gov/) for alerts." Phone has ← Back. Laptop has ✕ Close and an "On this page" section list.
  ✓ Every item is present and linked on both layouts. Back/Close returns to Main with the same location, date and window.

### Loading, errors and first visit

- **R21. Loading.** While weather loads, a greyed character outline, placeholder bars and "Getting the weather…" are shown, and announced through a live region.
  ✓ With network throttled to Slow 3G, the loading state appears and VoiceOver announces it.
- **R22. Location denied.** If permission is denied or unavailable, the app shows "Location is off for this site. Type a city or ZIP instead," focuses the city/ZIP field, and keeps any current location.
  ✓ Denying the browser prompt shows the message and focuses the field.
- **R23. Service error or missing data.** If Open-Meteo fails or times out after 10 seconds, the app shows "Couldn't load the weather," a reason, and Retry. If a single value is missing (e.g., UV is null), that tile shows "—", and the dependent reminder and accessory don't trigger.
  ✓ Blocking `api.open-meteo.com` in DevTools shows the error, and Retry recovers once unblocked. A response with UV removed shows "UV —" and no sunscreen reminder, hat or sunglasses.
- **R24. Reverse-geocode failure.** If Nominatim fails, the location shows as "Your location" and the weather still loads.
  ✓ Blocking `nominatim.openstreetmap.org` and tapping "use my location" still loads weather, labeled "Your location".
- **R25. First visit.** With no saved location, Main shows a waving character in a default outfit, "What should I wear today?", and Use my location / Type city or ZIP. Nothing is requested from any service until the User chooses.
  ✓ In a fresh private window, the first-visit screen appears and the network panel shows no weather or geocoding requests.

### Privacy, credits and deployment

- **R26. Privacy.** No cookies, analytics or trackers. The Info screen states:
  - only the most recent location is saved, on this device
  - coordinates are sent to Open-Meteo (logs kept up to 90 days) and, for "use my location", to Nominatim (usage details kept up to 180 days)
  - GitHub Pages logs visitor IP addresses

  ✓ DevTools shows no cookies and no third-party requests beyond Open-Meteo, Nominatim and any CDN listed in *Assets*. The Info text matches.
- **R27. Credits.** The Info screen credits every data source and art asset with its license.
  ✓ Every row in *Assets* appears in the Info credits.
- **R28. Deployment.** The app is a static site on GitHub Pages at a public `https://` URL, with no API keys or secrets in the repo.
  ✓ The deployed URL loads over HTTPS on a phone and a laptop. A repo search for "key", "token" and "secret" finds nothing sensitive.

### Responsive layout, one-handed use and accessibility

- **R29. Phone and laptop layouts.** Below 768 px wide the phone layout is used (stacked, controls at the bottom). At 768 px and above the laptop layout is used (header controls, week strip, character left and details right), matching the drawings.
  ✓ Resizing across 768 px switches layouts with nothing lost. 390 px and 1440 px match the drawings.
- **R30. One-handed phone use.** On phone, location, date and Day/Evening controls are in the bottom third of the screen. All touch targets are at least 44×44 px.
  ✓ On a real phone, each control is reachable with the thumb of the holding hand. Measured targets are ≥ 44 px.
- **R31. Accessibility (WCAG 2.2 AA).**
  - The character has a text alternative describing the current outfit and accessories (e.g., "Character wearing a light tee and shorts, sun hat and sunglasses, holding an umbrella").
  - Icons have labels, and decorative art is hidden from screen readers.
  - Text contrast is ≥ 4.5:1 and control contrast ≥ 3:1 on the cream background.
  - Everything is keyboard operable with a visible focus.
  - Status changes (loading, errors, new location) are announced in a live region.
  - It reflows at 320 px with no horizontal scrolling.

  ✓ An axe DevTools scan shows no violations. A keyboard-only walkthrough completes every task. A VoiceOver walkthrough on a phone completes choosing a location and date and reads the outfit. Contrast is checked with a contrast checker. The 320 px view has no sideways scroll.
- **R32. Visual direction.** Soft neutral: cream background, dark text, modern sans-serif typography, minimal decoration, as approved in research.
  ✓ The Developer confirms the deployed look matches the approved direction.

## Recommendation state and data flow

Define the weather inputs, recommendation categories, coded rules, and shared state. Weather values must come from the provider, and rules must follow the weather guidance cited in `research.md`. The selected location, date, and live weather data must produce one recommendation state that drives every visual and written output.

### Data flow

```
location (saved or chosen) ─┐
selected date ──────────────┼─► Open-Meteo hourly data ─► window hours ─► recommendation state ─┬─► character (outfit + add-ons + alt text)
selected window (Day/Evening)┘                               (remaining hours if today)          ├─► weather icon + details
                                                                                                  ├─► written recommendation
                                                                                                  └─► reminders (+ check marks)
```

1. **Inputs:** location (name, latitude, longitude), date (one of 7), window (Day 8am–8pm, or Evening 5pm–11pm).
2. **Fetch:** one Open-Meteo request per location returns all 7 days of hourly `apparent_temperature`, `precipitation_probability`, `uv_index`, `wind_speed_10m`, `wind_gusts_10m` and `weather_code`, plus current conditions. Changing the date or window reuses this data without a new request. A new request is made only for a new location or a Retry.
3. **Window hours:** the hourly values for the selected date between the window's start and end hours. For today, hours before the current hour are dropped. If none remain, the state is "window ended" (R9).
4. **Derive** the recommendation state below, then render every output from it and nothing else.

### Weather inputs (per window)

| Value | Derived as |
|---|---|
| `feelsHigh`, `feelsLow` | max and min of `apparent_temperature` |
| `rainMax` | max `precipitation_probability` |
| `uvMax` | max `uv_index` |
| `windMax`, `gustMax` | max `wind_speed_10m`, max `wind_gusts_10m` |
| `condition` | the most significant `weather_code` in the window (ranked: thunderstorm > snow > rain > drizzle > fog > overcast > partly cloudy > clear), mapped to one of 7 weather icons |

A missing value is `null`. Rules that depend on it don't trigger, and its tile shows "—" (R23).

### Rules (from `research.md`)

| Output | Rule |
|---|---|
| `category` | from `feelsHigh`: Hot ≥ 85°F · Warm 70–84°F · Mild 55–69°F · Cold < 55°F |
| `layer` | true when `feelsLow` < 70°F **and** `feelsLow` falls in a cooler category than `feelsHigh` |
| `umbrella` (reminder + rain gear) | `rainMax` ≥ 40% |
| `sunscreen` (reminder + hat + sunglasses) | `uvMax` ≥ 3 |
| `hydration` (reminder) | `feelsHigh` ≥ 80°F |
| `bikeWind` (reminder) | `windMax` ≥ 20 mph **or** `gustMax` ≥ 30 mph |

### Recommendation state

```js
{
  location: { name, lat, lon },
  date: "2026-10-05",
  window: "day" | "evening",
  label: "Now" | "Forecast",
  status: "ok" | "loading" | "windowEnded" | "error",
  weather: { feelsHigh, feelsLow, rainMax, uvMax, windMax, gustMax, condition },
  category: "hot" | "warm" | "mild" | "cold",
  outfitVariant: 0 | 1 | 2,
  addOns: { layer, umbrella, hat, sunglasses },          // booleans
  reminders: [ { type, wordingVariant: 0 | 1 | 2, checked } ],
  text: { recommendation, characterAlt }
}
```

- `hat` and `sunglasses` both equal `sunscreen`, and `umbrella` (rain gear) equals the umbrella reminder, so the character and reminders can never disagree (R11).
- `recommendation` and `characterAlt` are generated from `category`, `outfitVariant` and `addOns`, so the text always describes the outfit drawn.
- The state is rebuilt whenever the location, date, window or weather changes. Variant picks and check marks are looked up by date + window (see *Content variation*).

## Content variation

Define at least three outfit variations for each recommendation category and at least three wording variations for each reminder type. Define how outfit and reminder variations are chosen independently at random, and how a previously selected date keeps the same variations, including whether they persist after the page reloads.

### Outfit variations (3 per category)

| Category | Variation 1 | Variation 2 | Variation 3 |
|---|---|---|---|
| **Hot** (≥ 85°F) | light-colored tank top, denim shorts, sandals | loose linen button-up, light shorts, sneakers | light sundress or loose tee dress, sandals |
| **Warm** (70–84°F) | tee, light chinos, sneakers | tee, mid-length skirt or shorts, sneakers | short-sleeve button-up, light jeans, loafers |
| **Mild** (55–69°F) | long-sleeve tee, jeans, sneakers | light crewneck sweater, chinos, sneakers | tee with an open overshirt, jeans, boots |
| **Cold** (< 55°F) | sweater, puffer jacket, jeans, boots | hoodie, wool coat, trousers, sneakers | thermal top, fleece jacket, joggers, beanie |

**Add-ons** (drawn over any outfit): light jacket tied at the waist (layer), umbrella in hand (rain gear), sun hat, sunglasses.

**Written recommendation template:** "{Outfit description}." + "Bring a light layer for the {cooler part of the window}." when the layer is on. Example: "Light tank top, denim shorts and sandals. Bring a light layer for this morning."

### Reminder wording (3 per reminder)

| Reminder | Wording 1 | Wording 2 | Wording 3 |
|---|---|---|---|
| **Umbrella** | "Grab an umbrella: {rain}% chance of rain around {time}." | "Rain's likely ({rain}%) around {time}. Pack an umbrella." | "Don't get caught out: {rain}% rain chance around {time}." |
| **Sunscreen** | "UV hits {uv} today. Put on sunscreen before you head out." | "Strong sun (UV {uv}). Sunscreen, hat, sunglasses." | "UV {uv}: SPF 15+ before you go, and reapply if you're out a while." |
| **Hydration** | "Feels like {feelsHigh}°. Carry a water bottle and refill it." | "It's a sweaty one ({feelsHigh}°). Keep water on you." | "Hot out there: {feelsHigh}°. Drink up throughout the day." |
| **Bike wind** | "Gusty ride: wind up to {wind} mph, gusts {gust}." | "Strong wind for biking ({wind} mph). Give yourself extra time." | "Windy on two wheels: gusts to {gust} mph. Ride with care." |

`{time}` is the hour of `rainMax`. `{uv}`, `{wind}`, `{gust}` and `{feelsHigh}` are the window's values, rounded.

### How variations are chosen and kept

- When a date + window is shown for the first time in a visit, the app picks `outfitVariant` (0–2) at random, and separately picks `wordingVariant` (0–2) at random for each triggered reminder, using `Math.random()`. The picks are independent, so outfits and wordings appear in any combination (R18).
- Picks are stored in memory, keyed by `date + window` (e.g., `2026-10-05|day`), together with that key's check marks. Returning to the same date + window in the same visit reuses them (R19).
- Nothing is written to the device: a reload or a new location clears the picks and makes new ones (R6). If the weather for a date changes category on Retry, the same variant number is applied to the new category.

## Assets

List every art and graphical asset: the character, each outfit variation, icons, and any other visuals. For each, note where it appears, its format, and whether it will be created, generated, or licensed, with its credit or license.

All assets are stored in the repo and served from GitHub Pages. No asset is loaded from a CDN or third-party host, so viewing the app sends no extra requests (R26).

### Character (layered SVG, drawn in this order)

| Asset | Count | Appears | Source and license |
|---|---|---|---|
| Head, hair, face | 1 set (plus a waving/happy face for first visit) | Main, first visit, loading (greyed) | [Open Peeps](https://www.openpeeps.com/) by Pablo Stanley, CC0. Parts taken from the [`react-peeps`](https://github.com/CeamKrier/react-peeps) package (MIT). |
| Base body (front-facing standing pose, plus a waving-arm variant) | 1 + 1 | Main, first visit, loading (greyed) | Original SVG, created with AI assistance from the Developer's direction, matching Open Peeps' line style |
| Outfits (Hot, Warm, Mild, Cold × 3; see *Content variation*) | 12 | Main | Original SVG, as above |
| Layer: light jacket tied at the waist | 1 | Main, when `layer` is true | Original SVG |
| Rain gear: umbrella in hand | 1 | Main, when `umbrella` is true | Original SVG |
| Sun hat | 1 | Main, when `hat` is true | Original SVG |
| Sunglasses | 1 | Main, when `sunglasses` is true | Original SVG, or Open Peeps glasses (CC0) if they fit |
| Default first-visit outfit | 1 (reuses a Warm outfit) | First visit | Original SVG |

### Icons (SVG)

| Asset | Meteocons name | Appears | Source and license |
|---|---|---|---|
| Clear | `clear-day` | weather details, laptop week strip | [Meteocons](https://github.com/basmilius/meteocons) © Bas Milius, MIT |
| Partly cloudy | `partly-cloudy-day` | as above | Meteocons, MIT |
| Overcast | `overcast` | as above | Meteocons, MIT |
| Fog | `fog` | as above | Meteocons, MIT |
| Drizzle | `drizzle` | as above | Meteocons, MIT |
| Rain | `rain` | as above | Meteocons, MIT |
| Thunderstorm | `thunderstorms` | as above | Meteocons, MIT |
| Snow | `snow` | as above | Meteocons, MIT |
| Umbrella reminder | `umbrella` | Reminders | Meteocons, MIT |
| Sunscreen reminder | `uv-index` | Reminders, UV tile | Meteocons, MIT |
| Hydration reminder | `raindrop` | Reminders | Meteocons, MIT |
| Bike wind reminder | `wind` + bike | Reminders, wind tile | Meteocons `wind` (MIT) with [Lucide](https://lucide.dev/) `bike` (ISC) |
| Interface icons: info ⓘ, locate, search, back, close, error | ~6 | Main, Info, states | [Lucide](https://lucide.dev/), ISC |

### Other visuals

| Asset | Appears | Source |
|---|---|---|
| Typography | everywhere | the device's system sans-serif font stack (e.g., San Francisco on Apple, Segoe UI on Windows). Modern, with no font files to load. |
| Color palette (cream background, dark text, one muted accent) | everywhere | Original. Values are chosen during the build and checked against R31 contrast. |
| App name "WearCast" as text | header, Info | Original text, no logo graphic |

**Total:** about 22 character pieces (about 4 Open Peeps parts, 18 original SVG), 12 Meteocons icons, about 7 Lucide icons.

## Out of scope

Record features intentionally excluded from this project.

- **Night weather icons for Evening.** Daytime icons are used for both windows (decided above).
- **°C / km/h units or a unit toggle.** The app uses °F and mph only.
- **Non-US locations.** Covered by the brief's US scope (R5).
- **Saving anything beyond the most recent location:** favorites, multiple locations, check marks, variation picks, preferences (R6).
- **Accounts, sign-in, sync across devices.**
- **Push notifications or scheduled alerts.**
- **Hourly "what changes" timeline, an "I'm biking today" toggle, and a separate "why this outfit" explanation.** These were considered as additional features in research. Day/Evening was chosen, and checkable reminders were added.
- **Wind direction relative to a route** (e.g., headwind). The app doesn't know the direction of travel.
- **Character customization** (skin tone, hair or body choice by the User), **and personal comfort settings** (e.g., "I run cold").
- **Shopping links, Client product placement, ads or sharing.** This is a prototype. A commercial launch would also need Open-Meteo's commercial plan (see `research.md`).
- **Other weather inputs:** pollen, air quality, severe-weather alerts. The Info screen instead points Users to weather.gov for alerts (R20).
- **Offline use or installation as an app (PWA).**
- **Languages other than English.**
- **A dedicated tablet layout.** Tablets get the phone or laptop layout by width (R29).
- **Analytics or usage tracking.**

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

- **2026-10-04 (planning): R33 added, test forecast mode** (approved by the Developer). The plan uses saved test forecasts to verify thresholds and states, and to give usability testers identical weather. *Requirement:* with `?fixture=<name>` in the URL, the app loads a saved forecast instead of Open-Meteo, and a visible banner reads **"Test data, not live weather."** Without the parameter, only live data is used (R1), and nothing in the app links to test mode. ✓ `?fixture=storm-evening` shows the banner and the stored values. The normal URL shows no banner and makes live requests.

## Approval

The Developer reviews and explicitly approves this specification and its screen designs before planning begins.

Approved by the Developer on 2026-10-04.

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
