import { REGIMES } from './scales.js';

/**
 * Corrected rainfall in whole mm: each regime expert weighted by its regime probability.
 * The generator stores `corrected = blend(p, experts)`, so the UI can re-blend with
 * overridden weights and reproduce every stored value exactly.
 */
export function blend(weights, experts) {
  const total = REGIMES.reduce((sum, { id }) => sum + (weights[id] ?? 0) * experts[id], 0);
  return Math.round(total);
}
