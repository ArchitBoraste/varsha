// Monsoon 2024 phase by day: observed up to the run date, forecast for the five lead days,
// unknown afterwards.

import { likeliestPhase } from '../../src/lib/regimes.js';
import { RUN } from './scenario.js';

const SEASON_START = Date.UTC(2024, 5, 1);
const SEASON_END = Date.UTC(2024, 8, 30);
const DAY = 86_400_000;

// Observed spells from 1 June up to and including the run date, as [phase, days].
const OBSERVED_SPELLS = [
  ['normal', 12],
  ['active', 6],
  ['normal', 8],
  ['break', 5],
  ['normal', 9],
  ['active', 7],
  ['normal', 5],
  ['active', 7],
];

const OBSERVED = OBSERVED_SPELLS.flatMap(([phase, days]) => Array(days).fill(phase));

/** Observed phase on an ISO date between 1 June and the run date. */
export const observedPhaseOn = (isoDate) => OBSERVED[(Date.parse(isoDate) - SEASON_START) / DAY];

/** `summaries` are the per-lead national summaries, whose phase probabilities give the forecast days. */
export function seasonTimeline(summaries) {
  const today = new Date(RUN.init).toISOString().slice(0, 10);
  const todayIndex = (Date.parse(today) - SEASON_START) / DAY;
  if (OBSERVED.length !== todayIndex + 1) throw new Error('Observed spells must end on the run date');

  const days = [];
  for (let time = SEASON_START, i = 0; time <= SEASON_END; time += DAY, i++) {
    const forecastIndex = i - OBSERVED.length;
    const isForecast = forecastIndex >= 0 && forecastIndex < summaries.length;
    days.push({
      date: new Date(time).toISOString().slice(0, 10),
      phase: OBSERVED[i] ?? (isForecast ? likeliestPhase(summaries[forecastIndex].phase) : null),
      forecast: isForecast,
      today: i === todayIndex,
    });
  }
  return { season: 'Monsoon 2024', start: days[0].date, end: days.at(-1).date, today, days };
}
