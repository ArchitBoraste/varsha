// District geometry helpers: centroids, areas and distance to the coast.

import { geoArea, geoCentroid } from 'd3-geo';
import mapshaper from 'mapshaper';
import { degOffset, round } from './math.js';

const EARTH_RADIUS_KM = 6371;

// India's land borders (Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar) all lie outside these
// limits, so outline points inside them are coastline.
function isCoastalPoint([lon, lat]) {
  if (lat < 21) return true; // peninsula, Lakshadweep, Andaman and Nicobar
  if (lon < 74) return lat < 23.3; // Gujarat; the Pakistan border meets the sea at Sir Creek (~23.6°N)
  if (lon > 85 && lon < 89.05) return lat < 22; // Odisha and Bengal up to the Sundarbans
  return false;
}

/** Coastline segments taken from the dissolved outline of India, excluding land borders. */
export async function coastline(states) {
  const output = await mapshaper.applyCommands(
    '-i states.json -dissolve -o india.json format=geojson geojson-type=FeatureCollection -quiet',
    { 'states.json': states },
  );
  const { geometry } = JSON.parse(output['india.json'].toString()).features[0];
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

  const segments = [];
  for (const ring of polygons.flat()) {
    for (let i = 1; i < ring.length; i++) {
      if (isCoastalPoint(ring[i - 1]) && isCoastalPoint(ring[i])) segments.push([ring[i - 1], ring[i]]);
    }
  }
  return segments;
}

/** Shortest distance in degrees (longitude scaled by latitude) from a point to any segment. */
export function distanceToSegments([lon, lat], segments) {
  let best = Infinity;
  for (const [a, b] of segments) {
    const [ax, ay] = degOffset(a[0], a[1], lon, lat);
    const [bx, by] = degOffset(b[0], b[1], lon, lat);
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

export const centroid = (feature) => geoCentroid(feature).map((value) => round(value, 3));

export const areaKm2 = (feature) => geoArea(feature) * EARTH_RADIUS_KM ** 2;
