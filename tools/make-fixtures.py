#!/usr/bin/env python3
"""Generate WearCast's made-up test forecasts (spec R33) in Open-Meteo's response format.

Run from the repo root:  python3 tools/make-fixtures.py
Writes fixtures/<name>.json. fixtures/austin-sample.json is a real recorded response and isn't touched.

Each fixture repeats one 24-hour pattern for 7 days; js/fixtures.js moves the dates so day one is today.
Open a fixture with ?fixture=<name>. Optional extras in the "fixture" block, used by js/app.js in test mode only:
  "now": {"hour": 21}    fixes the local hour (e.g. to show today's ended Day window)
  "fail": "timeout"      makes loading fail with that reason (timeout | offline | server)
"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "fixtures"
AUSTIN = {"name": "Austin, TX", "lat": 30.26715, "lon": -97.74306}
START = "2026-10-09"  # any date works: dates are shifted to today on load

UNITS_CURRENT = {"time": "iso8601", "interval": "seconds", "apparent_temperature": "°F", "temperature_2m": "°F",
                 "precipitation_probability": "%", "uv_index": "", "wind_speed_10m": "mp/h",
                 "wind_gusts_10m": "mp/h", "weather_code": "wmo code"}
UNITS_HOURLY = {k: v for k, v in UNITS_CURRENT.items() if k not in ("interval", "temperature_2m")}

# A warm Austin day with a cool start, used as the base pattern.
BASE = {
    "feels": [60, 59, 59, 58, 58, 58, 59, 61, 63, 66, 70, 74, 77, 80, 82, 83, 82, 79, 76, 73, 70, 67, 65, 63],
    "rain": [10] * 20 + [30, 60, 70, 50],
    "uv": [0] * 7 + [0.4, 1.2, 2.6, 4.1, 5.6, 6.8, 7.1, 6.4, 5.0, 3.2, 1.6, 0.5, 0.1] + [0] * 4,
    "wind": [4, 4, 3, 3, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 10, 9, 8, 7, 6, 7, 8, 8, 7],
    "code": [0] * 7 + [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3] + [61, 61, 61],
}


def pattern(**changes):
    """The base pattern with whole series replaced, e.g. rain=[0]*24. Gusts default to 1.6 × wind."""
    p = {**BASE, **changes}
    p.setdefault("gust", [round(w * 1.6) for w in p["wind"]])
    return p


def shifted(series, by):
    return [v + by for v in series]


def flat(feels, rain, uv, wind, gust, code=2):
    """The same values every hour, so a window's max equals the value (threshold edges, R15)."""
    return {"feels": [feels] * 24, "rain": [rain] * 24, "uv": [uv] * 24, "wind": [wind] * 24,
            "gust": [gust] * 24, "code": [code] * 24}


def write(name, description, p, location=AUSTIN, extra=None):
    from datetime import date, timedelta
    start = date.fromisoformat(START)
    hourly = {"time": [], "apparent_temperature": [], "precipitation_probability": [], "uv_index": [],
              "wind_speed_10m": [], "wind_gusts_10m": [], "weather_code": []}
    for d in range(7):
        for h in range(24):
            hourly["time"].append(f"{start + timedelta(days=d)}T{h:02d}:00")
            hourly["apparent_temperature"].append(p["feels"][h])
            hourly["precipitation_probability"].append(p["rain"][h])
            hourly["uv_index"].append(p["uv"][h])
            hourly["wind_speed_10m"].append(p["wind"][h])
            hourly["wind_gusts_10m"].append(p["gust"][h])
            hourly["weather_code"].append(p["code"][h])
    data = {
        "fixture": {"description": description, "location": location, **(extra or {})},
        "latitude": 30.269146, "longitude": -97.75338, "utc_offset_seconds": -18000,
        "timezone": "America/Chicago", "timezone_abbreviation": "GMT-5", "elevation": 157.0,
        "current_units": UNITS_CURRENT,
        "current": {"time": f"{START}T09:00", "interval": 900, "apparent_temperature": p["feels"][9],
                    "temperature_2m": p["feels"][9], "precipitation_probability": p["rain"][9],
                    "uv_index": p["uv"][9], "wind_speed_10m": p["wind"][9], "wind_gusts_10m": p["gust"][9],
                    "weather_code": p["code"][9]},
        "hourly_units": UNITS_HOURLY,
        "hourly": hourly,
    }
    (OUT / f"{name}.json").write_text(json.dumps(data, indent=1))


