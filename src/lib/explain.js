// Plain-language explanations generated from the forecast data.

import { capitalize, joinAnd, lowerFirst } from './format.js';
import { likeliestPhase, topRegime } from './regimes.js';

// Corrections smaller than this (mm) are described as leaving the raw amount almost unchanged.
const NEGLIGIBLE_MM = 3;

function slopes([lon, lat]) {
  if (lat < 21.5 && lon < 78) return 'over the Western Ghats';
  if (lon > 89 && lat > 22) return 'over the north-eastern hills';
  return 'on the local hills';
}

// How each driver reads when it pushes the amount up or down.
const DRIVER_PHRASES = {
  'Upslope moisture flux': {
    up: ({ centroid }) => `strong upslope moisture flux ${slopes(centroid)}`,
    down: () => 'weak upslope flow',
  },
  'Regime expert': {
    up: ({ expert }) => `the ${expert} expert's extra rain`,
    down: ({ expert }) => `the ${expert} expert trimming the raw amount`,
  },
  'Nearby rain in raw forecast': {
    up: () => 'heavy rain the raw model put just next door',
    down: () => 'rain the raw model put here that belongs nearby',
  },
  'Precipitable water': {
    up: () => 'unusually moist air',
    down: () => 'drier air than usual',
  },
  'Climatology for the date': {
    up: () => 'a wet climatology for the date',
    down: () => 'spurious drizzle in the raw model',
  },
};

/**
 * One or two sentences on why Varsha changed the raw forecast for a district-day: its two
 * largest drivers in the direction of the change, then the regime's typical raw-model error.
 */
export function explainCorrection(district, day) {
  const change = day.corrected - day.raw;
  const regime = topRegime(day.p);
  const inRegime = `In the ${lowerFirst(regime.label)} regime`;

  if (Math.abs(change) < NEGLIGIBLE_MM) {
    return `${inRegime} the raw model is close to right here, so Varsha left the amount almost unchanged.`;
  }

  const direction = change > 0 ? 'up' : 'down';
  const context = { centroid: district.centroid, expert: lowerFirst(regime.short) };
  const causes = day.drivers
    .filter(({ mm }) => Math.sign(mm) === Math.sign(change))
    .sort((a, b) => Math.abs(b.mm) - Math.abs(a.mm))
    .slice(0, 2)
    .map(({ name }) => DRIVER_PHRASES[name][direction](context));

  const verdict =
    change > 0
      ? `${inRegime} the raw model runs too dry here, so Varsha raised the amount by ${change} mm.`
      : `${inRegime} the raw model runs too wet here, so Varsha lowered the amount by ${-change} mm.`;
  return causes.length ? `${capitalize(joinAnd(causes))}. ${verdict}` : verdict;
}

/** One sentence on what the regime engine looked at, from a national summary in meta.json. */
export function explainSaliency(summary) {
  const phase = likeliestPhase(summary.phase);
  const systems = [...summary.systems]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2)
    .map(({ label, location }) => `the ${lowerFirst(label)} (${location})`);
  return `${capitalize(joinAnd(systems))} weighed most in the ${phase} monsoon call and the regime map for Day ${summary.lead}.`;
}
