// Forecast scores computed from the demo data, in the browser and by the Ask Varsha server.

import { THRESHOLDS } from './risk.js';

const HEAVY_MM = THRESHOLDS[0].mm;
export const VERY_HEAVY_MM = THRESHOLDS[1].mm;

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Scores for a run of daily forecasts against observations: mean absolute error and how many
 * observed heavy-rain days (≥ 64.5 mm) each forecast also put at heavy or above.
 */
export function historyScores({ observed, varsha, raw }) {
  const heavy = observed.map((mm) => mm >= HEAVY_MM);
  const mae = (forecast) => mean(forecast.map((mm, i) => Math.abs(mm - observed[i])));
  const caught = (forecast) => forecast.filter((mm, i) => heavy[i] && mm >= HEAVY_MM).length;
  return {
    mae: { varsha: mae(varsha), raw: mae(raw) },
    heavyDays: heavy.filter(Boolean).length,
    caught: { varsha: caught(varsha), raw: caught(raw) },
  };
}

/** A case-study day in a set of districts: very heavy rain observed, caught and falsely forecast. */
export function caseDayScores(day, ids) {
  const scores = { observed: 0, caught: { varsha: 0, raw: 0 }, falseAlarms: { varsha: 0, raw: 0 } };
  for (const id of ids) {
    const { raw, corrected, observed } = day.values[id];
    const tally = observed >= VERY_HEAVY_MM ? scores.caught : scores.falseAlarms;
    if (observed >= VERY_HEAVY_MM) scores.observed += 1;
    if (corrected >= VERY_HEAVY_MM) tally.varsha += 1;
    if (raw >= VERY_HEAVY_MM) tally.raw += 1;
  }
  return scores;
}
