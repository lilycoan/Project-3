// Saves only the most recent location: { name, lat, lon } under one key (R6).
// Nothing else (dates, windows, variations, check marks, weather) is ever written to the device.

const KEY = 'wearcast.location';

// Storage can be missing or throw (private mode, blocked site data), so every access is guarded.
function store() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isLocation(value) {
  return (
    value != null &&
    typeof value.name === 'string' &&
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lon)
  );
}

export function saveLocation({ name, lat, lon }, storage = store()) {
  if (!storage) return;
  try {
    // Copy only these three fields so nothing extra can slip into storage.
    storage.setItem(KEY, JSON.stringify({ name, lat, lon }));
  } catch {
    // Quota or privacy errors: the app still works, it just won't remember the location.
  }
}

/** The saved location, or null on a first visit or if the saved value is unreadable. */
export function loadLocation(storage = store()) {
  if (!storage) return null;
  try {
    const value = JSON.parse(storage.getItem(KEY));
    return isLocation(value) ? { name: value.name, lat: value.lat, lon: value.lon } : null;
  } catch {
    return null;
  }
}
