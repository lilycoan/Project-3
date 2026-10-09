// WearCast entry point: wires inputs → state → render.

import { fetchForecast, parseForecast, searchPlaces, reverseLookup } from './api.js';
import { loadLocation, saveLocation } from './storage.js';
import { fixtureName, loadFixture, showTestBanner } from './fixtures.js';
import { buildState, defaultWindow, nowIn } from './recommend.js';
import { createVariations, variationKey } from './variation.js';
import { renderMain, announce } from './render.js';

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

function update() {
  const controls = { days: app.forecast?.days ?? [], date: app.date, window: app.window };
  if (!app.forecast) {
    renderMain({ status: 'empty', location: app.location, message: 'Type a city or ZIP to get started.' }, controls);
    return;
  }
  const now = nowIn(app.forecast.timezone);
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

// TEMPORARY (CP6–CP8): picks the first match so live weather can be checked on a phone.
// Replaced by the search sheet with all matches in CP9.
document.getElementById('search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('place-input');
  const places = await searchPlaces(input.value).catch(() => []);
  if (places.length === 0) {
    announce('No US places found.');
    return;
  }
  input.value = '';
  input.blur();
  saveLocation(places[0]);
  showLocation(places[0]);
});

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

// TEMPORARY (CP2–CP8): DevTools helpers, removed when the location flows are built in CP9.
globalThis.wearcast = {
  searchPlaces,
  reverseLookup,
  choose(place) {
    saveLocation(place);
    return showLocation(place);
  },
};

start();
