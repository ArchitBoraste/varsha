// District counts for a lead day's national summary: warning levels, what is exposed in red and
// orange districts, and districts by main regime. Shared by the data generator and the UI, which
// recounts them when a forecaster overrides a regime.

import { topRegime } from './regimes.js';
import { REGIMES } from './scales.js';

const isWarned = (warning) => warning === 'red' || warning === 'orange';

export function districtCounts(forecast, lead) {
  const warnings = { red: 0, orange: 0, yellow: 0, green: 0 };
  const exposure = { population: 0, landslideProne: 0, dams: 0 };
  const regimes = Object.fromEntries(REGIMES.map(({ id }) => [id, 0]));

  for (const district of Object.values(forecast)) {
    const day = district.days[lead - 1];
    warnings[day.warning] += 1;
    regimes[topRegime(day.p).id] += 1;
    if (isWarned(day.warning)) {
      exposure.population += district.exposure.population;
      exposure.landslideProne += district.exposure.landslideProne ? 1 : 0;
      exposure.dams += district.exposure.dams.length;
    }
  }
  return { warnings, exposure, regimes };
}
