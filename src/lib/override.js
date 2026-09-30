// Forecaster regime overrides: a district-day recomputed with all of its weight on one regime.

import { blend } from './blend.js';
import { exceedanceProbs, likelyRange, warningLevel } from './risk.js';
import { REGIMES, REGIME_BY_ID } from './scales.js';

export const OVERRIDE_AUTHOR = 'Duty forecaster';

const oneHot = (regimeId) => Object.fromEntries(REGIMES.map(({ id }) => [id, id === regimeId ? 1 : 0]));

/**
 * The district-day as if the regime engine had put all its weight on `regimeId`: the corrected
 * amount re-blended from the stored experts, and the range, chances and warning recomputed.
 */
export function withRegime(day, regimeId) {
  const p = oneHot(regimeId);
  const corrected = blend(p, day.experts);
  const probs = exceedanceProbs(corrected, day.lead);
  const shift = corrected - day.corrected;
  return {
    ...day,
    p,
    corrected,
    range: likelyRange(corrected, day.lead),
    probs,
    warning: warningLevel(probs),
    // The change of expert explains the whole change, so the drivers still add up to the correction.
    drivers: day.drivers.map((driver) => (driver.name === 'Regime expert' ? { ...driver, mm: driver.mm + shift } : driver)),
  };
}

/** `forecast` with every override applied; the same object when there are none. */
export function applyOverrides(forecast, overrides) {
  const ids = Object.keys(overrides).filter((id) => forecast[id]);
  if (!ids.length) return forecast;
  const result = { ...forecast };
  for (const id of ids) {
    const district = forecast[id];
    result[id] = {
      ...district,
      days: district.days.map((day) => {
        const override = overrides[id][day.lead];
        return override ? { ...withRegime(day, override.regime), overridden: true, override } : day;
      }),
    };
  }
  return result;
}

/** Overrides as a flat list, newest first. */
export const overrideList = (overrides) =>
  Object.entries(overrides)
    .flatMap(([districtId, byLead]) =>
      Object.entries(byLead).map(([lead, override]) => ({ districtId, lead: Number(lead), ...override })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));

const isOverride = (value) =>
  value !== null &&
  typeof value === 'object' &&
  value.regime in REGIME_BY_ID &&
  typeof value.reason === 'string' &&
  typeof value.by === 'string' &&
  typeof value.at === 'string';

/** Keeps only well-formed overrides from untrusted (stored) data. */
export function sanitizeOverrides(value) {
  if (value === null || typeof value !== 'object') return {};
  const clean = {};
  for (const [districtId, byLead] of Object.entries(value)) {
    if (byLead === null || typeof byLead !== 'object') continue;
    const valid = Object.entries(byLead).filter(([lead, override]) => /^[1-5]$/.test(lead) && isOverride(override));
    if (valid.length) clean[districtId] = Object.fromEntries(valid);
  }
  return clean;
}