FIXTURES = {
    "usability": ("Made-up forecast for usability tests: warm day (feels 58-83°F) with a cool morning, UV up to 7, "
                  "rain 60-70% from 9pm. Same every day.", pattern()),
    # One per category (R11, R14). Day window values are noted in each description.
    "hot-all-reminders": ("Hot and stormy: Day feels 76-96°F, rain 60%, UV 9, wind 22 mph, gusts 35. "
                          "Every reminder and add-on except the layer.",
                          pattern(feels=shifted(BASE["feels"], 13), rain=[60] * 24,
                                  uv=[min(9, u * 1.3) for u in BASE["uv"]], wind=[22] * 24, gust=[35] * 24,
                                  code=[95] * 24)),
    "mild-layer": ("Mild with a cold start: Day feels 46-66°F, dry, UV 2, wind 10 mph. Mild outfit with the layer, no reminders.",
                   pattern(feels=shifted(BASE["feels"], -17), rain=[5] * 24, uv=[min(2, u) for u in BASE["uv"]],
                           code=[3] * 24)),
    "cold-sunny": ("Cold and sunny: Day feels 30-50°F, dry, UV 4, wind 12 mph. Cold outfit with hat and sunglasses.",
                   pattern(feels=shifted(BASE["feels"], -33), rain=[0] * 24, uv=[min(4, u) for u in BASE["uv"]],
                           wind=[12] * 24, code=[0] * 24)),
    "calm-nothing": ("Cool, dry, calm and dim: Day feels 62-68°F, rain 10%, UV 1, wind 5 mph. "
                     "Mild outfit and 'Nothing extra to bring' (R17).",
                     pattern(feels=[62] * 8 + [62, 63, 64, 65, 66, 67, 68, 68, 67, 66, 65, 64, 63] + [62] * 3,
                             rain=[10] * 24, uv=[min(1, u) for u in BASE["uv"]], wind=[5] * 24, code=[3] * 24)),
    # The spec's R33 example: a calm day, then thunderstorms and wind in the evening.
    "storm-evening": ("Storm in the evening: Day dry and warm; Evening feels 66-79°F, rain 80%, thunderstorms, "
                      "wind 21 mph, gusts 38.",
                      pattern(rain=[10] * 17 + [80] * 7, code=BASE["code"][:17] + [95] * 7,
                              wind=BASE["wind"][:17] + [21] * 7, gust=[round(w * 1.6) for w in BASE["wind"][:17]] + [38] * 7)),
    # Missing values (R23): UV is null in every hour → "UV —", no sunscreen, hat or sunglasses.
    "missing-uv": ("Usability weather with UV removed (null) in every hour.", pattern(uv=[None] * 24)),
    # Threshold edges (R15): just below every reminder, at every reminder, and gusts alone.
    "edges-below": ("Just below every threshold: rain 39%, UV 2.9, feels 79°F, wind 19 mph, gusts 29. No reminders.",
                    flat(79, 39, 2.9, 19, 29)),
    "edges-at": ("At every threshold: rain 40%, UV 3, feels 80°F, wind 20 mph, gusts 30. All four reminders.",
                 flat(80, 40, 3, 20, 30)),
    "edges-gust": ("Gusts alone at the threshold: wind 19 mph, gusts 30. Bike wind reminder only.",
                   flat(72, 10, 1, 19, 30)),
}

# Fixtures with extras (fixed clock, forced failure).
EXTRAS = {
    "ended": ("Usability weather with the clock fixed at 9pm, so today's Day window has ended (R9).",
              pattern(), {"now": {"hour": 21}}),
    "error-timeout": ("Loading fails as if Open-Meteo timed out (R23).", pattern(), {"fail": "timeout"}),
}

if __name__ == "__main__":
    for name, (description, p) in FIXTURES.items():
        write(name, description, p)
    for name, (description, p, extra) in EXTRAS.items():
        write(name, description, p, extra=extra)
        FIXTURES[name] = None
    print("wrote", ", ".join(FIXTURES))
