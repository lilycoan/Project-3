// Saves only the most recent location ({ name, lat, lon }) and the character style (R6, R34).
// Nothing else (dates, windows, variations, check marks, weather) is ever written to the device.

const KEY = 'wearcast.location';
const STYLE_KEY = 'wearcast.style';

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

/** Save the character style (R34). */
export function saveStyle(style, storage = store()) {
  if (!storage) return;
  try {
    storage.setItem(STYLE_KEY, style);
  } catch {
    // As with the location: the app works without it.
  }
}

/** The saved style if it is one of `allowed`, otherwise null. */
export function loadStyle(allowed, storage = store()) {
  if (!storage) return null;
  try {
    const style = storage.getItem(STYLE_KEY);
    return allowed.includes(style) ? style : null;
  } catch {
    return null;
  }
}
