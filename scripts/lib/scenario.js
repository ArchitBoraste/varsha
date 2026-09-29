// The demo scenario: the 00 UTC 29 Jul 2024 GFS run ahead of the Wayanad landslides, and a
// north-west India western-disturbance case from July 2023. Weather systems are described per
// valid day `t` (days after Day 1; t = 0 is the IMD rain day ending 08:30 IST on 30 Jul 2024).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// The IMD rain day ends at 08:30 IST, i.e. 03 UTC.
const RAIN_DAY_END_UTC = 3 * HOUR;

const LEAD_DAYS = [1, 2, 3, 4, 5];
export const OBSERVED_LEADS = 3;

export const shortDate = (date) => `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;

/** ISO timestamp in Indian Standard Time, e.g. 2024-07-30T08:30:00+05:30. */
const toIst = (date) => `${new Date(date.getTime() + 5.5 * HOUR).toISOString().slice(0, 19)}+05:30`;

/** End of the IMD rain day forecast at `lead` days by the run initialised at `init`. */
export const rainDayEnd = (init, lead) => new Date(init.getTime() + lead * DAY + RAIN_DAY_END_UTC);

/** A 00 UTC model run initialised at `init` (a Date). */
export function describeRun(init, model = 'GFS 0.25°') {
  const iso = init.toISOString();
  return {
    id: `${iso.slice(0, 13)}Z`,
    model,
    cycle: '00 UTC',
    init: `${iso.slice(0, 19)}Z`,
    label: `${shortDate(init)}, 00 UTC`,
    longLabel: `00 UTC ${shortDate(init)} ${init.getUTCFullYear()}`,
  };
}

export const RUN = describeRun(new Date('2024-07-29T00:00:00Z'));

export const LEADS = LEAD_DAYS.map((lead) => {
  const end = rainDayEnd(new Date(RUN.init), lead);
  return {
    lead,
    date: end.toISOString().slice(0, 10),
    label: shortDate(end),
    period: `24 h to 08:30 IST, ${shortDate(end)}`,
    validFrom: toIst(new Date(end.getTime() - DAY)),
    validTo: toIst(end),
  };
});

/** How the raw GFS forecast misrepresents each system: the errors the regime experts learn. */
export const GFS_BIAS = {
  drizzle: 6, // mm of spurious light rain everywhere
  ghats: 0.55, // share of Western Ghats orographic rain captured
  wayanad: 0.3, // share of the Wayanad extreme captured
  northEast: 0.7, // share of north-east hill rain captured
  wd: 0.75, // share of western-disturbance interaction rain captured
  depressionShift: 1, // degrees east of the true position
  depressionAmp: 0.8,
};

// Western disturbance over Jammu and Kashmir, drifting east and fading (t = -1 … 4).
const WD_TRACK = [
  { lon: 74.5, lat: 34.0, amp: 20 },
  { lon: 75.4, lat: 33.4, amp: 32 },
  { lon: 76.9, lat: 32.4, amp: 30 },
  { lon: 78.6, lat: 31.2, amp: 18 },
  { lon: 80.2, lat: 30.4, amp: 8 },
  { lon: 81.5, lat: 29.9, amp: 4 },
];

export function wayanadSystems(t) {
  const buildUp = t < 0; // the rain day before Day 1, used by the case replay
  return {
    ghats: { amp: buildUp ? 150 : 170 * 0.85 ** t },
    wayanad: { lon: 76.1, lat: 11.65, amp: buildUp ? 95 : 260 * 0.5 ** t },
    depression: { lon: 84.0 - t, lat: 20.6 + 0.3 * t, amp: buildUp ? 100 : 150 * (1 - 0.07 * t) },
    northEast: { lon: 91.6, lat: 25.4, amp: 110 * 0.95 ** t },
    foothills: { lon: 78.6, lat: 30.4, amp: 45 },
    wd: WD_TRACK[t + 1],
  };
}

const depression = (location, confidence, label = 'Depression') =>
  ({ type: 'depression', label, location, confidence, regime: 'depression' });
const offshoreTrough = (location, confidence) =>
  ({ type: 'offshore-trough', label: 'Offshore trough', location, confidence, regime: 'coastal' });
const westernDisturbance = (location, confidence) =>
  ({ type: 'western-disturbance', label: 'Western disturbance', location, confidence, regime: 'wd' });

/** What the regime engine's system tracker reports for each lead day. */
export const DETECTED_SYSTEMS = [
  [
    depression('south Odisha, moving WNW', 0.94),
    offshoreTrough('Konkan to Kerala', 0.81),
    westernDisturbance('over Jammu and Kashmir', 0.63),
  ],
  [
    depression('west Odisha, moving WNW', 0.91),
    offshoreTrough('Konkan to Kerala', 0.77),
    westernDisturbance('over Himachal Pradesh', 0.58),
  ],
  [
    depression('central Chhattisgarh, moving WNW', 0.86),
    offshoreTrough('Goa to Kerala', 0.7),
    westernDisturbance('over Uttarakhand, moving away', 0.44),
  ],
  [depression('west Chhattisgarh, moving WNW', 0.78), offshoreTrough('Goa to Kerala', 0.61)],
  [depression('east Madhya Pradesh, weakening', 0.69, 'Well-marked low'), offshoreTrough('coastal Karnataka to Kerala', 0.52)],
];

// Monsoon lows that crossed central India in the month before the run: [first t, last t, start
// position, peak rain]. Each moves 1° west and 0.3° north per day, like the Day 1 depression.
const PAST_LOWS = [
  { from: -20, to: -15, lon: 87.5, lat: 20.8, amp: 95 },
  { from: -8, to: -2, lon: 88, lat: 21.2, amp: 85 },
];

const PHASE_STRENGTH = { active: 1.3, normal: 1, break: 0.35 };

/** Weather systems for a past day `t` (≤ -2) in the observed monsoon `phase`. */
export function pastSystems(t, phase) {
  const strength = PHASE_STRENGTH[phase];
  const wave = 1 + 0.2 * Math.sin(0.9 * t);
  const low = PAST_LOWS.find(({ from, to }) => t >= from && t <= to);
  const days = low ? t - low.from : 0;
  return {
    ghats: { amp: 60 * strength * wave },
    // Rain was already building over Wayanad in the last week before the landslides.
    wayanad: { lon: 76.1, lat: 11.65, amp: t >= -8 ? 45 * strength : 0 },
    depression: low
      ? { lon: low.lon - days, lat: low.lat + 0.3 * days, amp: low.amp }
      : { lon: 85, lat: 21, amp: 0 },
    // In a break the rain belt shifts to the Himalayan foothills and the north-east.
    northEast: { lon: 91.6, lat: 25.4, amp: phase === 'break' ? 90 : 45 * wave },
    foothills: { lon: 78.6, lat: 30.4, amp: phase === 'break' ? 70 : 35 },
    wd: { lon: 75.4, lat: 33.4, amp: t >= -26 && t <= -23 ? 25 : 4 },
  };
}

/** 8–10 Jul 2023: a western disturbance meets the monsoon over north-west India (t = 0 … 2). */
export function himachalSystems(t) {
  return {
    ghats: { amp: 70 },
    wayanad: { lon: 76.1, lat: 11.65, amp: 0 },
    depression: { lon: 87.5, lat: 22.5, amp: 0 },
    northEast: { lon: 91.6, lat: 25.4, amp: 60 },
    foothills: { lon: 77.0, lat: 31.3, amp: [115, 175, 85][t] },
    wd: { lon: 77.0, lat: 29.2, amp: [120, 95, 35][t] },
  };
}

// In July 2023 the model kept the interaction rain weak and too far into the mountains.
export const GFS_BIAS_2023 = { ...GFS_BIAS, wd: 0.5 };
