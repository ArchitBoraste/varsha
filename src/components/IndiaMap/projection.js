// Projection helpers shared by IndiaMap and its overlays (markers, wind arrows, heatmaps).

import { geoMercator } from 'd3-geo';

const PADDING = 4;
const DEG = Math.PI / 180;

/** The corners of a [[west, south], [east, north]] box as GeoJSON; enough to fit a Mercator map. */
const bboxCorners = ([[west, south], [east, north]]) => ({
  type: 'MultiPoint',
  coordinates: [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
  ],
});

/**
 * Mercator projection fitting `target` inside a width × height box: a GeoJSON object, or a
 * [[west, south], [east, north]] longitude/latitude box.
 */
export function fitProjection(target, width, height, padding = PADDING) {
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    Array.isArray(target) ? bboxCorners(target) : target,
  );
}

/** Screen rectangle of the grid cell centred on (lon, lat), `step` degrees wide; exact for Mercator. */
export function cellRect(projection, lon, lat, step) {
  const [x0, y0] = projection([lon - step / 2, lat + step / 2]);
  const [x1, y1] = projection([lon + step / 2, lat - step / 2]);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Screen start and end points of an arrow for the vector (u, v), in m/s, placed at (lon, lat).
 * `degreesPerUnit` converts speed to arrow length along the ground.
 */
export function vectorEnds(projection, [lon, lat], [u, v], degreesPerUnit) {
  const start = projection([lon, lat]);
  const end = projection([lon + (u * degreesPerUnit) / Math.cos(lat * DEG), lat + v * degreesPerUnit]);
  return [start, end];
}
