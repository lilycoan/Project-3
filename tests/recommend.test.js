// Recommendation rules, window hours, state and variation tests (plan CP3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  categoryFor, needsLayer, triggeredReminders, windowHours, weatherInputs, rankCondition,
  defaultWindow, nowIn, formatHour, reminderText, layerTime, buildState,
} from '../js/recommend.js';
import { createVariations, variationKey } from '../js/variation.js';
import { OUTFITS } from '../js/content.js';

const TODAY = '2026-10-09';
const TOMORROW = '2026-10-10';

/** 24 hours for a date, all with the same values unless `byHour` overrides some. */
function day(date, values = {}, byHour = {}) {
  return Array.from({ length: 24 }, (_, hour) => ({
    time: `${date}T${String(hour).padStart(2, '0')}:00`,
    date,
    hour,
    feels: 72, rain: 0, uv: 0, wind: 5, gust: 8, code: 0,
    ...values,
    ...byHour[hour],
  }));
}

/** Window inputs with everything calm, then the overrides. */
const calm = (overrides) => ({
  feelsHigh: 72, feelsLow: 72, rainMax: 0, uvMax: 0, windMax: 5, gustMax: 8, ...overrides,
});

/** Picks that always choose the given variants and nothing ticked. */
const fixedPicks = (outfitVariant = 0, wording = 0) => ({
  outfitVariant, wordingFor: () => wording, isChecked: () => false,
});

// ---------- Rules at each threshold edge (R15) ----------

test('categoryFor uses the feels-like high bands at each edge', () => {
  assert.equal(categoryFor(85), 'hot');
  assert.equal(categoryFor(84.9), 'warm');
  assert.equal(categoryFor(70), 'warm');
  assert.equal(categoryFor(69.9), 'mild');
  assert.equal(categoryFor(55), 'mild');
  assert.equal(categoryFor(54.9), 'cold');
  assert.equal(categoryFor(null), null);
});

test('umbrella at rain chance 40%, not 39%', () => {
  assert.ok(!triggeredReminders(calm({ rainMax: 39 })).includes('umbrella'));
  assert.ok(triggeredReminders(calm({ rainMax: 40 })).includes('umbrella'));
});

test('sunscreen at UV 3, not 2.9', () => {
  assert.ok(!triggeredReminders(calm({ uvMax: 2.9 })).includes('sunscreen'));
  assert.ok(triggeredReminders(calm({ uvMax: 3 })).includes('sunscreen'));
});

test('hydration at feels-like 80°F, not 79°F', () => {
  assert.ok(!triggeredReminders(calm({ feelsHigh: 79 })).includes('hydration'));
  assert.ok(triggeredReminders(calm({ feelsHigh: 80 })).includes('hydration'));
});

test('bike wind at 20 mph sustained or 30 mph gusts, not 19 / 29', () => {
  assert.ok(!triggeredReminders(calm({ windMax: 19, gustMax: 29 })).includes('bikeWind'));
  assert.ok(triggeredReminders(calm({ windMax: 20, gustMax: 8 })).includes('bikeWind'));
  assert.ok(triggeredReminders(calm({ windMax: 5, gustMax: 30 })).includes('bikeWind'));
});

test('missing values never trigger their reminder (R23)', () => {
  const nothing = { feelsHigh: null, feelsLow: null, rainMax: null, uvMax: null, windMax: null, gustMax: null };
  assert.deepEqual(triggeredReminders(nothing), []);
  assert.deepEqual(triggeredReminders(calm({ windMax: null, gustMax: 31 })), ['bikeWind']);
});

test('reminders come out in a fixed order', () => {
  assert.deepEqual(
    triggeredReminders(calm({ feelsHigh: 90, rainMax: 80, uvMax: 8, windMax: 25 })),
    ['umbrella', 'sunscreen', 'hydration', 'bikeWind'],
  );
});

test('layer only when the low is under 70°F and in a cooler category than the high', () => {
  assert.equal(needsLayer(83, 63), true); // warm high, mild low
  assert.equal(needsLayer(83, 70), false); // low not under 70
  assert.equal(needsLayer(68, 56), false); // both mild
  assert.equal(needsLayer(68, 54), true); // mild high, cold low
  assert.equal(needsLayer(90, 72), false); // hot high, warm low, but low ≥ 70
  assert.equal(needsLayer(83, null), false);
});

