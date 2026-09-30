// The 30 days before the run (29 Jun–28 Jul 2024): what fell, and the Day 1 forecasts from raw
// GFS and from Varsha, for every district.

import { forecastDay } from './forecast.js';
import { GFS_BIAS_PAST, RUN, pastSystems, rainDayEnd } from './scenario.js';
import { observedPhaseOn } from './timeline.js';

const HISTORY_DAYS = 30;

export function buildHistory(places) {
  const init = new Date(RUN.init);
  // t is the valid day relative to Day 1 of the run; the history ends two days before it.
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const t = i - HISTORY_DAYS - 1;
    const date = rainDayEnd(init, t + 1).toISOString().slice(0, 10);
    return { t, date, systems: pastSystems(t, observedPhaseOn(date)) };
  });

  return {
    lead: 1,
    dates: days.map(({ date }) => date),
    districts: Object.fromEntries(
      places.map((place) => {
        const forecasts = days.map(({ t, systems }) => forecastDay(place, systems, GFS_BIAS_PAST, 1, t));
        return [
          place.id,
          {
            observed: forecasts.map((day) => day.observed),
            varsha: forecasts.map((day) => day.corrected),
            raw: forecasts.map((day) => day.raw),
          },
        ];
      }),
    ),
  };
}
