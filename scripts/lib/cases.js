// Past events for the case replay: each day's Day 1 forecast (raw and corrected) and what fell.

import { forecastDay } from './forecast.js';
import {
  GFS_BIAS,
  GFS_BIAS_2023,
  himachalSystems,
  rainDayEnd,
  shortDate,
  wayanadSystems,
} from './scenario.js';

const DAY = 86_400_000;

const CASES = [
  {
    id: 'wayanad-2024',
    title: 'Wayanad landslide rains',
    region: 'Kerala',
    dates: '29–31 Jul 2024',
    regime: 'orographic',
    focusDistrict: 'wayanad-kerala',
    focusStates: ['Kerala'],
    bounds: [[73, 8], [79, 15.5]],
    firstRun: '2024-07-28T00:00:00Z',
    // Valid days relative to Day 1 of the main run: the replay starts the day before.
    dayOffset: -1,
    systems: wayanadSystems,
    bias: GFS_BIAS,
  },
  {
    id: 'himachal-2023',
    title: 'Himachal and Delhi downpour',
    region: 'North-west India',
    dates: '8–10 Jul 2023',
    regime: 'wd',
    focusDistrict: 'mandi-himachal-pradesh',
    focusStates: ['Himachal Pradesh', 'Punjab', 'Haryana', 'Chandigarh', 'Delhi'],
    bounds: [[73.5, 27.5], [80, 34]],
    firstRun: '2023-07-07T00:00:00Z',
    dayOffset: 0,
    systems: himachalSystems,
    bias: GFS_BIAS_2023,
  },
];

const CASE_DAYS = 3;

export function buildCases(places) {
  return {
    cases: CASES.map(({ firstRun, dayOffset, systems, bias, ...details }) => ({
      ...details,
      days: Array.from({ length: CASE_DAYS }, (_, day) => {
        const init = new Date(Date.parse(firstRun) + day * DAY);
        const end = rainDayEnd(init, 1);
        const t = day + dayOffset;
        return {
          date: end.toISOString().slice(0, 10),
          label: shortDate(end),
          run: `${shortDate(init)} ${init.getUTCFullYear()}, 00 UTC`,
          lead: 1,
          values: Object.fromEntries(
            places.map((place) => {
              const { raw, corrected, observed } = forecastDay(place, systems(t), bias, 1, t);
              return [place.id, { raw, corrected, observed }];
            }),
          ),
        };
      }),
    })),
  };
}
