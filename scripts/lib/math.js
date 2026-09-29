export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export const round = (x, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(x * factor) / factor;
};

export const gauss = (d, sigma) => Math.exp(-0.5 * (d / sigma) ** 2);

/** Elliptical gaussian bump centred on (lon0, lat0), with widths in degrees. */
export const bump = (lon, lat, lon0, lat0, sigmaLon, sigmaLat) =>
  Math.exp(-0.5 * (((lon - lon0) / sigmaLon) ** 2 + ((lat - lat0) / sigmaLat) ** 2));

export const logistic = (x) => 1 / (1 + Math.exp(-x));

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Piecewise-linear interpolation through [x, y] knots sorted by x, held constant beyond the ends. */
export function interpolate(knots, x) {
  if (x <= knots[0][0]) return knots[0][1];
  const upper = knots.findIndex(([kx]) => kx >= x);
  if (upper === -1) return knots.at(-1)[1];
  const [x0, y0] = knots[upper - 1];
  const [x1, y1] = knots[upper];
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

/** Planar offset in degrees from (lon0, lat0), with longitude scaled by cos(latitude). */
export function degOffset(lon, lat, lon0, lat0) {
  return [(lon - lon0) * Math.cos((lat * Math.PI) / 180), lat - lat0];
}

export const degDistance = (lon, lat, lon0, lat0) => Math.hypot(...degOffset(lon, lat, lon0, lat0));

export const sum = (values) => values.reduce((total, value) => total + value, 0);

/** Rounds values to integers that add up to `total` exactly (largest-remainder method). */
export function apportion(values, total) {
  const adjusted = [...values];
  // Absorb any mismatch in the largest value so small components keep their size and sign.
  const largest = values.reduce((best, v, i) => (Math.abs(v) > Math.abs(values[best]) ? i : best), 0);
  adjusted[largest] += total - sum(values);
  const floors = adjusted.map(Math.floor);
  const remaining = Math.round(total - sum(floors));
  const byRemainder = adjusted.map((v, i) => [v - floors[i], i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < remaining; k++) floors[byRemainder[k][1]] += 1;
  return floors;
}

/** 32-bit FNV-1a hash, for stable per-district randomness. */
export function hashString(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32) returning floats in [0, 1). */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
