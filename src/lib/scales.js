// Colour scales and categories shared by the UI and the data generator.

/** IMD 24-hour rainfall categories, mm. */
export const RAIN_CATEGORIES = [
  { id: 'very-light', label: 'Very light', range: '< 2.5', min: 0, color: '#E4E9E3' },
  { id: 'light', label: 'Light', range: '2.5–15.5', min: 2.5, color: '#C7E1EE' },
  { id: 'moderate', label: 'Moderate', range: '15.6–64.4', min: 15.6, color: '#86BCE0' },
  { id: 'heavy', label: 'Heavy', range: '64.5–115.5', min: 64.5, color: '#3E7FC6' },
  { id: 'very-heavy', label: 'Very heavy', range: '115.6–204.4', min: 115.6, color: '#5A3DAE' },
  { id: 'extremely-heavy', label: 'Extremely heavy', range: '≥ 204.5', min: 204.5, color: '#A8217A' },
];

export function rainCategory(mm) {
  return RAIN_CATEGORIES.findLast((category) => mm >= category.min) ?? RAIN_CATEGORIES[0];
}

export const rainColor = (mm) => rainCategory(mm).color;

/** Bands for the chance (0–1) of reaching a heavy-rain threshold. */
export const PROB_BANDS = [
  { min: 0, range: '< 10%', color: '#E9ECEE' },
  { min: 0.1, range: '10–30%', color: '#F5D9AE' },
  { min: 0.3, range: '30–50%', color: '#F0AE66' },
  { min: 0.5, range: '50–70%', color: '#E27A3E' },
  { min: 0.7, range: '70–90%', color: '#C4443A' },
  { min: 0.9, range: '≥ 90%', color: '#8C1E3C' },
];

export const probColor = (p) => (PROB_BANDS.findLast((band) => p >= band.min) ?? PROB_BANDS[0]).color;

/** The six rainfall regimes, in blend order. */
export const REGIMES = [
  { id: 'depression', label: 'Depression-embedded', color: '#6A4FC9' },
  { id: 'orographic', label: 'Orographic', color: '#1E8A6E' },
  { id: 'coastal', label: 'Coastal', color: '#48A9D8' },
  { id: 'wd', label: 'WD interaction', color: '#E1A23A' },
  { id: 'inland', label: 'Active or normal inland', color: '#BCD2E3' },
  { id: 'break', label: 'Break', color: '#DDD4C2' },
];

export const REGIME_BY_ID = Object.fromEntries(REGIMES.map((regime) => [regime.id, regime]));

/** IMD impact-based warning levels, most severe first. */
export const WARNINGS = {
  red: { id: 'red', label: 'Red', action: 'Take action', color: '#B03A2E', text: '#FFFFFF' },
  orange: { id: 'orange', label: 'Orange', action: 'Be prepared', color: '#F0A04B', text: '#13202B' },
  yellow: { id: 'yellow', label: 'Yellow', action: 'Be aware', color: '#F2D35B', text: '#13202B' },
  green: { id: 'green', label: 'Green', action: 'No warning', color: '#DCEBDD', text: '#13202B' },
};
