import { useMemo } from 'react';
import { districtCodes, draftAlerts } from '../lib/alerts.js';
import { useAppState } from './AppState.jsx';
import { useDataset } from './useDataset.js';
import { useForecast } from './useForecast.js';

/**
 * The lead day's alerts, derived from the effective forecast (overrides included): one per red or
 * orange district, with `status` 'draft', 'sent' or 'rejected' and the decision's `record`.
 * `alerts` is undefined while the data loads.
 */
export function useAlerts(lead) {
  const { data: forecast, error } = useForecast();
  const { data: meta, error: metaError } = useDataset('meta.json');
  const { alertRecords } = useAppState();

  const codes = useMemo(() => forecast && districtCodes(forecast), [forecast]);
  const drafts = useMemo(
    () => forecast && meta && draftAlerts(forecast, meta.leads[lead - 1], codes),
    [forecast, meta, lead, codes],
  );
  const alerts = useMemo(
    () => drafts?.map((alert) => ({ ...alert, record: alertRecords[alert.id] ?? null, status: alertRecords[alert.id]?.status ?? 'draft' })),
    [drafts, alertRecords],
  );

  return { alerts, meta, error: error ?? metaError };
}

/** How many of the lead day's alerts await a forecaster's decision. */
export function useDraftCount(lead) {
  const { alerts } = useAlerts(lead);
  return alerts?.filter(({ status }) => status === 'draft').length ?? 0;
}
