// One district's forecast for one valid day: raw, regime weights, experts, blend and risk.

import { exceedanceProbs, likelyRange, warningLevel } from '../../src/lib/risk.js';
import { correct } from './experts.js';
import { climatology, rainfall } from './fields.js';
import { regimeWeights } from './regimes.js';

/**
 * @param place    district with `centroid` and `coastDistance`
 * @param systems  weather systems for valid day `t`
 * @param bias     raw-model errors (see scenario.GFS_BIAS)
 * @param lead     forecast lead day, 1–5
 * @param t        valid day relative to Day 1 of the 29 Jul 2024 run
 */
export function forecastDay(place, systems, bias, lead, t) {
  const [lon, lat] = place.centroid;
  const rain = rainfall(lon, lat, systems, bias, t);
  const p = regimeWeights(place, systems, lead);
  const { raw, experts, corrected, drivers } = correct(rain, p, climatology(lon, lat), bias.drizzle);
  const probs = exceedanceProbs(corrected, lead);
  return {
    lead,
    raw,
    corrected,
    range: likelyRange(corrected, lead),
    observed: Math.round(rain.observed),
    p,
    experts,
    probs,
    warning: warningLevel(probs),
    drivers,
  };
}
