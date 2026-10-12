// Network layer: Open-Meteo forecast and geocoding, Nominatim reverse lookup.
// Fetchers throw ApiError; parsers are pure so they can be unit tested.

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 10_000; // R23

const HOURLY_FIELDS = [
  'apparent_temperature',
  'precipitation_probability',
  'uv_index',
  'wind_speed_10m',
  'wind_gusts_10m',
  'weather_code',
];
const CURRENT_FIELDS = ['temperature_2m', ...HOURLY_FIELDS];

/** Error with a short reason the error state can show: "timeout", "offline" or "server". */
export class ApiError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'ApiError';
    this.reason = reason;
  }
}

/** fetch() that gives up after TIMEOUT_MS and returns parsed JSON. */
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new ApiError('server', `HTTP ${response.status} from ${new URL(url).host}`);
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError('timeout', 'The weather service took too long to respond.');
    throw new ApiError('offline', 'Couldn’t reach the weather service. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Forecast ----------

/** One request: 7 days of hourly values plus current conditions, °F and mph, in the location's time zone. */
export function forecastUrl(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_FIELDS.join(','),
    current: CURRENT_FIELDS.join(','),
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: 7,
  });
  return `${FORECAST_URL}?${params}`;
}

export async function fetchForecast(lat, lon) {
  return getJson(forecastUrl(lat, lon));
}

// Missing or non-numeric values become null so rules that need them don't trigger (spec: Weather inputs).
const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/**
 * Turn a raw Open-Meteo response into { timezone, current, days, hours }.
 * Times stay as the location's local wall-clock strings ("2026-10-09T13:00"), so
 * date and hour come straight from the string with no Date or time zone conversion.
 */
export function parseForecast(raw) {
  const hourly = raw?.hourly;
  if (!hourly || !Array.isArray(hourly.time)) {
    throw new ApiError('server', 'The weather service sent an unexpected response.');
  }

  const hours = hourly.time.map((time, i) => ({
    time,
    date: time.slice(0, 10),
    hour: Number(time.slice(11, 13)),
    feels: num(hourly.apparent_temperature?.[i]),
    rain: num(hourly.precipitation_probability?.[i]),
    uv: num(hourly.uv_index?.[i]),
    wind: num(hourly.wind_speed_10m?.[i]),
    gust: num(hourly.wind_gusts_10m?.[i]),
    code: num(hourly.weather_code?.[i]),
  }));

  const c = raw.current ?? {};
  const current = {
    time: c.time ?? null,
    temp: num(c.temperature_2m),
    feels: num(c.apparent_temperature),
    rain: num(c.precipitation_probability),
    uv: num(c.uv_index),
    wind: num(c.wind_speed_10m),
    gust: num(c.wind_gusts_10m),
    code: num(c.weather_code),
  };

  return {
    timezone: raw.timezone ?? null,
    current,
    days: [...new Set(hours.map((h) => h.date))],
    hours,
  };
}

// ---------- Place search (Open-Meteo Geocoding, US only) ----------

const STATE_CODES = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO',
  Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY',
  Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  'Puerto Rico': 'PR',
};

/** "Austin, TX" from a city and a full state name, falling back to the name alone. */
function placeLabel(city, state) {
  const code = STATE_CODES[state];
  return code ? `${city}, ${code}` : city;
}

const isZip = (text) => /^\d{5}$/.test(text);
// For comparing names: no accents, case or periods, and St/Ft/Mt read as Saint/Fort/Mount ("St. Louis" = "St Louis").
const ABBREVIATIONS = { st: 'saint', ft: 'fort', mt: 'mount' };
const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\./g, ' ').replace(/\b(st|ft|mt)\b/g, (abbr) => ABBREVIATIONS[abbr]).replace(/\s+/g, ' ').trim();

/**
 * Split what the User typed into the place to search for and an optional state:
 * "Austin, TX" → { place: "Austin", state: "TX" }. The geocoder only understands the place part.
 */
