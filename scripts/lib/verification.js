// Verification report for the held-out 2024 monsoon, for every lead day × regime × region. The
// all-India, all-regime values are the design's targets (the brief presents them as targets until a
// scored season replaces them); every other combination is derived from them deterministically:
// Varsha always beats raw, the gains are largest in the orographic and depression regimes, skill
// falls with lead day, and smaller or noisier samples get wider error bars.

import { REGIMES } from '../../src/lib/scales.js';
import { clamp, hashString, round, seededRandom } from './math.js';

const SEED = 2024;
const LEADS = [1, 2, 3, 4, 5];
const ALL = 'all';
const SEASON_DAYS = 122;
const INDIA_CELLS = 4500;
const RELIABILITY_BINS = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
const FSS_SCALES_KM = [25, 50, 100, 150, 250];
const USEFUL_FSS = 0.55;

// All India, all regimes: [raw, Varsha] per lead day for RMSE (mm/day), ETS ≥ 64.5, POD and FAR ≥ 115.6.
const INDIA_BY_LEAD = [
  { rmse: [14.8, 11.9], ets64: [0.21, 0.29], pod115: [0.34, 0.52], far115: [0.61, 0.55] },
  { rmse: [16.1, 13.2], ets64: [0.18, 0.25], pod115: [0.3, 0.46], far115: [0.63, 0.58] },
  { rmse: [17.5, 14.9], ets64: [0.15, 0.2], pod115: [0.26, 0.38], far115: [0.66, 0.61] },
  { rmse: [18.4, 16.3], ets64: [0.12, 0.15], pod115: [0.22, 0.3], far115: [0.69, 0.65] },
  { rmse: [19.0, 17.4], ets64: [0.1, 0.12], pod115: [0.19, 0.24], far115: [0.72, 0.69] },
];
const METRICS = Object.keys(INDIA_BY_LEAD[0]);
// All India, Day 1: observed frequency per forecast-chance bin, and FSS per neighbourhood size.
const INDIA_RELIABILITY = {
  raw: [0.03, 0.08, 0.14, 0.2, 0.27, 0.35, 0.42, 0.5, 0.58, 0.66],
  varsha: [0.04, 0.14, 0.24, 0.33, 0.46, 0.55, 0.66, 0.72, 0.83, 0.93],
};
const INDIA_FSS = { raw: [0.38, 0.46, 0.57, 0.63, 0.7], varsha: [0.49, 0.58, 0.68, 0.74, 0.8] };
// Share of Varsha's Day 1 FSS gain left at each lead day.
const FSS_GAIN_BY_LEAD = [1, 0.88, 0.72, 0.55, 0.42];

// Day 1, all India, per regime: [raw, Varsha]. The ETS rows are the design's baseline ladder, with
// one global correction and regime-wise quantile mapping (QM) in between.
const REGIME_DAY1 = {
  depression: { rmse: [24.5, 17.9], ets64: [0.24, 0.35], pod115: [0.42, 0.66], far115: [0.55, 0.45], global: 0.26, regimeQm: 0.3 },
  orographic: { rmse: [27.8, 19.2], ets64: [0.15, 0.31], pod115: [0.24, 0.55], far115: [0.58, 0.46], global: 0.14, regimeQm: 0.24 },
  coastal: { rmse: [18.2, 15.1], ets64: [0.2, 0.29], pod115: [0.33, 0.47], far115: [0.6, 0.55], global: 0.23, regimeQm: 0.26 },
  wd: { rmse: [16.9, 14.4], ets64: [0.12, 0.19], pod115: [0.27, 0.38], far115: [0.66, 0.61], global: 0.15, regimeQm: 0.16 },
  inland: { rmse: [11.6, 9.9], ets64: [0.22, 0.3], pod115: [0.36, 0.45], far115: [0.62, 0.58], global: 0.27, regimeQm: 0.28 },
  break: { rmse: [5.4, 4.8], ets64: [0.09, 0.14], pod115: [0.18, 0.23], far115: [0.74, 0.71], global: 0.13, regimeQm: 0.13 },
};
// Reliability of the raw chances, and FSS and Varsha's FSS gain, relative to all regimes.
const REGIME_SHAPE = {
  depression: { reliability: 1, fss: 1.08, fssGain: 1.3 },
  orographic: { reliability: 0.85, fss: 0.95, fssGain: 1.5 },
  coastal: { reliability: 0.95, fss: 0.92, fssGain: 1 },
  wd: { reliability: 0.9, fss: 0.85, fssGain: 0.9 },
  inland: { reliability: 1, fss: 1, fssGain: 0.7 },
  break: { reliability: 0.8, fss: 0.7, fssGain: 0.5 },
};

