// Monsoon 2024 phase by day: observed up to the run date, forecast for the five lead days,
// unknown afterwards.

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

const likeliest = (phase) => Object.keys(phase).reduce((best, key) => (phase[key] > phase[best] ? key : best));

/** `summaries` are the per-lead national summaries, whose phase probabilities give the forecast days. */
export function seasonTimeline(summaries) {
  const observed = OBSERVED_SPELLS.flatMap(([phase, days]) => Array(days).fill(phase));
  const today = new Date(RUN.init).toISOString().slice(0, 10);
  const todayIndex = (Date.parse(today) - SEASON_START) / DAY;
  if (observed.length !== todayIndex + 1) throw new Error('Observed spells must end on the run date');

  const days = [];
  for (let time = SEASON_START, i = 0; time <= SEASON_END; time += DAY, i++) {
    const forecastIndex = i - observed.length;
    const isForecast = forecastIndex >= 0 && forecastIndex < summaries.length;
    days.push({
      date: new Date(time).toISOString().slice(0, 10),
      phase: observed[i] ?? (isForecast ? likeliest(summaries[forecastIndex].phase) : null),
      forecast: isForecast,
      today: i === todayIndex,
    });
  }
  return { season: 'Monsoon 2024', start: days[0].date, end: days.at(-1).date, today, days };
}
