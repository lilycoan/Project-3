// Place search sheet (R3): a native <dialog>, so Escape, focus containment and the inert
// background come from the browser. Bottom sheet on phone; a panel under the header field on laptop.

import { searchPlaces } from './api.js';

const $ = (id) => document.getElementById(id);
const sheet = $('search-sheet');
const input = $('sheet-input');
const message = $('sheet-message');
const results = $('sheet-results');

let places = [];
let onChoose = () => {};
let searchId = 0; // ignores results from an older search that finishes late

/** Wire the sheet once. `choose(place)` and `locate()` are called by the User's pick. */
export function setUpSearch({ choose, locate }) {
  onChoose = choose;

  $('sheet-form').addEventListener('submit', (event) => {
    event.preventDefault();
    runSearch(input.value);
  });
  $('sheet-close').addEventListener('click', closeSearch);
  $('sheet-locate').addEventListener('click', () => {
    closeSearch();
    locate();
  });

  results.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) return;
    const place = places[Number(button.dataset.index)];
    closeSearch();
    onChoose(place);
  });

  // Up and Down move between results; Up from the first goes back to the field.
  sheet.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const buttons = [...results.querySelectorAll('button')];
    if (buttons.length === 0) return;
    const at = buttons.indexOf(document.activeElement);
    event.preventDefault();
    if (event.key === 'ArrowDown') buttons[Math.min(at + 1, buttons.length - 1)].focus();
    else if (at <= 0) input.focus();
    else buttons[at - 1].focus();
  });

  // A click on the backdrop (outside the panel) closes the sheet.
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) closeSearch();
  });
  // Back to the field, unless a link in the sheet opened Info (then Info keeps focus).
  sheet.addEventListener('close', () => {
    if (!$('main-screen').hidden) $('place-input').focus();
  });
}

/** Open the sheet and search for `text`. On laptop the panel lines up under the header field. */
export function openSearch(text) {
  const field = $('place-input').getBoundingClientRect();
  sheet.style.setProperty('--sheet-top', `${field.bottom + 8}px`);
  sheet.style.setProperty('--sheet-left', `${field.left}px`);
  input.value = text;
  if (!sheet.open) sheet.showModal();
  runSearch(text);
}

export function closeSearch() {
  if (sheet.open) sheet.close();
}

async function runSearch(text) {
  const id = ++searchId;
  places = [];
  results.replaceChildren();
  if (!text.trim()) {
    message.textContent = 'Type a US city or ZIP.';
    input.focus();
    return;
  }
  message.textContent = 'Searching…';
  try {
    places = await searchPlaces(text);
  } catch {
    if (id !== searchId) return;
    message.textContent = 'Couldn’t search right now. Check your connection and try again.';
    input.focus();
    return;
  }
  if (id !== searchId) return;

  if (places.length === 0) {
    message.textContent = 'No US places found'; // R3: the field stays usable
    input.focus();
    return;
  }
  message.textContent = places.length === 1 ? '1 place found' : `${places.length} places found`;
  results.innerHTML = places.map((p, i) => `<li><button type="button" data-index="${i}"></button></li>`).join('');
  // Names come from the geocoder, so they are set as text, never as HTML.
  results.querySelectorAll('button').forEach((button, i) => { button.textContent = places[i].name; });
  results.querySelector('button').focus();
}
