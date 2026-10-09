// Data layer tests: forecast parsing, place parsing, storage format, fixture date rebasing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseForecast, parsePlaces, parseReverse, forecastUrl, ApiError } from '../js/api.js';
import { saveLocation, loadLocation } from '../js/storage.js';
import { fixtureName, rebaseFixture, shiftDate, todayIn } from '../js/fixtures.js';

const austin = JSON.parse(readFileSync(new URL('../fixtures/austin-sample.json', import.meta.url)));

// A minimal in-memory stand-in for localStorage.
function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    keys: () => [...data.keys()],
    raw: (k) => data.get(k),
  };
}

test('forecastUrl asks for °F, mph, local time zone and 7 days', () => {
  const url = new URL(forecastUrl(30.27, -97.74));
  assert.equal(url.host, 'api.open-meteo.com');
  assert.equal(url.searchParams.get('temperature_unit'), 'fahrenheit');
  assert.equal(url.searchParams.get('wind_speed_unit'), 'mph');
  assert.equal(url.searchParams.get('timezone'), 'auto');
  assert.equal(url.searchParams.get('forecast_days'), '7');
  assert.match(url.searchParams.get('hourly'), /apparent_temperature.*weather_code/);
});

test('parseForecast keeps 7 days × 24 local hours with the raw values', () => {
  const f = parseForecast(austin);
  assert.equal(f.timezone, 'America/Chicago');
  assert.equal(f.hours.length, 168);
  assert.equal(f.days.length, 7);
  const i = 14; // 2pm on day one
  assert.deepEqual(f.hours[i], {
    time: austin.hourly.time[i],
    date: austin.hourly.time[i].slice(0, 10),
    hour: 14,
    feels: austin.hourly.apparent_temperature[i],
    rain: austin.hourly.precipitation_probability[i],
    uv: austin.hourly.uv_index[i],
    wind: austin.hourly.wind_speed_10m[i],
    gust: austin.hourly.wind_gusts_10m[i],
    code: austin.hourly.weather_code[i],
  });
});

test('parseForecast turns missing values into null', () => {
  const raw = structuredClone(austin);
  delete raw.hourly.uv_index; // whole field missing
  raw.hourly.precipitation_probability[3] = null; // one hour missing
  delete raw.current.apparent_temperature;
  const f = parseForecast(raw);
  assert.ok(f.hours.every((h) => h.uv === null));
  assert.equal(f.hours[3].rain, null);
  assert.equal(f.current.feels, null);
});

test('parseForecast rejects a response with no hourly data', () => {
  assert.throws(() => parseForecast({ error: true }), ApiError);
});

test('parsePlaces labels US matches as "City, ST" and drops other countries', () => {
  const places = parsePlaces({
    results: [
      { name: 'Austin', admin1: 'Texas', country_code: 'US', latitude: 30.27, longitude: -97.74 },
      { name: 'Austin', admin1: 'Minnesota', country_code: 'US', latitude: 43.67, longitude: -92.97 },
      { name: 'Paris', admin1: 'Île-de-France', country_code: 'FR', latitude: 48.85, longitude: 2.35 },
    ],
  });
  assert.deepEqual(places, [
    { name: 'Austin, TX', lat: 30.27, lon: -97.74 },
    { name: 'Austin, MN', lat: 43.67, lon: -92.97 },
  ]);
  assert.deepEqual(parsePlaces({ generationtime_ms: 0.4 }), []); // no results → "No US places found"
});

test('parseReverse names US places and flags non-US ones', () => {
  assert.deepEqual(
    parseReverse({ address: { city: 'Austin', 'ISO3166-2-lvl4': 'US-TX', country_code: 'us' } }),
    { name: 'Austin, TX', isUS: true },
  );
  assert.deepEqual(
    parseReverse({ address: { town: 'Lockhart', 'ISO3166-2-lvl4': 'US-TX', country_code: 'us' } }),
    { name: 'Lockhart, TX', isUS: true },
  );
  assert.equal(parseReverse({ address: { city: 'Toronto', country_code: 'ca' } }).isUS, false);
});

test('storage keeps one key with only name, lat and lon', () => {
  const s = fakeStorage();
  saveLocation({ name: 'Austin, TX', lat: 30.27, lon: -97.74, extra: 'not saved' }, s);
  assert.deepEqual(s.keys(), ['wearcast.location']);
  assert.deepEqual(JSON.parse(s.raw('wearcast.location')), { name: 'Austin, TX', lat: 30.27, lon: -97.74 });
  assert.deepEqual(loadLocation(s), { name: 'Austin, TX', lat: 30.27, lon: -97.74 });
});

test('storage returns null on first visit, bad data, or no storage', () => {
  assert.equal(loadLocation(fakeStorage()), null);
  const s = fakeStorage();
  s.setItem('wearcast.location', '{not json');
  assert.equal(loadLocation(s), null);
  assert.equal(loadLocation(null), null);
});

test('fixtureName accepts only simple names', () => {
  assert.equal(fixtureName('?fixture=storm-evening'), 'storm-evening');
  assert.equal(fixtureName(''), null);
  assert.equal(fixtureName('?fixture=../secret'), null);
  assert.equal(fixtureName('?fixture=https://evil.example'), null);
});

test('rebaseFixture moves the first day to today in the fixture time zone', () => {
  // 2026-10-20 03:00 UTC is still 2026-10-19 in Austin.
  const now = new Date('2026-10-20T03:00:00Z');
  assert.equal(todayIn('America/Chicago', now), '2026-10-19');
  const moved = rebaseFixture(austin, now);
  assert.equal(moved.hourly.time[0], '2026-10-19T00:00');
  assert.equal(moved.hourly.time.at(-1), '2026-10-25T23:00');
  assert.deepEqual(moved.hourly.apparent_temperature, austin.hourly.apparent_temperature);
  assert.equal(austin.hourly.time[0], '2026-10-09T00:00'); // original untouched
  assert.equal(shiftDate('2026-12-31T05:00', 1), '2027-01-01T05:00');
});
