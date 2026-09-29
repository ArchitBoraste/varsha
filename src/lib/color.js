const toRgb = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** Blend `from` towards `to` by `amount` (0–1). Colours are #RRGGBB. */
export function mix(from, to, amount) {
  const a = toRgb(from);
  const b = toRgb(to);
  return toHex(a.map((v, i) => v + (b[i] - v) * amount));
}

/** Colour at `t` (0–1) along evenly spaced colour stops. */
export function ramp(stops, t) {
  const scaled = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  return mix(stops[index], stops[index + 1], scaled - index);
}
