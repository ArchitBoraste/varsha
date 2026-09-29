import { useCallback, useMemo, useState } from 'react';
import Card from '../../components/Card/Card.jsx';
import IndiaMap from '../../components/IndiaMap';
import MapLegend from '../../components/MapLegend/MapLegend.jsx';
import SegmentedControl from '../../components/SegmentedControl/SegmentedControl.jsx';
import Switch from '../../components/Switch/Switch.jsx';
import { rainColor } from '../../lib/scales.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset, useIndiaGeo } from '../../state/useDataset.js';
import ExposureMarkers from './ExposureMarkers.jsx';
import { LAYERS, THRESHOLD_OPTIONS, layerFill, layerLegend, layerTooltip } from './layers.jsx';
import MapStatus from './MapStatus.jsx';
import SaliencyOverlay from './SaliencyOverlay.jsx';
import styles from './ForecastMap.module.css';

/** The forecast console's map card: layer switcher, map with overlays, status and legend. */
export default function ForecastMap() {
  const { lead, selectedDistrictId, selectDistrict } = useAppState();
  const { districts, states, error: geoError } = useIndiaGeo();
  const { data: forecast, error: forecastError } = useDataset('forecast.json');
  const { data: meta } = useDataset('meta.json');
  const [layer, setLayer] = useState('rain');
  const [compareOn, setCompareOn] = useState(true);
  const [threshold, setThreshold] = useState('p115');

  const error = geoError ?? forecastError;
  const ready = districts && states && forecast;
  const layerName = LAYERS.find(({ id }) => id === layer).label;

  const dayOf = useCallback((feature) => forecast[feature.properties.id].days[lead - 1], [forecast, lead]);

  const getFill = useMemo(() => {
    const fill = layerFill(layer, threshold);
    return (feature) => fill(dayOf(feature));
  }, [layer, threshold, dayOf]);

  const compare = useMemo(
    () =>
      layer === 'rain' && compareOn
        ? {
            leftFill: getFill,
            rightFill: (feature) => rainColor(dayOf(feature).raw),
            leftLabel: 'Varsha corrected',
            rightLabel: 'Raw GFS',
          }
        : undefined,
    [layer, compareOn, getFill, dayOf],
  );

  const getTooltip = useMemo(() => {
    const tooltip = layerTooltip(layer, threshold);
    return (feature) => tooltip(forecast[feature.properties.id], dayOf(feature));
  }, [layer, threshold, forecast, dayOf]);

  const legend = layerLegend(layer, threshold);

  return (
    <Card aria-label="India map" className={styles.card}>
      <div className={styles.top}>
        <div className={styles.toolbar}>
          <SegmentedControl label="Map layer" options={LAYERS} value={layer} onChange={setLayer} />
          {layer === 'rain' && (
            <Switch checked={compareOn} onChange={setCompareOn}>
              Compare with raw
            </Switch>
          )}
          {layer === 'prob' && (
            <SegmentedControl label="Heavy-rain threshold" options={THRESHOLD_OPTIONS} value={threshold} onChange={setThreshold} />
          )}
        </div>
        {meta && <MapStatus layer={layer} summary={meta.days[lead - 1]} />}
      </div>

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
            getFill={getFill}
            compare={compare}
            getTooltip={getTooltip}
            selectedId={selectedDistrictId}
            onSelect={selectDistrict}
            label={`${layerName} by district, Day ${lead}`}
          >
            {layer === 'exposure' && <ExposureMarkers forecast={forecast} />}
            {layer === 'saliency' && <SaliencyOverlay lead={lead} />}
          </IndiaMap>
        </div>
      )}

      <MapLegend className={styles.legend} title={legend.title} items={legend.items} />
    </Card>
  );
}
