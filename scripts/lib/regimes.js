// Regime probabilities per district: physics-style scores turned into weights by a softmax,
// so districts on the edge of two regimes get mixed weights.

import { REGIMES } from '../../src/lib/scales.js';
import { dryness, ghatsZone, northEastHills } from './fields.js';
import { apportion, clamp, degDistance, gauss, logistic } from './math.js';

// Score of the general "active or normal inland" regime, which wins wherever nothing else applies.
const INLAND_SCORE = 4;
// Coastal regime applies within about this distance of the sea, degrees.
const COASTAL_REACH = 0.55;

function regimeScores({ centroid: [lon, lat], coastDistance }, systems) {
  const orographic = Math.max(ghatsZone(lon, lat), northEastHills(lon, lat));
  const { depression, wd } = systems;
  const depressionStrength = clamp(depression.amp / 150, 0, 1);
  const wdActivity = clamp(wd.amp / 30, 0.55, 1);
  return {
    depression: 7.2 * depressionStrength * gauss(degDistance(lon, lat, depression.lon, depression.lat), 2.7),
    orographic: 7.2 * orographic,
    coastal: 6.2 * logistic((COASTAL_REACH - coastDistance) / 0.12) * (1 - orographic),
    wd: 6.8 * wdActivity * logistic((lat - 29.6) / 0.35) * logistic((81 - lon) / 0.35),
    inland: INLAND_SCORE,
    break: 7 * dryness(lon, lat),
  };
}

/** Regime probabilities in hundredths that sum to exactly 1; calls soften with lead day. */
export function regimeWeights(place, systems, lead) {
  const scores = regimeScores(place, systems);
  const sharpness = 1 - 0.1 * (lead - 1);
  const exps = REGIMES.map(({ id }) => Math.exp(sharpness * scores[id]));
  const total = exps.reduce((a, b) => a + b, 0);
  const hundredths = apportion(exps.map((e) => (100 * e) / total), 100);
  return Object.fromEntries(REGIMES.map(({ id }, i) => [id, hundredths[i] / 100]));
}

export const mainRegime = (weights) =>
  REGIMES.reduce((best, { id }) => (weights[id] > weights[best] ? id : best), REGIMES[0].id);
