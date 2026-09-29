// Static per-district facts: name, state, centroid, distance to the coast and exposure.

import { centroid, coastline, distanceToSegments } from './geo.js';
import { exposureLookup } from './exposure.js';
import { round } from './math.js';

export async function loadPlaces(districts, states) {
  const coast = await coastline(states);
  const exposureOf = exposureLookup(new Set(districts.features.map((f) => f.properties.id)));
  return districts.features.map((feature) => {
    const { id, district, state } = feature.properties;
    const point = centroid(feature);
    return {
      id,
      name: district,
      state,
      centroid: point,
      coastDistance: round(distanceToSegments(point, coast), 3),
      exposure: exposureOf(feature),
    };
  });
}
