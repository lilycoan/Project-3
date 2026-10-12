// All User-facing recommendation copy, from spec.md → Content variation.
// Kept apart from the rules in recommend.js so wording can be edited without touching logic.

/**
 * Three outfits per category. `text` is the written recommendation; `alt` completes
 * "Character wearing …" for the character's text alternative (R31). Both describe the same drawing.
 */
export const OUTFITS = {
  hot: [
    { text: 'Light tank top, denim shorts and sandals', alt: 'a light tank top, denim shorts and sandals' },
    { text: 'Loose linen button-up, light shorts and sneakers', alt: 'a loose linen button-up, light shorts and sneakers' },
    { text: 'Light, loose tee dress and sandals', alt: 'a light, loose tee dress and sandals' },
  ],
  warm: [
    { text: 'Tee, light chinos and sneakers', alt: 'a tee, light chinos and sneakers' },
    { text: 'Tee, mid-length skirt and sneakers', alt: 'a tee, a mid-length skirt and sneakers' },
    { text: 'Short-sleeve button-up, light jeans and loafers', alt: 'a short-sleeve button-up, light jeans and loafers' },
  ],
  mild: [
    { text: 'Long-sleeve tee, jeans and sneakers', alt: 'a long-sleeve tee, jeans and sneakers' },
    { text: 'Light crewneck sweater, chinos and sneakers', alt: 'a light crewneck sweater, chinos and sneakers' },
    { text: 'Tee with an open overshirt, jeans and boots', alt: 'a tee with an open overshirt, jeans and boots' },
  ],
  cold: [
    { text: 'Sweater, puffer jacket, jeans and boots', alt: 'a sweater, puffer jacket, jeans and boots' },
    { text: 'Hoodie, wool coat, trousers and sneakers', alt: 'a hoodie, wool coat, trousers and sneakers' },
    { text: 'Thermal top, fleece jacket, joggers and a beanie', alt: 'a thermal top, fleece jacket, joggers and a beanie' },
  ],
};

/**
 * Character styles (spec R34): each has its own head and its own 3 outfits per category.
 * The Medium-hair style uses OUTFITS above; the Short wavy style swaps the dress (Hot 3) and the
 * skirt (Warm 2) for the outfits below. `label` names each preview for screen readers.
 */
export const STYLES = {
  short: { head: 'head', waveHead: 'head-wave', label: 'Short wavy hair' },
  medium: { head: 'head-medium', waveHead: 'head-medium-wave', label: 'Shoulder-length hair' },
};
export const DEFAULT_STYLE = 'short'; // the original look, so returning Users see no change

const STYLE_OUTFITS = {
  short: {
    'hot-3': { text: 'Sleeveless tee, running shorts and sneakers', alt: 'a sleeveless tee, running shorts and sneakers' },
    'warm-2': { text: 'Polo shirt, chino shorts and sneakers', alt: 'a polo shirt, chino shorts and sneakers' },
  },
  medium: {},
};

/**
 * The outfit for a style, category and variant (0–2): its text, its alt text, and the SVG file to draw.
 * The same variant number is used in both styles, so switching style keeps the variation pick.
 */
export function outfitFor(style, category, variant) {
  const key = `${category}-${variant + 1}`;
  const swapped = STYLE_OUTFITS[style]?.[key];
  return swapped
    ? { ...swapped, file: `outfit-${key}-${style}` }
    : { ...OUTFITS[category][variant], file: `outfit-${key}` };
}

/** Reminder order on screen, and three wordings each. Placeholders are filled by recommend.js. */
export const REMINDER_TYPES = ['umbrella', 'sunscreen', 'hydration', 'bikeWind'];

export const REMINDER_WORDINGS = {
  umbrella: [
    'Grab an umbrella: {rain}% chance of rain around {time}.',
    'Rain’s likely ({rain}%) around {time}. Pack an umbrella.',
    'Don’t get caught out: {rain}% rain chance around {time}.',
  ],
  sunscreen: [
    'UV hits {uv}. Put on sunscreen before you head out.',
    'Strong sun (UV {uv}). Sunscreen, hat, sunglasses.',
    'UV {uv}: SPF 15+ before you go, and reapply if you’re out a while.',
  ],
  hydration: [
    'Feels like {feelsHigh}°. Carry a water bottle and refill it.',
    'It’s a sweaty one ({feelsHigh}°). Keep water on you.',
    'Hot out there: {feelsHigh}°. Keep drinking while you’re out.',
  ],
  bikeWind: [
    'Gusty ride: wind up to {wind} mph, gusts {gust}.',
    'Strong wind for biking ({wind} mph). Give yourself extra time.',
    'Windy on two wheels: gusts to {gust} mph. Ride with care.',
  ],
};

/** Short names for icons and screen readers. */
export const REMINDER_LABELS = {
  umbrella: 'Umbrella',
  sunscreen: 'Sunscreen',
  hydration: 'Water',
  bikeWind: 'Wind',
};

export const NO_REMINDERS = 'Nothing extra to bring.';

/** "Bring a light layer for …" endings, for today and for forecast dates. */
export const LAYER_TIMES = {
  morning: { today: 'this morning', future: 'the morning' },
  evening: { today: 'this evening', future: 'the evening' },
  late: { today: 'later tonight', future: 'later that night' },
};

/** Loading, error, ended-window and first-visit copy (R9, R21, R23, R25). */
export const STATE_TEXT = {
  loading: 'Getting the weather…',
  errorTitle: 'Couldn’t load the weather',
  errorReasons: {
    timeout: 'Open-Meteo didn’t respond within 10 seconds.',
    offline: 'Couldn’t reach Open-Meteo. Check your connection.',
    server: 'Open-Meteo sent back an error.',
    missing: 'The forecast is missing temperatures for this time.',
  },
  retry: 'Retry',
  dayEnded: 'Today’s daytime has ended. See Evening or pick another day.',
  eveningEnded: 'Tonight’s evening has ended. Pick another day.',
  seeEvening: 'See Evening',
  seeTomorrow: 'See tomorrow',
  firstVisitTitle: 'What should I wear today?',
  firstVisitBody: 'Pick a place to get an outfit for the weather.',
  chooseLook: 'Choose a look',
  useLocation: 'Use my location',
  typePlace: 'Type a city or ZIP',
  waveAlt: 'Character waving hello, wearing a tee, light chinos and sneakers.',
  styleGroup: 'Character look',
};
