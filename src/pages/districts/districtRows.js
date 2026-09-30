// Rows, columns, filters and sorting for the district table and its CSV export.

import { topRegime } from '../../lib/regimes.js';

const WARNING_RANK = { red: 3, orange: 2, yellow: 1, green: 0 };

/** One row per district for a lead day. */
export const districtRows = (forecast, lead) =>
  Object.entries(forecast).map(([id, district]) => {
    const day = district.days[lead - 1];
    return {
      id,
      name: district.name,
      state: district.state,
      corrected: day.corrected,
      raw: day.raw,
      range: day.range,
      regime: topRegime(day.p),
      probs: day.probs,
      warning: day.warning,
      override: day.override,
    };
  });

/**
 * Table columns. `width` follows the mockup's grid; `firstSort` is the direction of a
 * column's first click (text ascending, numbers descending).
 */
export const COLUMNS = [
  { key: 'name', label: 'District', width: '14.6%', sortValue: (row) => row.name, firstSort: 'ascending' },
  { key: 'state', label: 'State', width: '11.2%', sortValue: (row) => row.state, firstSort: 'ascending' },
  { key: 'corrected', label: 'Varsha mm', width: '9%', sortValue: (row) => row.corrected },
  { key: 'raw', label: 'Raw mm', width: '7.9%', sortValue: (row) => row.raw },
  { key: 'regime', label: 'Regime', width: '15.7%', sortValue: (row) => row.regime.label, firstSort: 'ascending' },
  { key: 'p64', label: '≥ 64.5', width: '7.9%', sortValue: (row) => row.probs.p64 },
  { key: 'p115', label: '≥ 115.6', width: '7.9%', sortValue: (row) => row.probs.p115 },
  { key: 'p204', label: '≥ 204.5', width: '7.9%', sortValue: (row) => row.probs.p204 },
  { key: 'warning', label: 'Warning', width: '10.1%', sortValue: (row) => WARNING_RANK[row.warning] },
];

export const DEFAULT_SORT = { key: 'p115', direction: 'descending' };

/** Comparator for a sort; ties fall back to corrected rainfall, then name. */
export function compareRows({ key, direction }) {
  const { sortValue } = COLUMNS.find((column) => column.key === key);
  const factor = direction === 'ascending' ? 1 : -1;
  return (a, b) => {
    const x = sortValue(a);
    const y = sortValue(b);
    const primary = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return factor * primary || b.corrected - a.corrected || a.name.localeCompare(b.name);
  };
}

export const WARNING_FILTERS = [
  { id: 'all', label: 'All', levels: ['red', 'orange', 'yellow', 'green'] },
  { id: 'red', label: 'Red', levels: ['red'] },
  { id: 'orange', label: 'Orange and red', levels: ['red', 'orange'] },
  { id: 'yellow', label: 'Yellow and above', levels: ['red', 'orange', 'yellow'] },
];

/** CSV columns for the export of a lead day. */
export const csvColumns = (leadInfo) => [
  { header: 'district_id', value: (row) => row.id },
  { header: 'district', value: (row) => row.name },
  { header: 'state', value: (row) => row.state },
  { header: 'lead_day', value: () => leadInfo.lead },
  { header: 'valid_date', value: () => leadInfo.date },
  { header: 'varsha_mm', value: (row) => row.corrected },
  { header: 'likely_low_mm', value: (row) => row.range[0] },
  { header: 'likely_high_mm', value: (row) => row.range[1] },
  { header: 'raw_gfs_mm', value: (row) => row.raw },
  { header: 'regime', value: (row) => row.regime.label },
  { header: 'regime_share', value: (row) => row.regime.share },
  { header: 'chance_ge_64_5_mm', value: (row) => row.probs.p64 },
  { header: 'chance_ge_115_6_mm', value: (row) => row.probs.p115 },
  { header: 'chance_ge_204_5_mm', value: (row) => row.probs.p204 },
  { header: 'warning', value: (row) => row.warning },
  { header: 'override_reason', value: (row) => row.override?.reason ?? '' },
];
