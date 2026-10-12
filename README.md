# WearCast

A playful weather app that dresses a character for the forecast. Pick a US place and a day; the character's outfit, the weather details, a written recommendation and checkable reminders (umbrella, sunscreen, water, a layer) all come from one recommendation state.

**Live:** https://lilycoan.github.io/Project-3/

Built by Lily Coan. Weather from [Open-Meteo](https://open-meteo.com/); art credits, data sources and privacy details are on the app's Info screen (ⓘ).

## Run locally

Plain HTML, CSS and ES modules, with no build step and no dependencies.

```sh
python3 -m http.server 8137 --bind 127.0.0.1
```

Then open http://127.0.0.1:8137. A server is required: ES modules and device location don't work from `file://`.

- **Tests:** `node --test` (Node 18+)
- **Test forecasts:** add `?fixture=<name>` to load `fixtures/<name>.json` instead of live weather (a banner shows test mode)

## Project documents

- `research.md`: context of use, user story, references and sources
- `spec.md`: requirements and acceptance checks, with revisions
- `plan.md`: build checkpoints, verification, usability testing and revisions
- `transcripts/`: Developer and Agent conversations
