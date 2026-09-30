import { useMemo } from 'react';
import { applyOverrides } from '../lib/override.js';
import { districtCounts } from '../lib/summary.js';
import { useAppState } from './AppState.jsx';
import { useDataset } from './useDataset.js';

/**
 * forecast.json with the forecaster's overrides applied. Every screen reads the forecast through
 * this hook (or the two below), so an override shows up everywhere; the data file stays untouched.
 */
export function useForecast() {
  const { overrides } = useAppState();
  const { data, error } = useDataset('forecast.json');
  const forecast = useMemo(() => data && applyOverrides(data, overrides), [data, overrides]);
  return { data: forecast, error };
}

/**
 * The effective forecast for one district and lead day, as `{ district, day }`; both are undefined
 * while loading or for an unknown id.
 */
export function useDistrictDay(id, lead) {
  const { data } = useForecast();
  const district = data?.[id];
  return { district, day: district?.days[lead - 1] };
}

/** A lead day's national summary from meta.json, with its district counts redone for any overrides. */
export function useNationalSummary(lead) {
  const { data: forecast } = useForecast();
  const { data: meta } = useDataset('meta.json');
  return useMemo(
    () => meta && forecast && { ...meta.days[lead - 1], ...districtCounts(forecast, lead) },
    [meta, forecast, lead],
  );
}
