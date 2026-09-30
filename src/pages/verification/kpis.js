/** The headline scores: how each is named, which way is better and how it is shown. */
export const KPIS = [
  { key: 'rmse', name: () => 'RMSE', hint: 'mm/day, lower is better', better: 'lower', digits: 1, relative: true },
  { key: 'ets64', name: (t) => `ETS ≥ ${t.ets64} mm`, hint: 'higher is better', better: 'higher', digits: 2 },
  { key: 'pod115', name: (t) => `POD ≥ ${t.pod115} mm`, hint: 'hits caught', better: 'higher', digits: 2 },
  { key: 'far115', name: (t) => `FAR ≥ ${t.far115} mm`, hint: 'false alarms, lower is better', better: 'lower', digits: 2 },
];
