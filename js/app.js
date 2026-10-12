// WearCast entry point: wires inputs → state → render.

import { fetchForecast, parseForecast, reverseLookup } from './api.js';
import { loadLocation, saveLocation } from './storage.js';
import { fixtureName, loadFixture, showTestBanner } from './fixtures.js';
import { buildState, defaultWindow, nowIn, weatherInputs, windowHours } from './recommend.js';
import { createVariations, variationKey } from './variation.js';
import { renderMain, announce } from './render.js';
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
};

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
  if (!app.forecast) {
    renderMain({ status: 'empty', location: app.location, message: 'Type a city or ZIP to get started.' },
      { days: [], window: app.window });
    return;
  }
  const now = nowIn(app.forecast.timezone);
  const controls = { days: daySummaries(now), date: app.date, window: app.window };
  const state = buildState({
    location: app.location,
    forecast: app.forecast,
    date: app.date,
    window: app.window,
    now,
    picks: variations.picksFor(variationKey(app.date, app.window)),
  });
  renderMain(state, controls);
}

/** Load the forecast for a location: one request per location (spec: Data flow). */
async function showLocation(location) {
  showNotice('');
  app.location = location;
  renderMain({ status: 'loading', location, message: 'Getting the weather…' }, { window: app.window });
  announce('Getting the weather…');
  try {
    const raw = fixtureData ? await fixtureData : await fetchForecast(location.lat, location.lon);
    app.forecast = parseForecast(raw);
  } catch (error) {
    // The full error screen with Retry is built in CP10.
    app.forecast = null;
    renderMain({ status: 'error', location, message: 'Couldn’t load the weather. ' + error.message }, {});
    announce('Couldn’t load the weather.');
    return;
  }
  const now = nowIn(app.forecast.timezone);
  app.date = app.forecast.days.includes(now.date) ? now.date : app.forecast.days[0];
  app.window = defaultWindow(now.hour); // R8
  variations.clear(); // a new location starts with fresh picks
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
setUpSearch({ choose: choosePlace, locate: useMyLocation });

// Info screen: Back keeps location, date and window as they were (R20).
const mainScreen = document.getElementById('main-screen');
const infoScreen = document.getElementById('info-screen');
document.getElementById('info-open').addEventListener('click', () => {
  mainScreen.hidden = true;
  infoScreen.hidden = false;
  document.getElementById('info-title').focus();
});
document.getElementById('info-close').addEventListener('click', () => {
  infoScreen.hidden = true;
  mainScreen.hidden = false;
  document.getElementById('info-open').focus();
});
document.getElementById('info-title').tabIndex = -1;

// ---------- Start ----------

function start() {
  if (fixture) {
    showTestBanner();
    fixtureData
      .then((raw) => showLocation(raw.fixture.location))
      .catch((error) => renderMain({ status: 'error', message: error.message }, {}));
    return;
  }
  const saved = loadLocation();
  if (saved) showLocation(saved);
  else update(); // first visit: nothing is requested until the User chooses (R25)
}

start();
