// Draws Main from the recommendation state only (R11). No rules or weather maths here.

import { shown } from './recommend.js';
import { STATE_TEXT as T, STYLES, outfitFor } from './content.js';

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

// Numbers are shown rounded down (see shown() in recommend.js); missing values show "—" (R23).
const show = (v, format) => (v == null ? '—' : format(shown(v)));

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

/** Character layers in drawing order (see AGENTS.md → Character art), for the chosen style (R34). */
export function characterLayers(category, outfitVariant, addOns, style) {
  const outfit = `${category}-${outfitVariant + 1}`;
  const files = ['body', outfitFor(style, category, outfitVariant).file];
  if (addOns.layer) files.push('layer');
  files.push(STYLES[style].head);
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
  // The greyed loading outline has no label and is hidden from screen readers (R31).
  if (label) el.removeAttribute('aria-hidden');
  else el.setAttribute('aria-hidden', 'true');
}

function drawWeather(w) {
  const icon = $('condition-icon');
  const condition = CONDITION_ICONS[w.condition];
  icon.hidden = !condition;
  if (condition) icon.src = `assets/icons/meteocons/${condition[0]}.svg`;
  // The condition is also written out, so the pale icons never carry it alone (WCAG 1.4.11).
  $('condition').textContent = condition ? `${condition[1]} · ` : '';
  $('feels').innerHTML = `<span class="visually-hidden">High </span>${show(w.feelsHigh, (v) => `${v}°`)}`
    + '<span aria-hidden="true"> / </span>'
    + `<span class="visually-hidden">, low </span>${show(w.feelsLow, (v) => `${v}°`)}`;
  $('rain').textContent = show(w.rainMax, (v) => `${v}%`);
  $('uv').textContent = show(w.uvMax, (v) => `${v} ${uvLevel(Number(v))}`);
  $('wind').textContent = show(w.windMax, (v) => `${v} mph`) +
    (w.gustMax == null ? '' : `, gusts ${shown(w.gustMax)}`);
}

function drawReminders(reminders) {
  const list = $('reminder-list');
  if (reminders.length === 0) {
    list.innerHTML = '<li class="reminder-none">Nothing extra to bring.</li>'; // R17
    return;
  }
  // Real checkboxes (R16): the whole row is the label, so it is one large tap target.
  list.innerHTML = reminders.map((r) => `
    <li>
      <label class="reminder">
        <input type="checkbox" data-reminder="${r.type}"${r.checked ? ' checked' : ''}>
        <img src="${REMINDER_ICONS[r.type]}" alt="">
        <span class="reminder-text"><strong>${r.label}:</strong> ${r.text}</span>
      </label>
    </li>`).join('');
}

function drawReminderCount(reminders) {
  const count = $('reminder-count');
  const ready = reminders.filter((r) => r.checked).length;
  count.hidden = reminders.length === 0;
  count.textContent = `${ready} of ${reminders.length} ready`;
}

// Parts of Main are rebuilt on each render; these attributes identify a control across rebuilds.
const FOCUS_KEYS = ['data-date', 'data-reminder', 'data-style'];

/** Remember which rebuilt control has focus, so keyboard users stay in place after a render. */
function focusedKey() {
  const el = document.activeElement;
  const attr = FOCUS_KEYS.find((a) => el?.hasAttribute?.(a));
  return attr ? `[${attr}="${el.getAttribute(attr)}"]` : null;
}

// ---------- Main ----------

/**
 * Style choice buttons (R34): a head-and-shoulders preview of each style. The only alt text is on
 * the head image, so each button's name is its style label. app.js handles them by data-style.
 */
function styleButtons(current, size) {
  return Object.entries(STYLES).map(([id, style]) => `
    <button type="button" class="style-button ${size}" data-style="${id}" aria-pressed="${id === current}">
      <span class="style-preview">
        <img src="assets/character/body.svg" alt=""><img src="assets/character/outfit-warm-1.svg" alt="">
        <img src="assets/character/${style.head}.svg" alt="${style.label}">
      </span>
    </button>`).join('');
}

/** Buttons in the status panel. app.js handles them by their data-action. */
const action = (name, text, primary = false) =>
  `<button type="button" class="${primary ? 'button primary' : 'button'}" data-action="${name}">${text}</button>`;

