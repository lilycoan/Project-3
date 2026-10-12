// WearCast entry point: wires inputs → state → render.

import { fetchForecast, parseForecast, reverseLookup, ApiError } from './api.js';
import { loadLocation, saveLocation, loadStyle, saveStyle } from './storage.js';
import { fixtureName, loadFixture, showTestBanner } from './fixtures.js';
import { buildState, defaultWindow, nowIn, weatherInputs, windowHours } from './recommend.js';
import { createVariations, variationKey } from './variation.js';
import { STYLES, DEFAULT_STYLE } from './content.js';
import { renderMain, announce, statusMessage } from './render.js';
import { setUpSearch, openSearch } from './search.js';

const fixture = fixtureName();
// In test mode the saved forecast is loaded once and stands in for Open-Meteo (R33).
const fixtureData = fixture ? loadFixture(fixture) : null;
const variations = createVariations();

// Everything the screen depends on. The recommendation state is rebuilt from this on every change.
const app = {
  location: null, // { name, lat, lon }
  forecast: null, // parseForecast() result
  date: null, // "YYYY-MM-DD"
  window: 'day', // "day" | "evening"
  loading: false,
  error: null, // ApiError reason while the forecast can't be shown
  fixedHour: null, // test forecasts only: a fixed local hour, e.g. to show an ended window
  style: loadStyle(Object.keys(STYLES)) ?? DEFAULT_STYLE, // character style (R34)
};
let lastStatus = null; // announce a status only when it changes

/** The location's current date and hour; a test forecast may fix the hour (spec R33). */
function clock() {
  const now = nowIn(app.forecast.timezone);
  return app.fixedHour == null ? now : { ...now, hour: app.fixedHour };
}

/**
 * One entry per forecast day for the date strip: the date, plus the weather icon and feels-like
 * range for the selected window, from the same rules as Main (shown on the laptop week strip, R7).
 */
function daySummaries(now) {
  return app.forecast.days.map((date) => {
    const w = weatherInputs(windowHours(app.forecast.hours, date, app.window, now));
    return { date, condition: w.condition, feelsHigh: w.feelsHigh, feelsLow: w.feelsLow };
  });
}

function update() {
  let state;
  let controls = { days: [], window: app.window };
  if (app.loading) {
    state = { status: 'loading', location: app.location };
  } else if (app.error) {
    state = { status: 'error', reason: app.error, location: app.location };
  } else if (!app.forecast) {
    state = { status: 'empty', style: app.style }; // first visit (R25)
  } else {
    const now = clock();
    controls = { days: daySummaries(now), date: app.date, window: app.window };
    state = buildState({
      location: app.location,
      forecast: app.forecast,
      date: app.date,
      window: app.window,
      now,
      picks: variations.picksFor(variationKey(app.date, app.window)),
      style: app.style,
    });
  }
  renderMain(state, controls);
  if (state.status !== lastStatus && state.status !== 'ok' && state.status !== 'empty') {
    announce(statusMessage(state)); // loading, error and ended window are announced (R31)
  }
  lastStatus = state.status;
}

/** The raw forecast: a test forecast when ?fixture= is set, otherwise one Open-Meteo request. */
async function getForecast(location) {
  if (!fixtureData) return fetchForecast(location.lat, location.lon);
  const raw = await fixtureData;
  app.fixedHour = raw.fixture.now?.hour ?? null;
  if (raw.fixture.fail) throw new ApiError(raw.fixture.fail, 'Test forecast set to fail');
  return raw;
}

/**
 * Load the forecast for a location: one request per location (spec: Data flow).
 * A Retry keeps the date, window and variation picks; a new location starts fresh.
 */
async function showLocation(location, { retry = false } = {}) {
  showNotice('');
  app.location = location;
  app.loading = true;
  app.error = null;
  if (!retry) app.forecast = null;
  update();
  try {
    app.forecast = parseForecast(await getForecast(location));
  } catch (error) {
    app.loading = false;
    app.forecast = null;
    app.error = error instanceof ApiError ? error.reason : 'server';
    update();
    return;
  }
  app.loading = false;
  const now = clock();
  if (!retry || !app.forecast.days.includes(app.date)) {
    app.date = app.forecast.days.includes(now.date) ? now.date : app.forecast.days[0];
    app.window = defaultWindow(now.hour); // R8
  }
  if (!retry) variations.clear(); // a new location starts with fresh picks
  update();
  announce(`Showing ${location.name}.`);
}

// ---------- Controls ----------

document.getElementById('day-strip').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-date]');
  if (!button) return;
  app.date = button.dataset.date;
  update();
});

for (const button of document.querySelectorAll('.window-toggle button')) {
  button.addEventListener('click', () => {
    app.window = button.dataset.window;
    update();
  });
}

