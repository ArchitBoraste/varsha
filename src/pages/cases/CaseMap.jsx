import { memo, useCallback } from 'react';
import DistrictTooltip from '../../components/DistrictTooltip/DistrictTooltip.jsx';
import IndiaMap from '../../components/IndiaMap';
import { cx } from '../../lib/cx.js';
import { formatMm } from '../../lib/format.js';
import { rainColor } from '../../lib/scales.js';
import styles from './CaseMap.module.css';

const MAP_HEIGHT = 290;

/** One of the three replay maps; hovering it highlights the same district on the others. */
const CaseMap = memo(function CaseMap({ title, field, featured, day, districts, states, bounds, hoverId, onHover }) {
  const getFill = useCallback((feature) => rainColor(day.values[feature.properties.id][field]), [day, field]);
  const getTooltip = useCallback(
    ({ properties }) => {
      const { raw, corrected, observed } = day.values[properties.id];
      return (
        <DistrictTooltip
          name={properties.district}
          state={properties.state}
          lines={[`Raw GFS ${formatMm(raw)}`, `Varsha ${formatMm(corrected)}`, `Observed ${formatMm(observed)}`]}
        />
      );
    },
    [day],
  );

  return (
    <figure className={cx(styles.panel, featured && styles.featured)}>
      <figcaption className={styles.caption}>{title}</figcaption>
      <div className={styles.map}>
        <IndiaMap
          features={districts}
          borders={states}
          fitTo={bounds}
          getFill={getFill}
          getTooltip={getTooltip}
          highlightId={hoverId}
          onHover={onHover}
          height={MAP_HEIGHT}
          label={`${title} rainfall, 24 h to 08:30 IST on ${day.label}`}
        />
      </div>
    </figure>
  );
});

export default CaseMap;
