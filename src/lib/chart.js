// Geometry helpers for the hand-built SVG charts.

/** Bar standing on `bottom` with rounded top corners of up to `radius` px. */
export function barPath(x, top, width, bottom, radius = 4) {
  const r = Math.min(radius, width / 2, bottom - top);
  return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${bottom}Z`;
}

/** Linear map from [d0, d1] to [r0, r1]. */
export const linearScale = ([d0, d1], [r0, r1]) => (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);

/** SVG polyline points for [x, y] pairs. */
export const points = (pairs) => pairs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