// Ticks are kept per date|window in memory only, so a reload clears them (R16, R6).
document.getElementById('reminder-list').addEventListener('change', (event) => {
  const box = event.target.closest('input[data-reminder]');
  if (!box) return;
  variations.setChecked(variationKey(app.date, app.window), box.dataset.reminder, box.checked);
  update();
});

// ---------- Choosing a location (R3–R6, R22, R24) ----------

const notice = document.getElementById('notice');

/** Show or clear a location message above the character, and announce it (R31). */
function showNotice(text) {
  notice.textContent = text;
  notice.hidden = !text;
  if (text) announce(text);
}

/** A place picked from search or found from the device: save it (R6) and load its weather. */
function choosePlace(place) {
  const location = { name: place.name, lat: place.lat, lon: place.lon };
  if (!fixture) saveLocation(location); // test mode never overwrites the User's saved location
  showLocation(location);
}

/** The browser's position as a promise. Errors keep the GeolocationPositionError code. */
function devicePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unavailable'));
      return;
    }
    // maximumAge 0: always a fresh position, so a tap after moving (or a changed DevTools sensor) is honoured.
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000, maximumAge: 0 });
  });
}

const LOCATION_OFF = 'Location is off for this site. Type a city or ZIP instead.';

/** "Use my location": only ever runs on a tap (R4). */
async function useMyLocation() {
  let position;
  try {
    position = await devicePosition();
  } catch {
    // Denied, unavailable or timed out: keep the current location and point to typing (R22).
    showNotice(LOCATION_OFF);
    document.getElementById('place-input').focus();
    return;
  }
  // Two decimals (about 1 km) is plenty for city weather and sends less precise data to services (R26).
  const lat = Math.round(position.coords.latitude * 100) / 100;
  const lon = Math.round(position.coords.longitude * 100) / 100;

  let name = 'Your location';
  try {
    const place = await reverseLookup(lat, lon);
    if (!place.isUS) {
      showNotice('WearCast covers US locations. Type a US city or ZIP.'); // R5: keep the previous location
      return;
    }
    name = place.name ?? name;
  } catch {
    // Nominatim failed: the weather still loads, labeled "Your location" (R24).
  }
  choosePlace({ name, lat, lon });
}

document.getElementById('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('place-input');
  openSearch(input.value);
  input.value = '';
});
document.getElementById('locate-button').addEventListener('click', useMyLocation);

// Character style (R34): the first-visit choice and the switch in the character card corner.
// Saved on the device; the date, window and variation picks stay as they are.
document.getElementById('main-screen').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-style]');
  if (!button || button.dataset.style === app.style) return;
  app.style = button.dataset.style;
  saveStyle(app.style);
  update();
  announce(`Look changed to ${STYLES[app.style].label.toLowerCase()}.`);
});

// Buttons in the status panel: Retry (R23), See Evening / See tomorrow (R9), first-visit choices (R25).
document.getElementById('status-panel').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  switch (button.dataset.action) {
    case 'retry':
      showLocation(app.location, { retry: true });
      break;
    case 'see-evening':
      app.window = 'evening';
      update();
      break;
    case 'see-tomorrow':
      app.date = app.forecast.days[app.forecast.days.indexOf(app.date) + 1] ?? app.date;
      update();
      break;
    case 'locate':
      useMyLocation();
      break;
    case 'type-place':
      document.getElementById('place-input').focus();
      break;
  }
});
setUpSearch({ choose: choosePlace, locate: useMyLocation });

// Info screen: Back/Close keeps location, date and window as they were (R20).
const mainScreen = document.getElementById('main-screen');
const infoScreen = document.getElementById('info-screen');
let mainScroll = 0;
document.getElementById('info-open').addEventListener('click', () => {
  mainScroll = window.scrollY;
  mainScreen.hidden = true;
  infoScreen.hidden = false;
  window.scrollTo(0, 0);
  document.getElementById('info-title').focus({ preventScroll: true });
});
document.getElementById('info-close').addEventListener('click', () => {
  infoScreen.hidden = true;
  mainScreen.hidden = false;
  // Focus returns to ⓘ without jumping, so the User is back where they were on Main.
  document.getElementById('info-open').focus({ preventScroll: true });
  window.scrollTo(0, mainScroll);
});

// ---------- Start ----------

function start() {
  if (fixture) {
    showTestBanner();
    fixtureData
      .then((raw) => showLocation(raw.fixture.location))
      .catch(() => { app.error = 'server'; update(); }); // a missing fixture file
    return;
  }
  const saved = loadLocation();
  if (saved) showLocation(saved);
  else update(); // first visit: nothing is requested until the User chooses (R25)
}

start();
