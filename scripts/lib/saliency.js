// What the regime engine "looked at" (a saliency heatmap) and forecast 850 hPa winds, per lead day.

import { ghatsZone } from './fields.js';
import { bump, clamp, degOffset, gauss, logistic, round } from './math.js';

const GRID = { lon0: 66, lat0: 6, step: 0.5, nx: 65, ny: 65 };
const WIND_GRID = { lon0: 66, lat0: 6, step: 2, nx: 17, ny: 17 };

function saliency(lon, lat, { depression, ghats, northEast, wd }, t) {
  const monsoonFlow = ghats.amp / 170;
  const influences = [
    (depression.amp / 150) * bump(lon, lat, depression.lon, depression.lat, 2.4, 1.9),
    0.85 * monsoonFlow * bump(lon, lat, 70, 13.5, 4.2, 2.3), // Arabian Sea low-level jet
    0.75 * monsoonFlow * ghatsZone(lon, lat),
    0.45 * (northEast.amp / 110) * bump(lon, lat, 91.6, 25.6, 1.6, 1.0),
    0.3 * (wd.amp / 32) * bump(lon, lat, wd.lon, wd.lat, 2.0, 1.4),
  ];
  // Combine the influences like independent evidence, then add a faint grain.
  const combined = 1 - influences.reduce((rest, x) => rest * (1 - clamp(x, 0, 1)), 1);
  const grain = 0.03 * Math.sin(2.1 * lon + 1.3 * lat + t) * Math.sin(1.7 * lat - 0.9 * lon);
  return round(clamp(combined + grain, 0, 1), 2);
}

// 850 hPa lies below ground over the Himalaya and the Tibetan plateau.
const belowGround = (lon, lat) => lat >= 35 || (lat >= 32 && lon >= 73) || (lat >= 28 && lon >= 80);

/** Wind at 850 hPa, m/s: monsoon westerlies, easterlies north of the trough, a cyclonic depression. */
function wind(lon, lat, { depression }) {
  let u = 3 + 13 * gauss(lat - 13.5, 5.5) - 9 * logistic((lat - 25) / 1.5) * logistic((lon - 78) / 2);
  let v = 3 * gauss(lat - 11, 7) * logistic((76 - lon) / 4) + 1.5 * gauss(lat - 18, 4) * logistic((lon - 86) / 2);

  const [dx, dy] = degOffset(lon, lat, depression.lon, depression.lat);
  const r = Math.hypot(dx, dy) || 1e-6;
  const tangential = (depression.amp / 150) * 14 * (r < 1.5 ? r / 1.5 : (1.5 / r) ** 0.7);
  u -= (tangential * dy) / r; // anticlockwise flow in the northern hemisphere
  v += (tangential * dx) / r;
  return [round(u, 1), round(v, 1)];
}

/** `systemsByLead[i]` are the weather systems valid on lead day i + 1. */
export function buildSaliency(systemsByLead) {
  const cells = (grid, visit) =>
    Array.from({ length: grid.ny }, (_, j) =>
      Array.from({ length: grid.nx }, (_, i) => visit(grid.lon0 + i * grid.step, grid.lat0 + j * grid.step)),
    );

  return {
    grid: { ...GRID, rows: 'south to north', columns: 'west to east' },
    wind: { ...WIND_GRID, level: '850 hPa', units: 'm/s' },
    days: systemsByLead.map((systems, index) => ({
      lead: index + 1,
      saliency: cells(GRID, (lon, lat) => saliency(lon, lat, systems, index)),
      wind: cells(WIND_GRID, (lon, lat) => [lon, lat])
        .flat()
        .filter(([lon, lat]) => !belowGround(lon, lat))
        .map(([lon, lat]) => [lon, lat, ...wind(lon, lat, systems)]),
    })),
  };
}