/**
 * Verification regions. `shares` are the fraction of cell-days in each regime (regimes a region
 * never sees are left out); `skill` scales the raw scores, `gain` Varsha's improvement, `rmse` the
 * size of the errors and `spread` the sampling noise (hill rain in the north-east is the noisiest).
 */
const REGIONS = [
  {
    id: ALL, label: 'All India', cells: INDIA_CELLS, skill: 1, gain: 1, rmse: 1, spread: 1,
    shares: { depression: 0.08, orographic: 0.12, coastal: 0.08, wd: 0.07, inland: 0.5, break: 0.15 },
  },
  {
    id: 'west-coast', label: 'West coast', cells: 520, skill: 1.06, gain: 1.12, rmse: 1.1, spread: 1.1,
    shares: { depression: 0.06, orographic: 0.48, coastal: 0.3, inland: 0.1, break: 0.06 },
  },
  {
    id: 'central', label: 'Central India', cells: 1150, skill: 1.08, gain: 1.05, rmse: 1, spread: 1,
    shares: { depression: 0.24, wd: 0.06, inland: 0.52, break: 0.18 },
  },
  {
    id: 'north-east', label: 'North-east', cells: 420, skill: 0.86, gain: 0.85, rmse: 1.12, spread: 1.4,
    shares: { depression: 0.05, orographic: 0.5, inland: 0.35, break: 0.1 },
  },
  {
    id: 'north-west', label: 'North-west', cells: 1250, skill: 0.88, gain: 0.92, rmse: 0.92, spread: 1.1,
    shares: { depression: 0.08, orographic: 0.1, coastal: 0.05, wd: 0.22, inland: 0.3, break: 0.25 },
  },
  {
    id: 'south-peninsula', label: 'South peninsula', cells: 880, skill: 0.96, gain: 0.95, rmse: 0.94, spread: 1.05,
    shares: { depression: 0.08, orographic: 0.12, coastal: 0.22, inland: 0.4, break: 0.18 },
  },
];

// Half-width of the 95% interval for the all-India sample (RMSE as a fraction of itself).
const BASE_CI = { rmse: 0.02, ets64: 0.012, pod115: 0.02, far115: 0.02 };

// Regime classifier against observed regime labels, compared with persistence (tomorrow = today):
// overall accuracy per lead day and F1 per regime on Day 1, as [persistence, Varsha].
const CLASSIFIER_ACCURACY = [
  [0.74, 0.86],
  [0.63, 0.81],
  [0.55, 0.75],
  [0.49, 0.68],
  [0.45, 0.62],
];
const CLASSIFIER_F1_DAY1 = {
  depression: [0.7, 0.84],
  orographic: [0.86, 0.9],
  coastal: [0.64, 0.76],
  wd: [0.52, 0.71],
  inland: [0.74, 0.82],
  break: [0.6, 0.74],
};
// Persistence loses skill faster than the classifier as the lead grows.
const F1_DECAY = { persistence: [1, 0.86, 0.75, 0.67, 0.6], varsha: [1, 0.95, 0.89, 0.82, 0.76] };
const REGION_CLASSIFIER = { all: 1, 'west-coast': 1.03, central: 0.97, 'north-east': 0.95, 'north-west': 0.93, 'south-peninsula': 1 };

const r1 = (x) => round(x, 1);
const r2 = (x) => round(x, 2);

/**
 * Stable multiplier in [1 - amount, 1 + amount] for a region and a quantity; none for all of India,
 * whose per-regime values are the design's.
 */
const jitter = (region, key, amount = 0.05) =>
  region.id === ALL ? 1 : 1 + amount * (2 * seededRandom(SEED ^ hashString(`${region.id}|${key}`))() - 1);

// Change of each metric with lead day relative to Day 1, from the all-India targets: `raw` scales
// the raw score and `gain` Varsha's improvement (relative for RMSE, absolute otherwise).
const LEAD_RATIOS = Object.fromEntries(
  METRICS.map((metric) => {
    const [raw1, varsha1] = INDIA_BY_LEAD[0][metric];
    return [
      metric,
      INDIA_BY_LEAD.map(({ [metric]: [raw, varsha] }) => ({
        raw: raw / raw1,
        gain: metric === 'rmse' ? (1 - varsha / raw) / (1 - varsha1 / raw1) : (varsha - raw) / (varsha1 - raw1),
      })),
    ];
  }),
);

/** Error-bar scale for `cells × share` grid cells (1 for all of India); noisier regions widen it. */
const noiseOf = (region, share) => (INDIA_CELLS / (region.cells * share)) ** 0.4 * region.spread;

