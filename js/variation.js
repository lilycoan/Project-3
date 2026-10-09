// In-memory variation picks and check marks, keyed by "date|window" (spec: How variations are chosen and kept).
// Nothing here is written to the device, so a reload starts fresh (R6, R19).

const VARIANTS = 3;

export function variationKey(date, window) {
  return `${date}|${window}`;
}

/**
 * A store of picks for one location. `random` is injectable so tests can control it.
 * Outfit and each reminder's wording are separate Math.random() draws, so they combine freely (R18).
 */
export function createVariations(random = Math.random) {
  const byKey = new Map();
  const pick = () => Math.floor(random() * VARIANTS);

  /** Picks for one date|window, made on first view and reused afterward (R19). */
  function picksFor(key) {
    if (!byKey.has(key)) {
      byKey.set(key, { outfitVariant: pick(), wordings: new Map(), checked: new Set() });
    }
    const entry = byKey.get(key);
    return {
      outfitVariant: entry.outfitVariant,
      // A wording is picked the first time its reminder triggers for this key, then kept.
      wordingFor(type) {
        if (!entry.wordings.has(type)) entry.wordings.set(type, pick());
        return entry.wordings.get(type);
      },
      isChecked: (type) => entry.checked.has(type),
    };
  }

  /** Tick or untick a reminder for one date|window (R16). */
  function setChecked(key, type, checked) {
    picksFor(key); // make sure the entry exists
    const set = byKey.get(key).checked;
    if (checked) set.add(type);
    else set.delete(type);
  }

  /** A new location starts with fresh picks and no ticks. */
  function clear() {
    byKey.clear();
  }

  return { picksFor, setChecked, clear };
}
