// The map layers of the forecast console, also used by the regime monitor: how each colours a
// district-day, what its tooltip says and what its legend shows.

import { formatMm, formatPeople, formatPercent, joinAnd } from './format.js';
import { rankRegimes, regimeFill, topRegime } from './regimes.js';
import { THRESHOLDS } from './risk.js';
import { PROB_BANDS, RAIN_CATEGORIES, REGIMES, SALIENCY_STOPS, WARNINGS, probColor, rainColor } from './scales.js';

export const LAYERS = [
  { id: 'rain', label: 'Rainfall' },
  { id: 'regime', label: 'Regime' },
  { id: 'prob', label: 'Heavy rain' },
  { id: 'exposure', label: 'Exposure' },
  { id: 'saliency', label: 'Saliency' },
];

export const THRESHOLD_OPTIONS = THRESHOLDS.map(({ key, mm }) => ({ id: key, label: `≥ ${mm}` }));

const thresholdMm = (key) => THRESHOLDS.find((threshold) => threshold.key === key).mm;

export const MARKER_COLORS = { landslide: '#3B2A1A', dam: '#1F5FA8', wind: '#13202B' };

// Districts fade back on the saliency layer so the heatmap reads.
const SALIENCY_BASE = '#E6EAE7';

/** district-day => colour for a layer. */
export function layerFill(layer, threshold) {
  switch (layer) {
    case 'rain':
      return (day) => rainColor(day.corrected);
    case 'regime':
      return (day) => regimeFill(day.p);
    case 'prob':
      return (day) => probColor(day.probs[threshold]);
    case 'exposure':
      return (day) => WARNINGS[day.warning].color;
    default:
      return () => SALIENCY_BASE;
  }
}

/** Tooltip lines under the district name for a layer: (district, district-day) => string[]. */
export function layerTooltipLines(layer, threshold) {
  return ({ exposure }, day) => {
    switch (layer) {
      case 'rain':
        return [`Varsha ${formatMm(day.corrected)} · Raw GFS ${formatMm(day.raw)}`];
      case 'regime':
        return rankRegimes(day.p)
          .filter(({ share }) => share >= 0.01)
          .map(({ label, share }) => `${label} ${formatPercent(share)}`);
      case 'prob':
        return [`Chance of ≥ ${thresholdMm(threshold)} mm: ${formatPercent(day.probs[threshold])}`];
      case 'exposure': {
        const { label, action } = WARNINGS[day.warning];
        const { population, landslideProne, dams } = exposure;
        return [
          `${label} · ${action}`,
          `${formatPeople(population)} people`,
          landslideProne && 'Landslide-prone',
          dams.length > 0 && `${joinAnd(dams)} ${dams.length > 1 ? 'dams' : 'dam'}`,
        ].filter(Boolean);
      }
      default:
        return [`${topRegime(day.p).label} regime`];
    }
  };
}

const EXPOSURE_ITEMS = [
  ...Object.values(WARNINGS).map(({ id, label, color }) => ({
    color,
    label: id === 'green' ? 'No warning' : `${label} warning`,
  })),
  { shape: 'triangle', color: MARKER_COLORS.landslide, label: 'Landslide-prone' },
  { shape: 'square', color: MARKER_COLORS.dam, label: 'Large dam' },
];

const SALIENCY_ITEMS = [
  { color: SALIENCY_STOPS[0], label: 'Some influence' },
  { color: SALIENCY_STOPS[1], label: 'Strong influence' },
  { color: SALIENCY_STOPS[2], label: 'Strongest influence' },
  { shape: 'arrow', color: MARKER_COLORS.wind, label: 'Forecast 850 hPa wind' },
];

/** { title, items } for a layer's MapLegend. */
export function layerLegend(layer, threshold) {
  switch (layer) {
    case 'rain':
      return { title: 'Rainfall, mm/day (IMD categories)', items: RAIN_CATEGORIES };
    case 'regime':
      return { title: 'Regime (largest share)', items: REGIMES };
    case 'prob':
      return { title: `Chance of ≥ ${thresholdMm(threshold)} mm`, items: PROB_BANDS };
    case 'exposure':
      return { title: 'Warning and exposure', items: EXPOSURE_ITEMS };
    default:
      return { title: 'Saliency, regime engine', items: SALIENCY_ITEMS };
  }
}