/** 95% half-width of a metric's score; intervals widen slightly with lead day. */
const ciOf = (metric, value, noise, lead) =>
  metric === 'rmse' ? r1(BASE_CI.rmse * value * noise * (1 + 0.08 * (lead - 1))) : r2(BASE_CI[metric] * noise * (1 + 0.08 * (lead - 1)));

/** Raw chances lose reliability with lead; Varsha is calibrated on Day 1 and drifts overconfident. */
function reliabilityCurves(lead, { rawFactor = 1, drift = 1, wobble = 0, phase = 0 } = {}) {
  const rawScale = rawFactor * (1 - 0.05 * (lead - 1));
  return {
    raw: INDIA_RELIABILITY.raw.map((value) => r2(clamp(value * rawScale, 0, 1))),
    varsha: RELIABILITY_BINS.map((bin, i) =>
      r2(clamp(INDIA_RELIABILITY.varsha[i] - 0.035 * (lead - 1) * drift * bin + wobble * Math.sin(1.9 * i + phase), 0, 1)),
    ),
  };
}

function fssCurves(lead, { rawFactor = 1, gain = 1 } = {}) {
  const raw = INDIA_FSS.raw.map((value) => clamp(value * rawFactor * (1 - 0.06 * (lead - 1)), 0.05, 0.9));
  const varshaGain = gain * FSS_GAIN_BY_LEAD[lead - 1];
  return {
    raw: raw.map(r2),
    varsha: raw.map((value, i) => r2(clamp(value + (INDIA_FSS.varsha[i] - INDIA_FSS.raw[i]) * varshaGain, 0.05, 0.95))),
  };
}

/** One metric for a regime in a region at a lead day. */
function regimeMetric(metric, regimeId, region, lead, noise) {
  const [raw1, varsha1] = REGIME_DAY1[regimeId][metric];
  const { raw: rawRatio, gain: gainRatio } = LEAD_RATIOS[metric][lead - 1];
  const key = `${regimeId}|${metric}`;

  if (metric === 'rmse') {
    const raw = raw1 * rawRatio * region.rmse * jitter(region, `${key}|raw`);
    const gain = (1 - varsha1 / raw1) * gainRatio * region.gain * jitter(region, `${key}|gain`);
    return { raw: r1(raw), varsha: r1(raw * (1 - gain)), ci: ciOf(metric, raw, noise, lead) };
  }
  // A lower false-alarm ratio is better, so a more skilful region lowers it.
  const skill = metric === 'far115' ? 2 - region.skill : region.skill;
  const raw = clamp(raw1 * rawRatio * skill * jitter(region, `${key}|raw`), 0.02, 0.95);
  const change = (varsha1 - raw1) * gainRatio * region.gain * jitter(region, `${key}|gain`);
  return { raw: r2(raw), varsha: r2(clamp(raw + change, 0.02, 0.97)), ci: ciOf(metric, 0, noise, lead) };
}

/** The baseline ladder at ETS ≥ 64.5 mm: the intermediate methods keep their Day 1 positions. */
function withLadder(ets, [raw1, varsha1], { global, regimeQm }) {
  const at = (value) => r2(ets.raw + ((value - raw1) / (varsha1 - raw1)) * (ets.varsha - ets.raw));
  return { ...ets, global: at(global), regimeQm: at(regimeQm) };
}

function regimeScores(regimeId, region) {
  const share = region.shares[regimeId];
  if (!share) return null;
  const noise = noiseOf(region, share);
  const shape = REGIME_SHAPE[regimeId];
  return {
    share,
    leads: LEADS.map((lead) => {
      const [rmse, ets64, pod115, far115] = METRICS.map((metric) => regimeMetric(metric, regimeId, region, lead, noise));
      return {
        lead,
        rmse,
        ets64: withLadder(ets64, REGIME_DAY1[regimeId].ets64, REGIME_DAY1[regimeId]),
        pod115,
        far115,
        reliability: reliabilityCurves(lead, {
          rawFactor: region.skill * shape.reliability * jitter(region, `${regimeId}|reliability`),
          drift: region.spread,
          wobble: Math.min(0.05, 0.008 * noise), // small samples wobble
          phase: seededRandom(SEED ^ hashString(`${region.id}|${regimeId}`))() * 6,
        }),
        fss: fssCurves(lead, {
          rawFactor: Math.sqrt(region.skill) * shape.fss * jitter(region, `${regimeId}|fss`),
          gain: region.gain * shape.fssGain * jitter(region, `${regimeId}|fssGain`),
        }),
      };
    }),
  };
}

