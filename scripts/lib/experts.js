// Six regime experts, each a different correction of the raw forecast, blended by the regime
// weights; plus a SHAP-style split of the blended correction into named drivers.

import { blend } from '../../src/lib/blend.js';
import { REGIMES } from '../../src/lib/scales.js';
import { apportion } from './math.js';

// How much of each correction term an expert applies to the raw forecast. Terms: rain the model
// misses in the orographic, depression and WD-interaction families; its drizzle; the pull
// towards the date's climatology; and extra rain from high moisture.
const EXPERTS = {
  depression: { oro: 0.3, dep: 0.85, wd: 0.2, drizzle: 0.6, clim: 0.04, moisture: 0.03 },
  orographic: { oro: 0.85, dep: 0.25, wd: 0.2, drizzle: 0.7, clim: 0.06, moisture: 0.04 },
  coastal: { oro: 0.5, dep: 0.4, wd: 0.2, drizzle: 0.5, clim: 0.05, moisture: 0.06 },
  wd: { oro: 0.25, dep: 0.25, wd: 0.85, drizzle: 0.6, clim: 0.05, moisture: 0.02 },
  inland: { oro: 0.3, dep: 0.35, wd: 0.3, drizzle: 0.8, clim: 0.1, moisture: 0 },
  break: { oro: 0.1, dep: 0.1, wd: 0.1, drizzle: 0.95, clim: 0.2, moisture: 0 },
};

// Share of each correction term credited to each driver; every term's shares add up to 1.
const DRIVERS = [
  { name: 'Upslope moisture flux', shares: { oro: 0.72 } },
  { name: 'Regime expert', shares: { oro: 0.2, dep: 0.45, wd: 1 } },
  { name: 'Nearby rain in raw forecast', shares: { oro: 0.04, dep: 0.55 } },
  { name: 'Precipitable water', shares: { oro: 0.04, moisture: 1 } },
  { name: 'Climatology for the date', shares: { drizzle: 1, clim: 1 } },
];

const weighted = (coefficients, terms) =>
  Object.entries(coefficients).reduce((total, [term, k]) => total + k * terms[term], 0);

/**
 * Corrects one district-day. `rain` comes from fields.rainfall(); `weights` are regime
 * probabilities; `normal` is the climatological rainfall for the date.
 */
export function correct(rain, weights, normal, drizzle) {
  const raw = Math.round(rain.raw);
  const terms = {
    ...rain.deficit,
    drizzle: -drizzle,
    clim: normal - rain.raw,
    moisture: rain.modelRain,
  };

  const experts = Object.fromEntries(
    REGIMES.map(({ id }) => [id, Math.max(0, Math.round(rain.raw + weighted(EXPERTS[id], terms)))]),
  );
  const corrected = blend(weights, experts);

  const contributions = Object.fromEntries(
    Object.keys(terms).map((term) => [
      term,
      terms[term] * REGIMES.reduce((total, { id }) => total + weights[id] * EXPERTS[id][term], 0),
    ]),
  );
  const driverMm = apportion(
    DRIVERS.map(({ shares }) => weighted(shares, contributions)),
    corrected - raw,
  );

  return {
    raw,
    experts,
    corrected,
    drivers: DRIVERS.map(({ name }, i) => ({ name, mm: driverMm[i] })),
  };
}
