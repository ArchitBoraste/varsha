// National summary per lead day: monsoon phase, detected systems, warnings, exposure and regimes.

import { districtCounts } from '../../src/lib/summary.js';
import { climatology } from './fields.js';
import { logistic, round } from './math.js';
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

export function nationalSummary(forecast, lead) {
  return {
    lead,
    phase: monsoonPhase(Object.values(forecast), lead),
    systems: DETECTED_SYSTEMS[lead - 1],
    ...districtCounts(forecast, lead),
  };
}
