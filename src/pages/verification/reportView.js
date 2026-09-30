// Views of verification.json shared by the Verification lab and its printed report.

import { lowerFirst } from '../../lib/format.js';

export const INITIAL_FILTERS = { season: 'monsoon-2024', lead: 1, regime: 'all', region: 'all' };

/**
 * The verification scores for a set of filters: the regime × region `entry` (all lead days), the
 * filtered lead `day`, their labels and the note for regimes a region never sees.
 */
export function filteredScores(report, { lead, regime, region }) {
  const entry = report.scores[region][regime];
  const regimeLabel = report.regimes.find(({ id }) => id === regime).label;
  const regionLabel = report.regions.find(({ id }) => id === region).label;
  return {
    entry,
    day: entry?.leads[lead - 1],
    regimeLabel,
    regionLabel,
    // Some regions never see some regimes (no western disturbances in the south peninsula).
    missing: `No ${lowerFirst(regimeLabel)} days in ${regionLabel}`,
  };
}

/** Filters from a print address (?lead=&regime=&region=), falling back to the defaults. */
export function filtersFromParams(report, params) {
  const lead = Number(params.get('lead'));
  const pick = (value, options, fallback) => (options.some(({ id }) => id === value) ? value : fallback);
  return {
    ...INITIAL_FILTERS,
    lead: report.leads.includes(lead) ? lead : INITIAL_FILTERS.lead,
    regime: pick(params.get('regime'), report.regimes, INITIAL_FILTERS.regime),
    region: pick(params.get('region'), report.regions, INITIAL_FILTERS.region),
  };
}

/** A fixed ETS axis for every filter, so bars can be compared as the filters change. */
export function ladderMax(scores) {
  let max = 0;
  for (const byRegime of Object.values(scores)) {
    for (const entry of Object.values(byRegime)) {
      for (const { ets64 } of entry?.leads ?? []) max = Math.max(max, ets64.varsha + ets64.ci);
    }
  }
  return Math.ceil(max * 10) / 10;
}
