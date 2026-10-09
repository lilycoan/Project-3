// WearCast entry point: wires inputs → state → render.
// CP2: loads data and logs it. The screens are drawn from CP6 onward.

import { fetchForecast, parseForecast, searchPlaces, reverseLookup } from './api.js';
import { loadLocation, saveLocation } from './storage.js';
import { fixtureName, loadFixture, showTestBanner } from './fixtures.js';

async function loadWeather(location) {
  const forecast = parseForecast(await fetchForecast(location.lat, location.lon));
  console.log('[WearCast] forecast for', location.name, forecast);
  return forecast;
}

async function start() {
  const fixture = fixtureName();
  if (fixture) {
    showTestBanner();
    const raw = await loadFixture(fixture);
    console.log('[WearCast] test forecast', fixture, raw.fixture.location, parseForecast(raw));
    return;
  }

  const saved = loadLocation();
  if (saved) {
    await loadWeather(saved);
  } else {
    // First visit: nothing is requested until the User chooses a location (R25).
    console.log('[WearCast] first visit, no saved location');
  }
}

// TEMPORARY (CP2–CP8): DevTools helpers for checking the data layer before the
// location controls exist. Removed when the search and locate flows are built in CP9.
globalThis.wearcast = {
  searchPlaces,
  reverseLookup,
  async choose(place) {
    saveLocation(place);
    return loadWeather(place);
  },
};

start().catch((error) => console.error('[WearCast]', error));
