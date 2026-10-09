// Test forecast mode (spec R33). Only active when the URL has ?fixture=<name>; nothing in the app links here.
// A fixture is a saved Open-Meteo response plus a "fixture" block: { description, location: { name, lat, lon } }.

/** The fixture name from the URL, or null. Only simple names are accepted, so the URL can't point elsewhere. */
export function fixtureName(search = globalThis.location?.search ?? '') {
  const name = new URLSearchParams(search).get('fixture');
  return name && /^[a-z0-9-]+$/.test(name) ? name : null;
}

/** "YYYY-MM-DD" for `now` in the given IANA time zone. */
export function todayIn(timeZone, now = new Date()) {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Add whole days to a "YYYY-MM-DD..." string, keeping anything after the date (e.g. "T13:00"). */
export function shiftDate(stamp, days) {
  const [y, m, d] = stamp.slice(0, 10).split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  return shifted + stamp.slice(10);
}

/**
 * Move a fixture's dates so its first day is today in the fixture's time zone.
 * The hours and values stay the same, so a saved forecast always shows as "today + 6 days"
 * and usability sessions on different days see the same weather.
 */
export function rebaseFixture(raw, now = new Date()) {
  const first = raw.hourly.time[0].slice(0, 10);
  const today = todayIn(raw.timezone ?? 'UTC', now);
  const offset = Math.round((Date.parse(today) - Date.parse(first)) / 86_400_000);
  const copy = structuredClone(raw);
  copy.hourly.time = copy.hourly.time.map((t) => shiftDate(t, offset));
  if (copy.current?.time) copy.current.time = shiftDate(copy.current.time, offset);
  return copy;
}

export async function loadFixture(name) {
  const response = await fetch(`fixtures/${name}.json`);
  if (!response.ok) throw new Error(`Test forecast "${name}" not found`);
  return rebaseFixture(await response.json());
}

/** Show the "Test data, not live weather" banner. */
export function showTestBanner() {
  const banner = document.getElementById('test-banner');
  if (banner) banner.hidden = false;
}
