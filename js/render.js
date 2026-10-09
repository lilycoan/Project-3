// Draws Main from the recommendation state only (R11). No rules or weather maths here.

const $ = (id) => document.getElementById(id);

// ---------- Lookups for display ----------

const CONDITION_ICONS = {
  clear: ['clear-day', 'Clear'],
  partlyCloudy: ['partly-cloudy-day', 'Partly cloudy'],
  overcast: ['overcast', 'Overcast'],
  fog: ['fog', 'Fog'],
  drizzle: ['drizzle', 'Drizzle'],
  rain: ['rain', 'Rain'],
  thunderstorm: ['thunderstorms', 'Thunderstorms'],
  snow: ['snow', 'Snow'],
};

const REMINDER_ICONS = {
  umbrella: 'assets/icons/meteocons/umbrella.svg',
  sunscreen: 'assets/icons/meteocons/uv-index.svg',
  hydration: 'assets/icons/meteocons/raindrop.svg',
  bikeWind: 'assets/icons/lucide/bike.svg',
};

// Outfits with a piece drawn above the head (the Cold 3 beanie).
const OUTFIT_TOPS = new Set(['cold-3']);

/** EPA UV index categories. */
function uvLevel(uv) {
  if (uv < 3) return 'low';
  if (uv < 6) return 'moderate';
  if (uv < 8) return 'high';
  if (uv < 11) return 'very high';
  return 'extreme';
}

const round = (v) => Math.round(v);
const show = (v, format) => (v == null ? '—' : format(v)); // missing values show "—" (R23)

/** "Mon", "5", "Mon, Oct 5" and "Monday, October 5" for a "YYYY-MM-DD" date. */
export function dayLabels(date) {
  const d = new Date(`${date}T12:00:00Z`); // noon UTC, formatted in UTC, so the date never shifts
  const fmt = (options) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(d);
  return {
    weekday: fmt({ weekday: 'short' }),
    day: fmt({ day: 'numeric' }),
    short: fmt({ weekday: 'short', month: 'short', day: 'numeric' }),
    long: fmt({ weekday: 'long', month: 'long', day: 'numeric' }),
  };
}

// ---------- Pieces ----------

/** Character layers in drawing order (see AGENTS.md → Character art). */
export function characterLayers(category, outfitVariant, addOns) {
  const outfit = `${category}-${outfitVariant + 1}`;
  const files = ['body', `outfit-${outfit}`];
  if (addOns.layer) files.push('layer');
  files.push('head');
  if (OUTFIT_TOPS.has(outfit)) files.push(`outfit-${outfit}-top`);
  if (addOns.sunglasses) files.push('sunglasses');
  if (addOns.hat) files.push('hat');
  if (addOns.umbrella) files.push('umbrella');
  return files;
}

function drawCharacter(files, label) {
  const el = $('character');
  el.innerHTML = files.map((f) => `<img src="assets/character/${f}.svg" alt="">`).join('');
  el.setAttribute('aria-label', label);
}

function drawWeather(w) {
  const icon = $('condition-icon');
  const condition = CONDITION_ICONS[w.condition];
  icon.hidden = !condition;
  if (condition) {
    icon.src = `assets/icons/meteocons/${condition[0]}.svg`;
    icon.alt = condition[1];
  }
  const feels = $('feels');
  feels.textContent = `${show(w.feelsHigh, (v) => `${round(v)}°`)} / ${show(w.feelsLow, (v) => `${round(v)}°`)}`;
  feels.setAttribute('aria-label', `high ${show(w.feelsHigh, round)}°, low ${show(w.feelsLow, round)}°`);
  $('rain').textContent = show(w.rainMax, (v) => `${round(v)}%`);
  $('uv').textContent = show(w.uvMax, (v) => `${round(v)} ${uvLevel(v)}`);
  $('wind').textContent = show(w.windMax, (v) => `${round(v)} mph`) +
    (w.gustMax == null ? '' : `, gusts ${round(w.gustMax)}`);
}

function drawReminders(reminders) {
  const list = $('reminder-list');
  if (reminders.length === 0) {
    list.innerHTML = '<li class="reminder none">Nothing extra to bring.</li>'; // R17
    return;
  }
  list.innerHTML = reminders.map((r) => `
    <li class="reminder">
      <img src="${REMINDER_ICONS[r.type]}" alt="">
      <span><strong>${r.label}:</strong> ${r.text}</span>
    </li>`).join('');
}

// ---------- Main ----------

/**
 * Draw Main.
 * @param state     buildState() result, or a { status: 'loading' | 'error' | 'empty', message } placeholder
 * @param controls  { days, date, window } for the date strip and toggle
 */
export function renderMain(state, controls) {
  $('place').textContent = state.location?.name ?? 'WearCast';

  // Context line (R10): date, Now/Forecast tag. Units and source are static in the page.
  const tag = $('time-tag');
  if (state.date) {
    $('date-label').textContent = dayLabels(state.date).short;
    tag.textContent = state.label;
    tag.hidden = false;
  } else {
    $('date-label').textContent = '';
    tag.hidden = true;
  }

  const ok = state.status === 'ok';
  $('weather').hidden = !ok;
  $('reminders-title').parentElement.hidden = !ok;

  if (ok) {
    drawCharacter(characterLayers(state.category, state.outfitVariant, state.addOns), state.text.characterAlt);
    $('recommendation').textContent = state.text.recommendation;
    drawWeather(state.weather);
    drawReminders(state.reminders);
  } else {
    // Loading, error, ended-window and first-visit screens are built in CP10.
    drawCharacter([], '');
    $('recommendation').textContent = state.message ?? '';
  }

  renderControls(controls);
}

function renderControls({ days = [], date, window }) {
  const strip = $('day-strip');
  strip.innerHTML = days.map((d) => {
    const label = dayLabels(d);
    const selected = d === date;
    return `<button type="button" data-date="${d}" aria-pressed="${selected}" aria-label="${label.long}">
      <span>${label.weekday}</span><span class="day-num">${label.day}</span></button>`;
  }).join('');
  for (const button of document.querySelectorAll('.window-toggle button')) {
    button.setAttribute('aria-pressed', String(button.dataset.window === window));
  }
}

/** Put a message in the live region (R31). Cleared first so repeats are announced. */
export function announce(message) {
  const status = $('status');
  status.textContent = '';
  setTimeout(() => { status.textContent = message; }, 50);
}
