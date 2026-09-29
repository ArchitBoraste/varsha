// Verification report for the held-out 2024 monsoon. These are the design's target values: the
// brief presents them as targets until a scored season replaces them.

const LEAD_SCORES = [
  // lead, RMSE raw/Varsha, ETS≥64.5 raw/Varsha, POD≥115.6 raw/Varsha, FAR≥115.6 raw/Varsha
  [1, 14.8, 11.9, 0.21, 0.29, 0.34, 0.52, 0.61, 0.55],
  [2, 16.1, 13.2, 0.18, 0.25, 0.3, 0.46, 0.63, 0.58],
  [3, 17.5, 14.9, 0.15, 0.2, 0.26, 0.38, 0.66, 0.61],
  [4, 18.4, 16.3, 0.12, 0.15, 0.22, 0.3, 0.69, 0.65],
  [5, 19.0, 17.4, 0.1, 0.12, 0.19, 0.24, 0.72, 0.69],
];

const pair = (raw, varsha) => ({ raw, varsha });
const vsPersistence = (persistence, varsha) => ({ persistence, varsha });

const byLead = LEAD_SCORES.map(([lead, rmse0, rmse1, ets0, ets1, pod0, pod1, far0, far1]) => ({
  lead,
  rmse: pair(rmse0, rmse1),
  ets64: pair(ets0, ets1),
  pod115: pair(pod0, pod1),
  far115: pair(far0, far1),
}));

export const VERIFICATION = {
  season: 'Monsoon 2024 · held out',
  sample: { days: 122, gridCells: 4500, truth: 'IMD gridded rainfall, 0.25°' },
  headline: {
    lead: 1,
    rmse: { ...byLead[0].rmse, unit: 'mm/day', better: 'lower' },
    ets64: { ...byLead[0].ets64, better: 'higher' },
    pod115: { ...byLead[0].pod115, better: 'higher' },
    far115: { ...byLead[0].far115, better: 'lower' },
  },
  ladder: {
    metric: 'ETS at ≥ 64.5 mm',
    methods: [
      { id: 'raw', label: 'Raw GFS' },
      { id: 'global', label: 'One global correction' },
      { id: 'regimeQm', label: 'Regime-wise QM' },
      { id: 'varsha', label: 'Varsha' },
    ],
    regimes: [
      { regime: 'depression', label: 'Depression', raw: 0.24, global: 0.26, regimeQm: 0.3, varsha: 0.35 },
      { regime: 'orographic', label: 'Orographic', raw: 0.15, global: 0.14, regimeQm: 0.24, varsha: 0.31 },
      { regime: 'coastal', label: 'Coastal', raw: 0.2, global: 0.23, regimeQm: 0.26, varsha: 0.29 },
      { regime: 'wd', label: 'WD', raw: 0.12, global: 0.15, regimeQm: 0.16, varsha: 0.19 },
      { regime: 'inland', label: 'Active inland', raw: 0.22, global: 0.27, regimeQm: 0.28, varsha: 0.3 },
      { regime: 'break', label: 'Break', raw: 0.09, global: 0.13, regimeQm: 0.13, varsha: 0.14 },
    ],
  },
  reliability: {
    thresholdMm: 115.6,
    bins: [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    raw: [0.03, 0.08, 0.14, 0.2, 0.27, 0.35, 0.42, 0.5, 0.58, 0.66],
    varsha: [0.04, 0.14, 0.24, 0.33, 0.46, 0.55, 0.66, 0.72, 0.83, 0.93],
  },
  fss: {
    thresholdMm: 64.5,
    scalesKm: [25, 50, 100, 150, 250],
    raw: [0.38, 0.46, 0.57, 0.63, 0.7],
    varsha: [0.49, 0.58, 0.68, 0.74, 0.8],
    useful: 0.55,
  },
  byLead,
  // Regime classifier against observed labels, compared with persistence (tomorrow = today).
  regimeClassifier: [
    { lead: 1, accuracy: vsPersistence(0.74, 0.86), macroF1: vsPersistence(0.64, 0.78) },
    { lead: 2, accuracy: vsPersistence(0.63, 0.81), macroF1: vsPersistence(0.53, 0.72) },
    { lead: 3, accuracy: vsPersistence(0.55, 0.75), macroF1: vsPersistence(0.45, 0.65) },
    { lead: 4, accuracy: vsPersistence(0.49, 0.68), macroF1: vsPersistence(0.39, 0.58) },
    { lead: 5, accuracy: vsPersistence(0.45, 0.62), macroF1: vsPersistence(0.35, 0.52) },
  ],
};
