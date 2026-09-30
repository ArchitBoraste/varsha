import { useCallback, useMemo, useState } from 'react';
import Card from '../../components/Card/Card.jsx';
import DistrictTooltip from '../../components/DistrictTooltip/DistrictTooltip.jsx';
import IndiaMap from '../../components/IndiaMap';
import MapLegend from '../../components/MapLegend/MapLegend.jsx';
import SaliencyOverlay from '../../components/SaliencyOverlay/SaliencyOverlay.jsx';
import SegmentedControl from '../../components/SegmentedControl/SegmentedControl.jsx';
import { layerFill, layerLegend, layerTooltipLines } from '../../lib/layers.js';
import { useAppState } from '../../state/AppState.jsx';
import styles from './RegimeMap.module.css';

// Each view is one of the forecast console's map layers.
const VIEWS = [
  { id: 'regime', label: 'Regime by district' },
  { id: 'saliency', label: 'What the engine looked at' },
];

/** Regime by district, or the regime engine's saliency and winds; click a district to review it. */
export default function RegimeMap({ districts, states, forecast, lead }) {
  const { selectedDistrictId, selectDistrict } = useAppState();
  const [view, setView] = useState('regime');

  const dayOf = useCallback((feature) => forecast[feature.properties.id].days[lead - 1], [forecast, lead]);

  const getFill = useMemo(() => {
    const fill = layerFill(view);
    return (feature) => fill(dayOf(feature));
  }, [view, dayOf]);

  const getTooltip = useMemo(() => {
    const linesOf = layerTooltipLines(view);
    return (feature) => {
      const district = forecast[feature.properties.id];
      const day = dayOf(feature);
      return <DistrictTooltip name={district.name} state={district.state} lines={linesOf(district, day)} override={day.override} />;
    };
  }, [view, forecast, dayOf]);

  const legend = layerLegend(view);
  const viewName = VIEWS.find(({ id }) => id === view).label;

  return (
    <Card aria-label="Regime map" className={styles.card}>
      <div className={styles.toolbar}>
        <SegmentedControl label="Map view" options={VIEWS} value={view} onChange={setView} />
      </div>
      <div className={styles.mapArea}>
        <IndiaMap
          features={districts}
          borders={states}
          getFill={getFill}
          getTooltip={getTooltip}
          selectedId={selectedDistrictId}
          onSelect={selectDistrict}
          label={`${viewName}, Day ${lead}`}
        >
          {view === 'saliency' && <SaliencyOverlay lead={lead} />}
        </IndiaMap>
      </div>
      {/* The view toggle names the map, so the key needs no title (as in the mockup). */}
      <MapLegend className={styles.legend} items={legend.items} />
    </Card>
  );
}
