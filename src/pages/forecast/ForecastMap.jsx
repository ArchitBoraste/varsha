import { useCallback, useMemo, useState } from 'react';
import Card from '../../components/Card/Card.jsx';
import DistrictTooltip from '../../components/DistrictTooltip/DistrictTooltip.jsx';
import IndiaMap from '../../components/IndiaMap';
import LoadState, { Skeleton } from '../../components/LoadState/LoadState.jsx';
import MapLegend from '../../components/MapLegend/MapLegend.jsx';
import SaliencyOverlay from '../../components/SaliencyOverlay/SaliencyOverlay.jsx';
import SegmentedControl from '../../components/SegmentedControl/SegmentedControl.jsx';
import Switch from '../../components/Switch/Switch.jsx';
import { LAYERS, THRESHOLD_OPTIONS, layerFill, layerLegend, layerTooltipLines } from '../../lib/layers.js';
import { rainColor } from '../../lib/scales.js';
import { useAppState } from '../../state/AppState.jsx';
import { useIndiaGeo } from '../../state/useDataset.js';
import { useForecast, useNationalSummary } from '../../state/useForecast.js';
import ExposureMarkers from './ExposureMarkers.jsx';
import MapStatus from './MapStatus.jsx';
import styles from './ForecastMap.module.css';

/** The forecast console's map card: layer switcher, map with overlays, status and legend. */
export default function ForecastMap() {
  const { lead, selectedDistrictId, selectDistrict, highlightIds, clearHighlights } = useAppState();
  const { districts, states, error: geoError } = useIndiaGeo();
  const { data: forecast, error: forecastError } = useForecast();
  const summary = useNationalSummary(lead);
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
    const linesOf = layerTooltipLines(layer, threshold);
    return (feature) => {
      const district = forecast[feature.properties.id];
      const day = dayOf(feature);
      return <DistrictTooltip name={district.name} state={district.state} lines={linesOf(district, day)} override={day.override} />;
    };
  }, [layer, threshold, forecast, dayOf]);

  const legend = layerLegend(layer, threshold);

  // Outlines from an Ask Varsha answer last until the next map click.
  const handleSelect = useCallback(
    (id) => {
      clearHighlights();
      selectDistrict(id);
    },
    [clearHighlights, selectDistrict],
  );

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
        {summary && <MapStatus layer={layer} summary={summary} />}
      </div>

      {!ready && (
        <div className={styles.status}>
          <LoadState error={error} label="Loading map…">
            <Skeleton className={styles.skeletonMap} />
          </LoadState>
        </div>
      )}
      {ready && (
        <div className={styles.mapArea}>
          <IndiaMap
            features={districts}
            borders={states}
            getFill={getFill}
            compare={compare}
            getTooltip={getTooltip}
            selectedId={selectedDistrictId}
            onSelect={handleSelect}
            highlightIds={highlightIds}
            label={`${layerName} by district, Day ${lead}`}
          >
            {layer === 'exposure' && <ExposureMarkers forecast={forecast} />}
            {layer === 'saliency' && <SaliencyOverlay lead={lead} />}
          </IndiaMap>
        </div>
      )}

      <MapLegend className={styles.legend} title={legend.title} items={legend.items} />

      {highlightIds.length > 0 && (
        <p className={styles.highlightNote}>
          <span className={styles.highlightSwatch} aria-hidden="true" />
          {highlightIds.length === 1 ? '1 district' : `${highlightIds.length} districts`} from Ask Varsha
          <button type="button" className={styles.clear} onClick={clearHighlights}>
            Clear
          </button>
        </p>
      )}
    </Card>
  );
}
