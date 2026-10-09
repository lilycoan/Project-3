// Pure recommendation logic (spec: Recommendation state and data flow).
// No DOM or network access, so every rule runs under `node --test`.

import { OUTFITS, REMINDER_TYPES, REMINDER_WORDINGS, REMINDER_LABELS, LAYER_TIMES } from './content.js';

// ---------- Time ----------

/** Window hours in local time, both ends included: Open-Meteo values are readings on the hour. */
export const WINDOWS = {
  day: { start: 8, end: 20 }, // 8am–8pm
  evening: { start: 17, end: 23 }, // 5pm–11pm, the last hour Open-Meteo returns
};

/** The current local date and hour at the location, e.g. { date: "2026-10-09", hour: 14 }. */
export function nowIn(timeZone, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

/** Day before 5pm, Evening from 5pm (R8). */
export function defaultWindow(hour) {
  return hour < WINDOWS.evening.start ? 'day' : 'evening';
}

/** The forecast hours for a date and window. For today, hours before the current hour are dropped (R8). */
export function windowHours(hours, date, window, now) {
  const { start, end } = WINDOWS[window];
  const from = date === now.date ? Math.max(start, now.hour) : start;
  return hours.filter((h) => h.date === date && h.hour >= from && h.hour <= end);
}

/** "9pm", "12pm", "8am". */
export function formatHour(hour) {
  const suffix = hour < 12 ? 'am' : 'pm';
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
}

// ---------- Weather inputs ----------

// WMO weather codes grouped by condition, most significant first (spec: condition ranking).
const CONDITIONS = [
  ['thunderstorm', [95, 96, 99]],
  ['snow', [71, 73, 75, 77, 85, 86]],
  ['rain', [61, 63, 65, 66, 67, 80, 81, 82]],
  ['drizzle', [51, 53, 55, 56, 57]],
  ['fog', [45, 48]],
  ['overcast', [3]],
  ['partlyCloudy', [1, 2]],
  ['clear', [0]],
];

/** The most significant condition among the window's weather codes, or null if none are known. */
export function rankCondition(codes) {
  for (const [condition, group] of CONDITIONS) {
    if (codes.some((code) => group.includes(code))) return condition;
  }
  return null;
}

// Max/min over the non-null values; null when every value is missing (R23).
const present = (values) => values.filter((v) => v != null);
const maxOf = (values) => (present(values).length ? Math.max(...present(values)) : null);
const minOf = (values) => (present(values).length ? Math.min(...present(values)) : null);

/** The window's weather inputs (spec table), plus the hours of the low and of the rain peak for wording. */
export function weatherInputs(hours) {
  const feelsHigh = maxOf(hours.map((h) => h.feels));
  const feelsLow = minOf(hours.map((h) => h.feels));
  const rainMax = maxOf(hours.map((h) => h.rain));
  return {
    feelsHigh,
    feelsLow,
    rainMax,
    uvMax: maxOf(hours.map((h) => h.uv)),
    windMax: maxOf(hours.map((h) => h.wind)),
    gustMax: maxOf(hours.map((h) => h.gust)),
    condition: rankCondition(present(hours.map((h) => h.code))),
    // First hour reaching the value, used for "{time}" and "this morning".
    rainHour: rainMax == null ? null : hours.find((h) => h.rain === rainMax).hour,
    lowHour: feelsLow == null ? null : hours.find((h) => h.feels === feelsLow).hour,
  };
}

// ---------- Rules ----------

const CATEGORY_ORDER = ['cold', 'mild', 'warm', 'hot'];

/**
 * Outfit category from the window's feels-like high (spec: Rules).
 * Hot ≥ 85°F · Warm 70–84°F · Mild 55–69°F · Cold < 55°F. Returns null when the value is missing.
 */
export function categoryFor(feelsHigh) {
  if (feelsHigh == null) return null;
  if (feelsHigh >= 85) return 'hot';
  if (feelsHigh >= 70) return 'warm';
  if (feelsHigh >= 55) return 'mild';
  return 'cold';
}

/** Layer when the low is under 70°F and falls in a cooler category than the high. */
export function needsLayer(feelsHigh, feelsLow) {
  if (feelsHigh == null || feelsLow == null || feelsLow >= 70) return false;
  return CATEGORY_ORDER.indexOf(categoryFor(feelsLow)) < CATEGORY_ORDER.indexOf(categoryFor(feelsHigh));
}

/** Which reminders trigger, in screen order. A missing value never triggers its reminder (R23). */
export function triggeredReminders(w) {
  const rules = {
    umbrella: w.rainMax != null && w.rainMax >= 40,
    sunscreen: w.uvMax != null && w.uvMax >= 3,
    hydration: w.feelsHigh != null && w.feelsHigh >= 80,
    bikeWind: (w.windMax != null && w.windMax >= 20) || (w.gustMax != null && w.gustMax >= 30),
  };
  return REMINDER_TYPES.filter((type) => rules[type]);
}

// ---------- Text ----------

const round = (value) => (value == null ? '—' : String(Math.round(value)));

/** Fill a reminder wording's placeholders from the window's values. */
export function reminderText(type, variant, w) {
  const values = {
    rain: round(w.rainMax),
    time: w.rainHour == null ? '—' : formatHour(w.rainHour),
    uv: round(w.uvMax),
    feelsHigh: round(w.feelsHigh),
    wind: round(w.windMax),
    gust: round(w.gustMax),
  };
  return REMINDER_WORDINGS[type][variant].replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

/** Which part of the window the layer is for, from the hour of the feels-like low. */
export function layerTime(window, lowHour, isToday) {
  let part;
  if (window === 'day') part = lowHour < 12 ? 'morning' : 'evening';
  else part = lowHour < 20 ? 'evening' : 'late';
  return LAYER_TIMES[part][isToday ? 'today' : 'future'];
}

/** The written recommendation (R14) and the character's text alternative (R31), from the same picks. */
export function describe(category, outfitVariant, addOns, layerWhen) {
  const outfit = OUTFITS[category][outfitVariant];
  const recommendation = addOns.layer
    ? `${outfit.text}. Bring a light layer for ${layerWhen}.`
    : `${outfit.text}.`;

  const extras = [];
  if (addOns.hat && addOns.sunglasses) extras.push('a sun hat and sunglasses');
  else if (addOns.hat) extras.push('a sun hat');
  else if (addOns.sunglasses) extras.push('sunglasses');
  if (addOns.layer) extras.push('a light jacket tied at the waist');
  let characterAlt = `Character wearing ${outfit.alt}`;
  if (extras.length) characterAlt += `, with ${extras.join(' and ')}`;
  if (addOns.umbrella) characterAlt += ', holding an umbrella';

  return { recommendation, characterAlt: `${characterAlt}.` };
}

// ---------- State ----------

/**
 * The single recommendation state (R11). Every output on Main is drawn from this and nothing else.
 *
 * @param location  { name, lat, lon }
 * @param forecast  parseForecast() result
 * @param date      "YYYY-MM-DD", one of forecast.days
 * @param window    "day" | "evening"
 * @param now       nowIn(forecast.timezone) — passed in so tests can fix the clock
 * @param picks     variation picks for this date|window: { outfitVariant, wordingFor(type), isChecked(type) }
 */
export function buildState({ location, forecast, date, window, now, picks }) {
  const isToday = date === now.date;
  const base = { location, date, window, label: isToday ? 'Now' : 'Forecast' };

  const hours = windowHours(forecast.hours, date, window, now);
  if (hours.length === 0) {
    // Today's window is over (R9), or the date is outside the forecast.
    return { ...base, status: isToday ? 'windowEnded' : 'error', reason: isToday ? null : 'missing' };
  }

  const weather = weatherInputs(hours);
  const category = categoryFor(weather.feelsHigh);
  if (category == null) {
    // Without a feels-like temperature there's no outfit to show: treat as missing data (R23).
    return { ...base, status: 'error', reason: 'missing', weather };
  }

  const types = triggeredReminders(weather);
  // Accessories follow the same rules as their reminders, so the two can never disagree (R11).
  const addOns = {
    layer: needsLayer(weather.feelsHigh, weather.feelsLow),
    umbrella: types.includes('umbrella'),
    hat: types.includes('sunscreen'),
    sunglasses: types.includes('sunscreen'),
  };
  const reminders = types.map((type) => {
    const wordingVariant = picks.wordingFor(type);
    return {
      type,
      label: REMINDER_LABELS[type],
      wordingVariant,
      text: reminderText(type, wordingVariant, weather),
      checked: picks.isChecked(type),
    };
  });

  return {
    ...base,
    status: 'ok',
    weather,
    category,
    outfitVariant: picks.outfitVariant,
    addOns,
    reminders,
    text: describe(category, picks.outfitVariant, addOns, layerTime(window, weather.lowHour, isToday)),
  };
}
