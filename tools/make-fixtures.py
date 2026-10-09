#!/usr/bin/env python3
"""Generate WearCast's made-up test forecasts (spec R33) in Open-Meteo's response format.

Run from the repo root:  python3 tools/make-fixtures.py
Writes fixtures/<name>.json. fixtures/austin-sample.json is a real recorded response and isn't touched.

Each fixture repeats one 24-hour pattern for 7 days; js/fixtures.js moves the dates so day one is today.
Open a fixture with ?fixture=<name>.
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


def write(name, description, p, location=AUSTIN):
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
        "fixture": {"description": description, "location": location},
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
}

if __name__ == "__main__":
    for name, (description, p) in FIXTURES.items():
        write(name, description, p)
    print("wrote", ", ".join(FIXTURES))
