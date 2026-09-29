// Regime helpers shared by the UI and the data generator.

import { mix } from './color.js';
import { REGIMES } from './scales.js';

// Below this top share a district sits between regimes, and its map fill is paler.
const CLEAR_SHARE = 0.55;

/** Regimes with their `share` of the blend, largest first (ties keep blend order). */
export const rankRegimes = (weights) =>
  REGIMES.map((regime) => ({ ...regime, share: weights[regime.id] ?? 0 })).sort((a, b) => b.share - a.share);

export const topRegime = (weights) => rankRegimes(weights)[0];

/** Map fill for a regime mix: the top regime's colour, lightened for transition districts. */
export function regimeFill(weights) {
  const { color, share } = topRegime(weights);
  if (share >= CLEAR_SHARE) return color;
  return mix(color, '#FFFFFF', 0.3 + 0.4 * Math.min(1, (CLEAR_SHARE - share) / 0.3));
}

/** Pale background for a chip labelled with a regime. */
export const regimeTint = (regime) => mix(regime.color, '#FFFFFF', 0.86);

/** The most likely monsoon phase from { active, normal, break } probabilities. */
export const likeliestPhase = (phase) =>
  Object.keys(phase).reduce((best, key) => (phase[key] > phase[best] ? key : best));
