# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Research your context of use, references, weather guidance, technical options, and choices that will guide the specification.

## Instructions for the Developer

Judge sources and recommendations, make the consequential decisions, and keep this file current as the work develops.

To begin, open the project repository in a fresh chat and enter:

`Read ./research.md and help me begin Project 3 research.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, and this file. Ask one focused question at a time. Help investigate and compare options without deciding for the Developer. Verify sources directly and keep this file concise.

## Context of use

As the User, describe when and where you would use the app and what you need from it. Record important circumstances, assumptions, and limitations.

I'm a college student in Austin, Texas. I'd use the app in two situations:

- **Getting ready in the morning:** a quick check while choosing an outfit for the day.
- **Planning ahead (midday or evening):** checking conditions for social plans with friends outside my daily routine, sometimes for a later time or another day.

**Circumstances**

- I travel by car, bike or on foot, and I'm usually out for a couple of hours before I can change. The outfit has to work for that whole stretch, not just the moment I leave.
- Cycling and walking leave me exposed to sun, heat, wind and rain more than driving does.
- I mainly use my phone, often one-handed while getting ready. I sometimes use my laptop when planning ahead.
- Austin is usually sunny, hot and humid. It gets cold for only about a month or two (December–February).

**Assumptions** (to check in the weather research)

- Heat, humidity, sun and UV exposure will drive most recommendations. Cold-weather outfits matter only briefly.
- Sudden rain or storms are possible even on mostly sunny days.

**Limitations**

- The app recommends clothing from forecast data. It can't account for indoor conditions such as air-conditioned classrooms, personal tolerance for heat or cold, or dress codes.
- Forecasts get less reliable further ahead, so plans several days out are less certain.

## User story

Write at least one user story grounded in your context of use:

> As a [type of user], I want to [need or goal], so that [reason or outcome].

Focus on the need rather than prescribing an interface or feature.

1. As a college student getting ready in the morning, I want to know what to wear for the hours I'll be out, so that I'm comfortable without having to interpret temperature and humidity myself.
2. As a college student planning time out with friends, I want to know about likely changes in conditions during my plans, so that I'm not caught unprepared by rain, heat or sun.

## References

Collect 5–10 reference images from relevant products and interfaces. Save each image in `reference/`, identify its source, and record a brief observation about what is useful, ineffective, or relevant to this project. Reference images are examples only; do not use them in the app.

Phone screenshots were taken on my own device on 2026-10-04 from apps installed through the App Store. The laptop screenshot was taken the same day from the website.

| Image | Source | Observation |
|---|---|---|
| [`dressMeWeather.PNG`](reference/dressMeWeather.PNG) | Dress Me Weather (iOS app) | **Useful:** the closest match to the brief. Clean and minimal: the outfit is the focus, with day, condition, high/low and an icon summarized below. Location is shown at the top, and dots suggest swiping between days, which works one-handed. **Ineffective:** a flat layout of clothing photos with no character. It doesn't explain why the outfit fits, and has no reminders, feels-like, humidity or UV. |
| [`DailyDressMeDesktop.png`](reference/DailyDressMeDesktop.png) | Daily Dress Me website, [dailydressme.com](https://dailydressme.com/) (the same product as Dress Me Weather) | **Useful:** clean, intuitive and responsive. The laptop layout shows several days side by side instead of stretching the phone screen, which matches the brief's "use the larger screen." Location is a clear setting in the corner. **Ineffective:** temperatures have no units, and the low is shown as faint grey text. There's no explanation or reminders. |
| [`CARROTweather.PNG`](reference/CARROTweather.PNG) | CARROT Weather (iOS app) | **Useful:** clear hierarchy (location → icon + temperature → feels-like → one-line summary). The "Highlights" card shows an upcoming change, which relates to user story 2. The hourly forecast with metric toggles is easy to scan. Bottom tabs are reachable one-handed. **Ineffective:** the illustration is just scenery, and a premium ad sits in the main scroll. |
| [`bitmoji.PNG`](reference/bitmoji.PNG) | Bitmoji (iOS app), outfit editor | **Useful:** shows how an outfit reads on a full-body character. Clothing is grouped by category (hat, top, bottoms, shoes, outerwear), which suggests outfits built from layered parts. **Not relevant:** manual customization. This app chooses the outfit. |
| [`WeatherKitty.PNG`](reference/WeatherKitty.PNG) | Weather Kitty (iOS app), main screen | **Useful:** a large image with minimal text makes the visual the focus, and the friendly caption adds personality. **Ineffective:** the caption isn't about the weather, so the image adds charm but no information. The "Treat Yourself!" upsell takes up prime thumb space. |
| [`weatherInfoWeatherKitty.PNG`](reference/weatherInfoWeatherKitty.PNG) | Weather Kitty (iOS app), forecast screen | **Useful:** a playful written summary ("pack your kitty a tiny umbrella") turns data into advice, a model for reminder tone. **Ineffective (what to avoid):** chaotic and cluttered, with paywalls locking wind, feels-like and UV, which are the variables an outfit depends on. |

**Takeaways**

- Visual direction: clean, minimal, intuitive and aesthetic, like Daily Dress Me, not the dense layout of Weather Kitty.
- None of the references combine a character, the outfit reasoning and reminders. That gap is this app's opportunity.
- Humidity and UV should be visible inputs, since they can change the recommendation (for example, hat or no hat).

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

### Weather providers

Checked 2026-10-04 against official documentation, plus live requests for Austin, TX (30.2672, -97.7431) sent with a browser `Origin` header.

| Source | Supports | Limitations |
|---|---|---|
| [Open-Meteo Forecast API](https://open-meteo.com/en/docs) and [Terms](https://open-meteo.com/en/terms) | No key. One request returns current and daily temperature, feels-like (`apparent_temperature`), humidity, precipitation chance, weather code, wind and gusts, and **UV index**. Up to 16 forecast days (confirmed). Fahrenheit/mph and local time zone options. CORS allowed (`access-control-allow-origin: *`). Free tier: 600/min, 5,000/hour, 10,000/day. | Free only for non-commercial use. The terms list "promotional activities" as commercial, so a Client campaign launch would likely need a paid plan. Data is CC BY 4.0 and must be credited. |
| [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) | No key. City search filtered to the US (`countryCode=US`) returned Austin, TX first. A ZIP search (78705) also returned Austin. | Ambiguous city names return several matches (Austin TX/MN/IN), so the User must be able to pick one. |
| [NWS API](https://www.weather.gov/documentation/services-web-api) | Official US data, "free to use for any purpose", no key, CORS allowed. 7-day hourly forecast plus raw grid data (heat index, wind gust, HeatRisk). | No UV index in any of its 59 grid layers. No city search. Current conditions need a separate station call. Not selected, but useful as a guidance source. |
| [NOAA NESDIS, "How Reliable Are Weather Forecasts?"](https://www.nesdis.noaa.gov/about/k-12-education/weather-forecasting/how-reliable-are-weather-forecasts) | A 7-day forecast is accurate about 80% of the time and a 5-day forecast about 90%. Forecasts of 10 days or more are right about half the time. Supports limiting the forecast range. | General figures, not specific to Open-Meteo or to Austin. |
| [OpenWeather](https://openweathermap.org/price) | Free tier: current weather, 5-day/3-hour forecast, geocoding. | Requires an API key, which would be exposed in a public static site. No UV in the free current/forecast APIs. Not selected. |

### Apparel and reminder guidance

Checked 2026-10-04.

| Source | Supports | Limitations |
|---|---|---|
| [EPA UV Index Scale](https://www.epa.gov/sunsafety/uv-index-scale-0) | UV 1–2: minimal protection. UV 3–7: SPF 15+ sunscreen, protective clothing, wide-brimmed hat, sunglasses, shade at midday. UV 8+: the same, with extra care. Basis for a sunscreen reminder and hat/sunglasses at UV ≥ 3. | Groups 3–7 together, so there's no separate "moderate" vs "high" guidance. |
| [NWS Heat Index](https://www.weather.gov/ama/heatindex) | Caution 80–90°F, Extreme Caution 90–103°F, Danger 103–124°F, Extreme Danger 125°F+. Humidity raises felt heat, and direct sun can add up to 15°F. Basis for a hydration reminder at feels-like ≥ 80°F, and for using feels-like rather than air temperature. | Heat index values are for shade. Open-Meteo's `apparent_temperature` is a related but not identical measure. |
| [CDC Heat Health](https://www.cdc.gov/heat-health/about/index.html) | "Carry a water bottle. Drink and refill it throughout the day." Hydration reminder wording. | No clothing guidance on this page. |
| [NWS "Are You Ready? Heat Wave"](https://www.weather.gov/media/fwd/A5032_AreYouReady-HeatWave.pdf) | Loose-fitting, lightweight, light-colored clothing; light colors reflect sunlight. Guides hot-weather outfits. | General guidance, no temperature bands. |
| [NWS Cold Safety](https://www.weather.gov/safety/cold-before) | "Dress for the weather in warm clothes, gloves, hat… jacket." Guides cold-weather outfits. | No temperature thresholds or layering detail. |
| [NWS Probability of Precipitation](https://www.weather.gov/ffc/pop) | PoP is the probability of at least 0.01" of rain at that point. Explains the rain-chance value. | No official umbrella threshold. The Developer must choose one. |
| [NWS wind threat levels](https://www.weather.gov/mlb/seasonal_wind_threat) | ~20 mph sustained or 25–30 mph gusts: breezy to windy. 21–25 mph or 30–35 mph gusts: windy. 26–39 mph or 35–57 mph gusts: advisory level. Basis for bike wind warning thresholds. | Written for property and general safety, not cyclists. |
| [Where the Road Forks](https://wheretheroadforks.com/how-much-wind-is-too-much-for-cycling-windy-day-bike-tips/), [RoadBikeRider](https://www.roadbikerider.com/?p=39946) | Cycling: under 20 mph is generally fine, 20–30 mph very noticeable, 30–35 mph+ hazardous, ~40 mph+ stay off the road. Supports a bike warning at ~20 mph sustained or ~30 mph gusts. | Cycling blogs, weaker evidence. Consistent with the NWS levels. |

**Gaps:** no authoritative source maps temperature bands to specific outfits, and none sets an umbrella threshold. Both are Developer decisions based on the principles above and the Austin context.

### Accessibility, location, privacy and deployment

Checked 2026-10-04.

| Source | Supports | Limitations |
|---|---|---|
| [WCAG 2.2 Quick Reference (AA)](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=aa) | Text alternatives for the character and icons (1.1.1). 4.5:1 text contrast, 3:1 for large text (1.4.3). 3:1 for controls and meaningful graphics (1.4.11). Reflow at 320 px width with no horizontal scrolling (1.4.10). Full keyboard operation (2.1.1) with visible focus (2.4.7). Targets at least 24×24 CSS px (2.5.8). Loading, error and status messages announced through a live region (4.1.3). | 24 px is a minimum. Comfortable one-handed phone use needs larger targets. |
| [Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | The widely cited 44×44 pt minimum touch target, a better target for one-handed phone controls than WCAG's 24 px. | The page loads with JavaScript, so the 44 pt figure couldn't be confirmed directly. Verify before relying on it. |
| [MDN Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) | Device location works only on HTTPS, always asks the User's permission, and returns an error such as `PERMISSION_DENIED` when refused. The [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) can check whether permission is granted, denied or not yet asked. | Permission lifetime varies by browser. Denied location must fall back clearly to manual entry. |
| [Open-Meteo Terms: Privacy](https://open-meteo.com/en/terms#privacy) | No cookies or tracking. Server logs may contain coordinates and are deleted after 90 days. Not shared with third parties. | Coordinates do leave the device. The info screen must say so. |
| [About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) | Visitor IP addresses are logged by GitHub for security. | Must be disclosed in the privacy notes. |
| [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) | "If the account that owns the repository uses GitHub Free… the repository must be public." | **`lilycoan/Project-3` is currently private.** It must be made public before deploying, unless the account has GitHub Pro. |
| [Securing GitHub Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) | `github.io` sites are served over HTTPS automatically, which device location needs. | None. |
| [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | 1 GB site, 100 GB/month soft bandwidth. Ample for a static prototype. | None relevant. |


## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

- **Weather provider: Open-Meteo** (forecast and geocoding APIs). It's the only option checked that provides UV, feels-like, humidity, rain chance and current conditions from one keyless source, along with city/ZIP search. *Trade-off:* the free tier is non-commercial. This ad-free prototype fits within it, but a Client campaign launch would need Open-Meteo's commercial plan. The app must credit Open-Meteo (CC BY 4.0).
- **Forecast range: 7 days** (today + 6). This covers planning with friends a few days ahead, and NOAA puts 7-day accuracy at about 80%, compared with about 50% at 10 days or more. Open-Meteo's 16-day range is deliberately not used.
- **Recommendation categories: 4, by feels-like temperature.** Feels-like is used because NWS notes that humidity and sun change how heat is felt, which matters in Austin.

  | Category | Feels-like | Outfit direction |
  |---|---|---|
  | Hot | ≥ 85°F | light, loose, light-colored (NWS heat guidance): tank or tee, shorts or skirt |
  | Warm | 70–84°F | tee, light pants or shorts |
  | Mild | 55–69°F | long sleeves or a light layer |
  | Cold | < 55°F | jacket, pants, closed shoes (NWS cold guidance) |

  *Trade-off:* 4 categories × 3 variations = 12 outfits, enough to give meaningful advice without overloading the art budget.
- **Category input: daytime feels-like range (8am–8pm local).** The daytime high chooses the category. When the daytime low falls in a cooler category, the app suggests a removable layer. This fits being out for a couple of hours and Austin's cool-morning, hot-afternoon swings, and applies the same rule to today and forecast dates. Open-Meteo's hourly `apparent_temperature` covers all 7 days (checked: 168 hours). *Trade-off:* more logic than a single daily value.
- **Additional feature: time-of-day choice (Day 8am–8pm or Evening 5pm–midnight).** *Justification:* the context of use and user story 2 include plans with friends at night, which a fixed 8am–8pm window misses. The selected window replaces 8am–8pm in every recommendation rule in this section: category, layer and all reminders. Open-Meteo hourly data runs to 11pm local, so Evening covers 5pm–11pm hours. At night UV is low, so sun reminders and accessories will usually drop away on their own. *Trade-off:* one more control on the main screen, and each date can now have two recommendations.
- **Layer add-on:** shown only when the daytime low is Mild or Cold (feels-like < 70°F) and the high is in a warmer category. It appears on the character as an extra art piece, such as a light jacket tied at the waist or carried, plus a written tip. Example of when it doesn't trigger: Austin on 2026-10-05 forecast 73–87°F (Warm low, Hot high), so no layer.
- **Reminders** (each checked over the selected time window, Day or Evening, on the selected date):

  | Reminder | Triggers when | Basis |
  |---|---|---|
  | Umbrella | max precipitation probability ≥ 40% | Developer's choice. A middle ground between false alarms and getting caught out, given Austin's pop-up storms. |
  | Sunscreen | max UV index ≥ 3 | EPA UV Index Scale |
  | Hydration | max feels-like ≥ 80°F | NWS heat index "Caution" level; CDC hydration guidance |
  | Bike wind | sustained wind ≥ 20 mph or gusts ≥ 30 mph | NWS wind threat levels; cycling sources |

  Sunscreen and hydration will trigger on most Austin days from spring through fall, so varied wording is especially important for them.
- **Rain gear on the character:** when the umbrella reminder triggers (rain chance ≥ 40%), the character also shows rain gear, such as an umbrella in hand.
- **Sun accessories on the character:** when the sunscreen reminder triggers (UV ≥ 3), the character wears a hat and sunglasses, following EPA guidance.
- **Art estimate (~28 assets):**

  | Asset | Count |
  |---|---|
  | Base character (one front-facing pose) | 1 |
  | Outfits (4 categories × 3) | 12 |
  | Layer add-on | 1 |
  | Rain gear (umbrella) | 1 |
  | Sun accessories (hat, sunglasses) | 2 |
  | Weather icons (clear, partly cloudy, overcast, fog, drizzle/rain, thunderstorm, snow) | ~7 |
  | Reminder icons (umbrella, sunscreen, hydration, bike wind) | 4 |

  The main risk is that the 17 character pieces must stack correctly on one body.
- **Artwork approach: licensed, plus original SVG where needed.** This keeps drawing time low.
  - **Character and outfits:** [Open Peeps](https://www.openpeeps.com/) (CC0, free for commercial use, mix-and-match parts with standing poses). Any outfit or accessory piece Open Peeps lacks is drawn as simple SVG from the Developer's sketches and credited as original work made with AI assistance.
  - **Weather and reminder icons:** [Meteocons](https://github.com/basmilius/meteocons) (MIT, © Bas Milius). Checked in the [`@iconify-json/meteocons`](https://www.npmjs.com/package/@iconify-json/meteocons) package: `clear-day`, `partly-cloudy-day`, `overcast`, `fog`, `drizzle`, `rain`, `thunderstorms`, `snow`, `umbrella`, `uv-index` (sunscreen), `raindrop` (hydration) and `wind` are all present. Meteocons has no bicycle icon, so the bike reminder pairs `wind` with Lucide's `bike` icon ([lucide-static](https://www.npmjs.com/package/lucide-static), ISC) or an original SVG.
  - *Trade-off:* less distinctive than fully original art, but realistic in the time available.
- **Screen structure: two screens, Main and Info.** Location, date and Day/Evening are chosen on the main screen, not a separate screen. On phones, those controls sit at the bottom within thumb reach for one-handed use. The character remains the focus above them. On laptops, a large character for the selected date sits alongside a 7-day strip showing each day's weather icon and feels-like high/low. Clicking a day selects it. This uses the wider screen for planning ahead (as in Daily Dress Me) while keeping the character as the focus. *Trade-off:* a mid-point between a full week overview and a single focused day.
- **Visual direction: soft neutral, like Daily Dress Me.** Clean and minimal, with a cream background, dark text, modern typography and plenty of white space. It suits Open Peeps' line style. Text stays dark on light backgrounds to meet WCAG 4.5:1 contrast. *Trade-off:* calmer than a bold brand look. The playfulness comes from the character and reminder wording rather than the colors. Specific colors and fonts are set in the spec.
- **Deployment: GitHub Pages** from the public `lilycoan/Project-3` repo (made public 2026-10-04). Served over HTTPS automatically, which device location requires. Free, with no build server needed. *Trade-off:* the repo, including research notes and transcripts, is publicly visible.

## Revisions

Record new evidence or changed decisions and explain why they changed.

- **2026-10-04: checkable reminders added** (from the Developer's screen sketches). Reminders can be ticked off like a packing list, because the context of use involves being out for hours and needing to bring items such as an umbrella, sunscreen and water. Check marks are kept only while the page is open and reset on reload, so the app still saves only the most recent location on the device, as the brief requires. *Trade-off:* a second extra feature beyond the Day/Evening choice, adding build and test scope.
- **2026-10-04: Nominatim added for reverse geocoding.** *New evidence:* Open-Meteo's [geocoding API](https://open-meteo.com/en/docs/geocoding-api) only searches by name or postal code, so "use my location" would have no place name to show. Alternatives checked:
  - **[US Census geocoder](https://geocoding.geo.census.gov/geocoder/):** returned "Austin city, Texas" but sends no CORS header, so browsers block it.
  - **[Nominatim](https://operations.osmfoundation.org/policies/nominatim/):** returned "Austin, Texas" with CORS allowed. Its terms: at most 1 request/second across all Users, the app must identify itself (browser Referer), results must be cached, no autocomplete, and © OpenStreetMap contributors (ODbL) attribution is required. Per the [OSMF Privacy Policy](https://osmfoundation.org/wiki/Privacy_Policy) it logs IP, browser, referrer and time, keeps usage details 180 days, and doesn't share them except with service providers or by law.

  *Decision:* use Nominatim only for one reverse lookup per "use my location" tap. *Trade-off:* a second provider to credit and disclose in privacy notes, in exchange for showing a clear place name.
- **2026-10-04: artwork approach changed to a hybrid character.** *New evidence:* the [`react-peeps`](https://github.com/CeamKrier/react-peeps) package (MIT; Open Peeps art is CC0) file list shows that Open Peeps standing poses have their clothing drawn into the pose. Only bust poses have swappable tops (e.g., `Hoodie`, `Sweater`, `Dress`, `ShirtCoat`), and there are no separate shorts, skirts, shoes or tied jackets. The approved 12 head-to-toe outfits and add-ons can't be built from Open Peeps alone.

  *Decision:* the character combines an Open Peeps head, hair and face (CC0) with an **original simple SVG body, clothing and add-ons**, drawn to match Open Peeps' line style and created with AI assistance from the Developer's direction. Icons are unchanged (Meteocons MIT, Lucide ISC). *Trade-off:* more original SVG work than planned, in exchange for full outfits and reliable layering.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

Approved by the Developer on 2026-10-04.

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
