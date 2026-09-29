// Forecast scores computed in the browser.

import { THRESHOLDS } from './risk.js';

const HEAVY_MM = THRESHOLDS[0].mm;

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
