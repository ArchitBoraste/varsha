// Projection helpers shared by IndiaMap and its overlays (markers, wind arrows, heatmaps).

import { geoMercator } from 'd3-geo';

const PADDING = 4;
const DEG = Math.PI / 180;

/** Mercator projection fitting a GeoJSON object inside a width × height box. */
export function fitProjection(geojson, width, height, padding = PADDING) {
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    geojson,
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
