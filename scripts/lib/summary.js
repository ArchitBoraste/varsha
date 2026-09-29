// National summary per lead day: monsoon phase, detected systems, warnings, exposure and regimes.

import { REGIMES } from '../../src/lib/scales.js';
import { climatology } from './fields.js';
import { logistic, round } from './math.js';
import { mainRegime } from './regimes.js';
import { DETECTED_SYSTEMS } from './scenario.js';

// Core monsoon zone of Rajeevan et al. (2010).
const CORE_ZONE = { west: 65, east: 88, south: 18, north: 28 };
// Day-to-day standard deviation of the core-zone mean rainfall in this synthetic climate, mm/day.
const CORE_SD = 10;

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

const inCoreZone = ([lon, lat]) =>
  lon >= CORE_ZONE.west && lon <= CORE_ZONE.east && lat >= CORE_ZONE.south && lat <= CORE_ZONE.north;

/**
 * Active above +1 and break below -1 standardised anomaly of core-zone rainfall. The forecast
 * anomaly is uncertain, more so at longer leads, which turns the criterion into probabilities.
 */
function monsoonPhase(districts, lead) {
  const core = districts.filter((district) => inCoreZone(district.centroid));
  const anomaly =
    (mean(core.map((d) => d.days[lead - 1].corrected)) - mean(core.map((d) => climatology(...d.centroid)))) /
    CORE_SD;
  const uncertainty = 0.5 + 0.12 * (lead - 1);
  const active = round(logistic((anomaly - 1) / uncertainty), 2);
  const brk = round(logistic((-1 - anomaly) / uncertainty), 2);
  return { active, normal: round(1 - active - brk, 2), break: brk };
}

const isWarned = (warning) => warning === 'red' || warning === 'orange';

export function nationalSummary(forecast, lead) {
  const districts = Object.values(forecast);
  const warnings = { red: 0, orange: 0, yellow: 0, green: 0 };
  const exposure = { population: 0, landslideProne: 0, dams: 0 };
  const regimes = Object.fromEntries(REGIMES.map(({ id }) => [id, 0]));

  for (const district of districts) {
    const day = district.days[lead - 1];
    warnings[day.warning] += 1;
    regimes[mainRegime(day.p)] += 1;
    if (isWarned(day.warning)) {
      exposure.population += district.exposure.population;
      exposure.landslideProne += district.exposure.landslideProne ? 1 : 0;
      exposure.dams += district.exposure.dams.length;
    }
  }

  return {
    lead,
    phase: monsoonPhase(districts, lead),
    systems: DETECTED_SYSTEMS[lead - 1],
    warnings,
    exposure,
    regimes,
  };
}