/** The message and actions for every status other than "ok", as HTML for the status panel. */
function statusPanel(state) {
  switch (state.status) {
    case 'loading':
      // Placeholder bars stand in for the recommendation and weather while loading (R21).
      return `<div class="placeholder-bars" aria-hidden="true"><span></span><span></span></div>
        <p class="status-text">${T.loading}</p>`;
    case 'error':
      return `<img class="status-icon" src="assets/icons/lucide/circle-alert.svg" alt="">
        <p class="status-title">${T.errorTitle}</p>
        <p class="status-text">${T.errorReasons[state.reason] ?? T.errorReasons.server}</p>
        <div class="status-actions">${action('retry', T.retry, true)}</div>`;
    case 'windowEnded':
      return state.window === 'day'
        ? `<p class="status-title">${T.dayEnded}</p>
          <div class="status-actions">${action('see-evening', T.seeEvening, true)}${action('see-tomorrow', T.seeTomorrow)}</div>`
        : `<p class="status-title">${T.eveningEnded}</p>
          <div class="status-actions">${action('see-tomorrow', T.seeTomorrow, true)}</div>`;
    case 'empty':
      // First visit: choose a look (R34), then a place (R25).
      return `<p class="status-title">${T.firstVisitTitle}</p>
        <p class="status-text" id="choose-look">${T.chooseLook}</p>
        <div class="style-choice" role="group" aria-labelledby="choose-look">${styleButtons(state.style, 'large')}</div>
        <p class="status-text">${T.firstVisitBody}</p>
        <div class="status-actions">${action('locate', T.useLocation, true)}${action('type-place', T.typePlace)}</div>`;
    default:
      return '';
  }
}

/** Plain-text version of the status message for the live region (R31). */
export function statusMessage(state) {
  const panel = document.createElement('div');
  panel.innerHTML = statusPanel(state);
  return [...panel.querySelectorAll('.status-title, .status-text')].map((p) => p.textContent).join(' ');
}

/**
 * Draw Main.
 * @param state     buildState() result, or { status: 'loading' | 'error' | 'empty', location, reason }
 * @param controls  { days, date, window } for the date strip and toggle; days is empty without a forecast
 */
export function renderMain(state, controls) {
  const focus = focusedKey();
  const { status } = state;
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

  const ok = status === 'ok';
  $('weather').hidden = !ok;
  $('reminders-title').parentElement.hidden = !ok;
  $('recommendation').hidden = !ok;
  $('status-panel').hidden = ok;
  $('status-panel').innerHTML = statusPanel(state);
  $('status-panel').dataset.status = status;

  // The character: the outfit when ok, a greyed outline while loading (R21), waving on first visit (R25),
  // and no outfit for an ended window (R9) or an error.
  const card = $('character').parentElement;
  card.hidden = status === 'error' || status === 'windowEnded';
  card.classList.toggle('is-loading', status === 'loading');
  // The small style switch sits in the character card corner whenever an outfit is shown (R34).
  const styleSwitch = $('style-switch');
  styleSwitch.hidden = !ok;
  styleSwitch.innerHTML = ok ? styleButtons(state.style, 'small') : '';

  if (ok) {
    drawCharacter(characterLayers(state.category, state.outfitVariant, state.addOns, state.style), state.text.characterAlt);
    $('recommendation').textContent = state.text.recommendation;
    drawWeather(state.weather);
    drawReminders(state.reminders);
    drawReminderCount(state.reminders);
  } else if (status === 'loading') {
    drawCharacter(['body', 'head'], '');
  } else if (status === 'empty') {
    drawCharacter(['body-wave', 'outfit-wave', STYLES[state.style].waveHead], T.waveAlt);
  }

  renderControls(controls);
  if (focus) document.querySelector(focus)?.focus();
}

function renderControls({ days = [], date, window }) {
  // Without a forecast there is nothing to pick yet: only the location controls show.
  $('day-strip').hidden = days.length === 0;
  document.querySelector('.window-toggle').hidden = days.length === 0;
  const strip = $('day-strip');
  strip.innerHTML = days.map((d) => {
    const label = dayLabels(d.date);
    const condition = CONDITION_ICONS[d.condition];
    // The icon and range show on the laptop week strip only; the phone strip shows the day alone.
    const icon = condition ? `<img class="day-icon" src="assets/icons/meteocons/${condition[0]}.svg" alt="">` : '';
    const range = `${show(d.feelsHigh, (v) => `${v}°`)}/${show(d.feelsLow, (v) => `${v}°`)}`;
    const month = label.long.split(' ')[1]; // "October"
    // No aria-label: the visible "Mon 12" starts the spoken name, so voice control matches it (WCAG 2.5.3).
    // The month, and on laptop the condition, are added for screen readers only.
    const said = condition ? `<span class="visually-hidden">, ${condition[1]}, feels like</span> ` : '';
    return `<button type="button" data-date="${d.date}" aria-pressed="${d.date === date}">
      <span class="day-name"><span>${label.weekday}</span> <span class="day-num">${label.day}</span><span class="visually-hidden"> ${month}</span></span>
      ${icon}<span class="day-range">${said}${range}</span></button>`;
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