// ---------- Window hours (R8, R9) ----------

test('Day is 8am–8pm and Evening 5pm–11pm, both ends included', () => {
  const hours = day(TOMORROW);
  const now = { date: TODAY, hour: 10 };
  assert.deepEqual(windowHours(hours, TOMORROW, 'day', now).map((h) => h.hour), [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.deepEqual(windowHours(hours, TOMORROW, 'evening', now).map((h) => h.hour), [17, 18, 19, 20, 21, 22, 23]);
});

test('today uses only the remaining hours from the current hour on', () => {
  const hours = day(TODAY);
  assert.deepEqual(windowHours(hours, TODAY, 'day', { date: TODAY, hour: 14 }).map((h) => h.hour), [14, 15, 16, 17, 18, 19, 20]);
  assert.equal(windowHours(hours, TODAY, 'day', { date: TODAY, hour: 6 }).length, 13); // before 8am: whole window
  assert.equal(windowHours(hours, TODAY, 'day', { date: TODAY, hour: 20 }).length, 1);
  assert.equal(windowHours(hours, TODAY, 'day', { date: TODAY, hour: 21 }).length, 0); // ended
});

test('the remaining-hours range changes the feels-like range (R8 check at 2pm)', () => {
  const hours = day(TODAY, {}, { 9: { feels: 60 }, 15: { feels: 85 }, 19: { feels: 74 } });
  const w = weatherInputs(windowHours(hours, TODAY, 'day', { date: TODAY, hour: 14 }));
  assert.equal(w.feelsHigh, 85);
  assert.equal(w.feelsLow, 72); // the 9am low of 60 is already past
});

test('default window is Day before 5pm and Evening from 5pm', () => {
  assert.equal(defaultWindow(10), 'day');
  assert.equal(defaultWindow(16), 'day');
  assert.equal(defaultWindow(17), 'evening');
  assert.equal(defaultWindow(23), 'evening');
});

test('nowIn reads the local date and hour in the location time zone', () => {
  // 03:30 UTC on Oct 10 is 10:30pm on Oct 9 in Austin (UTC−5).
  assert.deepEqual(nowIn('America/Chicago', new Date('2026-10-10T03:30:00Z')), { date: TODAY, hour: 22 });
  assert.deepEqual(nowIn('America/Chicago', new Date('2026-10-10T05:00:00Z')), { date: TOMORROW, hour: 0 });
});

// ---------- Weather inputs (R13) ----------

test('weatherInputs takes max/min over the window and skips nulls', () => {
  const hours = day(TOMORROW, {}, {
    8: { feels: 61, uv: null }, 14: { feels: 84, uv: 6.4, gust: 27 }, 21: { rain: 60 }, 22: { rain: 60, wind: 12 },
  });
  const w = weatherInputs(windowHours(hours, TOMORROW, 'evening', { date: TODAY, hour: 9 }));
  assert.equal(w.feelsHigh, 72);
  assert.equal(w.rainMax, 60);
  assert.equal(w.rainHour, 21); // first hour at the max
  assert.equal(w.windMax, 12);
  const d = weatherInputs(windowHours(hours, TOMORROW, 'day', { date: TODAY, hour: 9 }));
  assert.equal(d.feelsHigh, 84);
  assert.equal(d.feelsLow, 61);
  assert.equal(d.lowHour, 8);
  assert.equal(d.uvMax, 6.4);
  assert.equal(d.gustMax, 27);
});

test('a value missing for the whole window is null', () => {
  const w = weatherInputs(day(TOMORROW, { uv: null }).slice(8, 21));
  assert.equal(w.uvMax, null);
});

test('condition is the most significant weather code', () => {
  assert.equal(rankCondition([0, 1, 3, 61, 2]), 'rain');
  assert.equal(rankCondition([0, 95, 71]), 'thunderstorm');
  assert.equal(rankCondition([53, 45]), 'drizzle');
  assert.equal(rankCondition([0, 2]), 'partlyCloudy');
  assert.equal(rankCondition([]), null);
});

// ---------- Text ----------

test('reminder wording fills in rounded values and the rain hour', () => {
  const w = calm({ rainMax: 62, rainHour: 21, uvMax: 6.6, feelsHigh: 83.4, windMax: 21.5, gustMax: 33 });
  assert.equal(reminderText('umbrella', 0, w), 'Grab an umbrella: 62% chance of rain around 9pm.');
  assert.equal(reminderText('sunscreen', 1, w), 'Strong sun (UV 7). Sunscreen, hat, sunglasses.');
  assert.equal(reminderText('hydration', 2, w), 'Hot out there: 83°. Drink up throughout the day.');
  assert.equal(reminderText('bikeWind', 0, w), 'Gusty ride: wind up to 22 mph, gusts 33.');
  assert.ok(!/headwind/i.test(Object.values({ a: reminderText('bikeWind', 1, w), b: reminderText('bikeWind', 2, w) }).join(' ')));
});

test('formatHour and layer timing read naturally', () => {
  assert.equal(formatHour(0), '12am');
  assert.equal(formatHour(9), '9am');
  assert.equal(formatHour(12), '12pm');
  assert.equal(formatHour(21), '9pm');
  assert.equal(layerTime('day', 8, true), 'this morning');
  assert.equal(layerTime('day', 8, false), 'the morning');
  assert.equal(layerTime('day', 20, true), 'this evening');
  assert.equal(layerTime('evening', 23, true), 'later tonight');
});

// ---------- One recommendation state (R11, R14, R31) ----------

const location = { name: 'Austin, TX', lat: 30.27, lon: -97.74 };

function stateFor(hours, { date = TOMORROW, window = 'day', now = { date: TODAY, hour: 9 }, picks = fixedPicks() } = {}) {
  return buildState({ location, forecast: { hours }, date, window, now, picks });
}

test('a warm, sunny day with a cool start: outfit, layer, hat and reminders agree', () => {
  const s = stateFor(day(TOMORROW, { uv: 5 }, { 8: { feels: 63 }, 15: { feels: 83 } }));
  assert.equal(s.status, 'ok');
  assert.equal(s.label, 'Forecast');
  assert.equal(s.category, 'warm');
  assert.deepEqual(s.addOns, { layer: true, umbrella: false, hat: true, sunglasses: true });
  assert.deepEqual(s.reminders.map((r) => r.type), ['sunscreen', 'hydration']);
  assert.equal(s.text.recommendation, 'Tee, light chinos and sneakers. Bring a light layer for the morning.');
  assert.equal(
    s.text.characterAlt,
    'Character wearing a tee, light chinos and sneakers, with a sun hat and sunglasses and a light jacket tied at the waist.',
  );
});

test('umbrella on the character if and only if the umbrella reminder shows', () => {
  for (const rain of [0, 39, 40, 90]) {
    const s = stateFor(day(TOMORROW, { rain }));
    const reminder = s.reminders.some((r) => r.type === 'umbrella');
    assert.equal(s.addOns.umbrella, reminder, `rain ${rain}%`);
    assert.equal(s.text.characterAlt.includes('umbrella'), reminder);
  }
});

test('hat and sunglasses if and only if the sunscreen reminder shows, and not when UV is missing', () => {
  for (const uv of [0, 2.9, 3, 9, null]) {
    const s = stateFor(day(TOMORROW, { uv }));
    const reminder = s.reminders.some((r) => r.type === 'sunscreen');
    assert.equal(s.addOns.hat, reminder, `uv ${uv}`);
    assert.equal(s.addOns.sunglasses, reminder);
    assert.equal(reminder, uv != null && uv >= 3);
  }
});

test('the written recommendation names the outfit drawn, for every category and variant', () => {
  for (const [feels, category] of [[90, 'hot'], [75, 'warm'], [60, 'mild'], [40, 'cold']]) {
    for (const v of [0, 1, 2]) {
      const s = stateFor(day(TOMORROW, { feels }), { picks: fixedPicks(v) });
      assert.equal(s.category, category);
      assert.equal(s.text.recommendation, `${OUTFITS[category][v].text}.`);
      assert.ok(s.text.characterAlt.includes(OUTFITS[category][v].alt));
    }
  }
});

test('no reminders: an empty list, so the screen can say "Nothing extra to bring"', () => {
  const s = stateFor(day(TOMORROW, { feels: 62, rain: 10, uv: 1, wind: 6, gust: 10 }));
  assert.equal(s.status, 'ok');
  assert.deepEqual(s.reminders, []);
});

test('today’s ended window gives the windowEnded state with no outfit (R9)', () => {
  const s = stateFor(day(TODAY), { date: TODAY, window: 'day', now: { date: TODAY, hour: 21 } });
  assert.equal(s.status, 'windowEnded');
  assert.equal(s.label, 'Now');
  assert.equal(s.category, undefined);
});

test('no feels-like data at all is reported as missing data', () => {
  const s = stateFor(day(TOMORROW, { feels: null }));
  assert.equal(s.status, 'error');
  assert.equal(s.reason, 'missing');
});

// ---------- Variations (R18, R19) ----------

test('the same date|window returns the same picks; another key can differ', () => {
  const v = createVariations();
  const tue = v.picksFor(variationKey('2026-10-13', 'day'));
  const tueWording = tue.wordingFor('umbrella');
  v.picksFor(variationKey('2026-10-14', 'day')); // view Wednesday
  const again = v.picksFor(variationKey('2026-10-13', 'day'));
  assert.equal(again.outfitVariant, tue.outfitVariant);
  assert.equal(again.wordingFor('umbrella'), tueWording);
});

test('outfit and wordings are independent draws, so all combinations appear', () => {
  const combos = new Set();
  const seen = { outfit: new Set(), umbrella: new Set(), sunscreen: new Set() };
  for (let i = 0; i < 300; i++) {
    const p = createVariations().picksFor('2026-10-13|day'); // a fresh store is a reload
    const combo = [p.outfitVariant, p.wordingFor('umbrella'), p.wordingFor('sunscreen')];
    combos.add(combo.join());
    seen.outfit.add(combo[0]);
    seen.umbrella.add(combo[1]);
    seen.sunscreen.add(combo[2]);
  }
  assert.equal(seen.outfit.size, 3);
  assert.equal(seen.umbrella.size, 3);
  assert.equal(seen.sunscreen.size, 3);
  assert.ok(combos.size >= 20, `only ${combos.size} of 27 combinations`); // not fixed pairs
});

test('each pick is its own random draw', () => {
  const draws = [0.1, 0.5, 0.9]; // → 0, 1, 2
  let i = 0;
  const v = createVariations(() => draws[i++ % 3]);
  const p = v.picksFor('2026-10-13|day');
  assert.equal(p.outfitVariant, 0);
  assert.equal(p.wordingFor('umbrella'), 1);
  assert.equal(p.wordingFor('sunscreen'), 2);
});

test('check marks stay per date|window and clear with a new location (R16)', () => {
  const v = createVariations();
  v.setChecked('2026-10-13|day', 'umbrella', true);
  assert.equal(v.picksFor('2026-10-13|day').isChecked('umbrella'), true);
  assert.equal(v.picksFor('2026-10-13|evening').isChecked('umbrella'), false);
  v.setChecked('2026-10-13|day', 'umbrella', false);
  assert.equal(v.picksFor('2026-10-13|day').isChecked('umbrella'), false);
  v.setChecked('2026-10-13|day', 'umbrella', true);
  v.clear();
  assert.equal(v.picksFor('2026-10-13|day').isChecked('umbrella'), false);
});

test('a category change on Retry keeps the same variant number', () => {
  const v = createVariations(() => 0.7); // variant 2
  const picks = v.picksFor('2026-10-10|day');
  const before = stateFor(day(TOMORROW, { feels: 75 }), { picks });
  const after = stateFor(day(TOMORROW, { feels: 88 }), { picks: v.picksFor('2026-10-10|day') });
  assert.equal(before.category, 'warm');
  assert.equal(after.category, 'hot');
  assert.equal(after.outfitVariant, before.outfitVariant);
});
