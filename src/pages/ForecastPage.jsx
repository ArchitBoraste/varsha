import { useCallback, useMemo } from 'react';
import Card from '../components/Card/Card.jsx';
import IndiaMap from '../components/IndiaMap';
import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import MapLegend from '../components/MapLegend/MapLegend.jsx';
import Page from '../components/Page/Page.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import { RAIN_CATEGORIES, rainColor } from '../lib/scales.js';
import { useAppState } from '../state/AppState.jsx';
import { useDataset, useIndiaGeo } from '../state/useDataset.js';
import styles from './ForecastPage.module.css';

// Temporary until the forecast console is built: Varsha-corrected vs raw rainfall for the
// selected lead day, split by the compare divider.
function RainfallMap() {
  const { lead, selectedDistrictId, selectDistrict } = useAppState();
  const { districts, states, error: geoError } = useIndiaGeo();
  const { data: forecast, error: forecastError } = useDataset('forecast.json');
  const error = geoError ?? forecastError;
  const ready = districts && states && forecast;

  const dayOf = useCallback((feature) => forecast[feature.properties.id].days[lead - 1], [forecast, lead]);

  const compare = useMemo(
    () => ({
      leftFill: (feature) => rainColor(dayOf(feature).corrected),
      rightFill: (feature) => rainColor(dayOf(feature).raw),
      leftLabel: 'Varsha corrected',
      rightLabel: 'Raw GFS',
    }),
    [dayOf],
  );

  const getTooltip = useCallback(
    (feature) => {
      const { corrected, raw } = dayOf(feature);
      return (
        <>
          <strong>{feature.properties.district}</strong>, {feature.properties.state}
          <br />
          Varsha {corrected} mm · Raw GFS {raw} mm
        </>
      );
    },
    [dayOf],
  );

  return (
    <Card aria-label="India map" className={styles.mapCard}>
      {error && (
        <p role="alert" className={styles.status}>
          {error.message}
        </p>
      )}
      {!error && !ready && <p className={styles.status}>Loading map…</p>}
      {ready && (
        <div className={styles.mapArea}>
          <IndiaMap
            features={districts}
            borders={states}
            compare={compare}
            getTooltip={getTooltip}
            selectedId={selectedDistrictId}
            onSelect={selectDistrict}
            label={`Rainfall by district for Day ${lead}, Varsha corrected and raw GFS`}
          />
        </div>
      )}
      <MapLegend className={styles.legend} title="Rainfall, mm/day (IMD categories)" items={RAIN_CATEGORIES} />
    </Card>
  );
}

export default function ForecastPage() {
  return (
    <Page
      title="Forecast"
      subtitle="Corrected all-India rainfall"
      className={styles.page}
      controls={
        <>
          <RunButton />
          <LeadDaySelector />
        </>
      }
    >
      <RainfallMap />
    </Page>
  );
}
