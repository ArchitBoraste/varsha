// Likely range, heavy-rain probabilities and warning level for a corrected amount.
// Shared by the data generator and the UI, which recomputes them when a forecaster overrides a regime.

/** IMD heavy-rain thresholds, mm in 24 h. */
export const THRESHOLDS = [
  { key: 'p64', mm: 64.5, label: 'Heavy' },
  { key: 'p115', mm: 115.6, label: 'Very heavy' },
  { key: 'p204', mm: 204.5, label: 'Extremely heavy' },
];

// Calibrated probabilities never claim certainty.
const MAX_PROB = 0.99;

const round2 = (x) => Math.round(x * 100) / 100;

/** Half-width of the likely range, mm: grows with the amount and with lead day. */
export function spread(mm, lead) {
  return 4 + mm * (0.2 + 0.08 * (lead - 1));
}

export function likelyRange(mm, lead) {
  const half = spread(mm, lead);
  return [Math.max(0, Math.round(mm - half)), Math.round(mm + half)];
}

/** Chance of reaching each threshold: logistic in the corrected amount, scaled by its spread. */
export function exceedanceProbs(mm, lead) {
  const scale = 0.8 * spread(mm, lead);
  const probs = {};
  let ceiling = MAX_PROB;
  for (const { key, mm: threshold } of THRESHOLDS) {
    // The ceiling keeps p64 >= p115 >= p204 even after rounding.
    probs[key] = Math.min(ceiling, round2(1 / (1 + Math.exp((threshold - mm) / scale))));
    ceiling = probs[key];
  }
  return probs;
}

export function warningLevel({ p64, p115, p204 }) {
  if (p204 >= 0.6) return 'red';
  if (p115 >= 0.5) return 'orange';
  if (p64 >= 0.5) return 'yellow';
  return 'green';
}

/** The warning a forecast of `mm` at `lead` days would carry. */
export const forecastWarning = (mm, lead) => warningLevel(exceedanceProbs(mm, lead));

const OBSERVED_LEVELS = { p64: 'yellow', p115: 'orange', p204: 'red' };

/** The warning colour an observed amount matches: the highest IMD threshold it reached. */
export function observedWarning(mm) {
  const reached = THRESHOLDS.findLast((threshold) => mm >= threshold.mm);
  return reached ? OBSERVED_LEVELS[reached.key] : 'green';
}