/** A region's all-regime scores: its regimes combined by their share of the cell-days. */
function combinedScores(region, byRegime) {
  const present = Object.values(byRegime).filter(Boolean);
  const noise = noiseOf(region, 1);
  return {
    share: 1,
    leads: LEADS.map((lead) => {
      const mean = (pick) => present.reduce((total, scores) => total + scores.share * pick(scores.leads[lead - 1]), 0);
      const series = (field, side, length) => Array.from({ length }, (_, i) => r2(mean((day) => day[field][side][i])));
      const rmse = {
        raw: r1(Math.sqrt(mean((day) => day.rmse.raw ** 2))),
        varsha: r1(Math.sqrt(mean((day) => day.rmse.varsha ** 2))),
      };
      const averaged = (metric, fields = ['raw', 'varsha']) => ({
        ...Object.fromEntries(fields.map((field) => [field, r2(mean((day) => day[metric][field]))])),
        ci: ciOf(metric, 0, noise, lead),
      });
      return {
        lead,
        rmse: { ...rmse, ci: ciOf('rmse', rmse.raw, noise, lead) },
        ets64: averaged('ets64', ['raw', 'global', 'regimeQm', 'varsha']),
        pod115: averaged('pod115'),
        far115: averaged('far115'),
        reliability: {
          raw: series('reliability', 'raw', RELIABILITY_BINS.length),
          varsha: series('reliability', 'varsha', RELIABILITY_BINS.length),
        },
        fss: { raw: series('fss', 'raw', FSS_SCALES_KM.length), varsha: series('fss', 'varsha', FSS_SCALES_KM.length) },
      };
    }),
  };
}

/** All India, all regimes: the design's targets, with the ladder methods placed as in the regions. */
function indiaScores(combined) {
  return {
    share: 1,
    leads: INDIA_BY_LEAD.map((targets, index) => {
      const lead = index + 1;
      const [rmse, ets64, pod115, far115] = METRICS.map((metric) => {
        const [raw, varsha] = targets[metric];
        return { raw, varsha, ci: ciOf(metric, raw, 1, lead) };
      });
      const { raw, global, regimeQm, varsha } = combined.leads[index].ets64;
      return {
        lead,
        rmse,
        ets64: withLadder(ets64, [raw, varsha], { global, regimeQm }),
        pod115,
        far115,
        reliability: reliabilityCurves(lead),
        fss: fssCurves(lead),
      };
    }),
  };
}

function classifier(region) {
  const factor = REGION_CLASSIFIER[region.id];
  const scaled = (value, key) => r2(clamp(value * factor * jitter(region, key, 0.03), 0.2, 0.97));
  return LEADS.map((lead) => {
    const [persistence, varsha] = CLASSIFIER_ACCURACY[lead - 1];
    return {
      lead,
      accuracy: {
        persistence: scaled(persistence, 'accuracy|persistence'),
        varsha: scaled(varsha, 'accuracy|varsha'),
      },
      f1: Object.fromEntries(
        REGIMES.map(({ id }) => {
          if (!region.shares[id]) return [id, null];
          const [p, v] = CLASSIFIER_F1_DAY1[id];
          return [
            id,
            {
              persistence: scaled(p * F1_DECAY.persistence[lead - 1], `${id}|persistence`),
              varsha: scaled(v * F1_DECAY.varsha[lead - 1], `${id}|varsha`),
            },
          ];
        }),
      ),
    };
  });
}

export function buildVerification() {
  const scores = {};
  for (const region of REGIONS) {
    const byRegime = Object.fromEntries(REGIMES.map(({ id }) => [id, regimeScores(id, region)]));
    const combined = combinedScores(region, byRegime);
    scores[region.id] = { [ALL]: region.id === ALL ? indiaScores(combined) : combined, ...byRegime };
  }
  return {
    seasons: [{ id: 'monsoon-2024', label: 'Monsoon 2024 · held out' }],
    sample: { days: SEASON_DAYS, truth: 'IMD gridded rainfall, 0.25°' },
    leads: LEADS,
    regimes: [{ id: ALL, label: 'All regimes' }, ...REGIMES.map(({ id, label }) => ({ id, label }))],
    regions: REGIONS.map(({ id, label, cells }) => ({ id, label, cells })),
    methods: [
      { id: 'raw', label: 'Raw GFS' },
      { id: 'global', label: 'One global correction' },
      { id: 'regimeQm', label: 'Regime-wise QM' },
      { id: 'varsha', label: 'Varsha' },
    ],
    thresholds: { ets64: 64.5, pod115: 115.6, far115: 115.6, reliability: 115.6, fss: 64.5 },
    reliability: { bins: RELIABILITY_BINS },
    fss: { scalesKm: FSS_SCALES_KM, useful: USEFUL_FSS },
    // scores[region][regime] is null where the region never sees the regime.
    scores,
    classifier: Object.fromEntries(REGIONS.map((region) => [region.id, classifier(region)])),
  };
}