export function parseQuery(text) {
  const [place, state = ''] = text.split(',').map((part) => part.trim());
  return { place, state };
}

export function searchUrl(place) {
  const params = new URLSearchParams({
    name: place,
    count: 20, // extra results, as the starts-with filter below drops loose matches
    countryCode: 'US',
    language: 'en',
    format: 'json',
  });
  return `${GEOCODING_URL}?${params}`;
}

/**
 * US towns and cities as [{ name: "Austin, TX", lat, lon, city, state }]. Airports, parks and other
 * features are dropped (populated places have GeoNames feature codes starting "PPL"). When two
 * places would share a label, the county is added: "Austin, AR (Lonoke County)".
 */
export function parsePlaces(raw) {
  const results = Array.isArray(raw?.results) ? raw.results : [];
  const places = results
    .filter((r) => r.country_code === 'US' && (r.feature_code ?? 'PPL').startsWith('PPL'))
    .map((r) => ({
      name: placeLabel(r.name, r.admin1),
      lat: r.latitude,
      lon: r.longitude,
      city: r.name,
      state: STATE_CODES[r.admin1] ?? r.admin1 ?? '',
      county: r.admin2 ?? '',
    }));
  const counts = new Map();
  for (const p of places) counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
  return places.map(({ county, ...p }) => {
    if (counts.get(p.name) > 1 && county) {
      p.name += ` (${/county|parish|borough/i.test(county) ? county : `${county} County`})`;
    }
    return p;
  });
}

/**
 * Keep places whose name starts with what was typed, dropping the geocoder's loose matches
 * ("Austin" also returns "Ardmore, TN"). ZIP searches are kept as they are. A typed state,
 * as a code or full name, narrows the list further. An empty result means "No US places found".
 */
export function filterPlaces({ place, state }, places) {
  let kept = isZip(place) ? places : places.filter((p) => normalize(p.city).startsWith(normalize(place)));
  if (state) {
    const wanted = normalize(state);
    kept = kept.filter((p) => normalize(p.state) === wanted
      || normalize(Object.keys(STATE_CODES).find((name) => STATE_CODES[name] === p.state) ?? '') === wanted);
  }
  return kept.slice(0, 10);
}

export async function searchPlaces(text) {
  const query = parseQuery(text);
  if (!query.place) return [];
  return filterPlaces(query, parsePlaces(await getJson(searchUrl(query.place))));
}

// ---------- Reverse lookup (Nominatim) ----------

// Usage policy: lookups only on a tap, and each coordinate is looked up once per visit (R4).
// Kept in memory only, so nothing extra is stored on the device (R6).
const reverseCache = new Map();

export function reverseUrl(lat, lon) {
  const params = new URLSearchParams({
    lat,
    lon,
    format: 'jsonv2',
    zoom: 10, // city level
    addressdetails: 1,
    'accept-language': 'en',
  });
  return `${REVERSE_URL}?${params}`;
}

/** { name: "Austin, TX" | null, isUS } from a Nominatim response. */
export function parseReverse(raw) {
  const address = raw?.address ?? {};
  const isUS = address.country_code === 'us';
  const city = address.city ?? address.town ?? address.village ?? address.hamlet ?? address.county ?? null;
  const iso = address['ISO3166-2-lvl4'] ?? '';
  const stateCode = iso.startsWith('US-') ? iso.slice(3) : null;
  let name = null;
  if (city && stateCode) name = `${city}, ${stateCode}`;
  else if (city) name = city;
  return { name, isUS };
}

/**
 * Name the device's coordinates. Rounded to 3 decimals (about 100 m) for the cache key,
 * so a second tap in the same place makes no new request.
 */
export async function reverseLookup(lat, lon) {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (!reverseCache.has(key)) {
    // Cache the promise so two quick taps share one request; drop it on failure so Retry can try again.
    const pending = getJson(reverseUrl(lat, lon)).then(parseReverse);
    pending.catch(() => reverseCache.delete(key));
    reverseCache.set(key, pending);
  }
  return reverseCache.get(key);
}
