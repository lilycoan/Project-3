// Pure recommendation logic. No DOM or network access, so it runs under `node --test`.

/**
 * Outfit category from the window's feels-like high (spec: Rules).
 * Hot ≥ 85°F · Warm 70–84°F · Mild 55–69°F · Cold < 55°F. Returns null when the value is missing.
 */
export function categoryFor(feelsHigh) {
  if (feelsHigh == null) return null;
  if (feelsHigh >= 85) return 'hot';
  if (feelsHigh >= 70) return 'warm';
  if (feelsHigh >= 55) return 'mild';
  return 'cold';
}
