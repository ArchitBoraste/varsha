import { useCallback } from 'react';
import Card from '../../components/Card/Card.jsx';
import DistrictTooltip from '../../components/DistrictTooltip/DistrictTooltip.jsx';
import IndiaMap from '../../components/IndiaMap';
import { formatPercent } from '../../lib/format.js';
import { THRESHOLDS } from '../../lib/risk.js';
import { PROB_BANDS, probColor } from '../../lib/scales.js';
import styles from './HeavyRainMaps.module.css';

const MAP_WIDTH = 296;
const MAP_HEIGHT = 330;

function ThresholdMap({ threshold, districts, states, forecast, lead }) {
  const { key, mm, label } = threshold;
  const dayOf = useCallback((feature) => forecast[feature.properties.id].days[lead - 1], [forecast, lead]);
  const getFill = useCallback((feature) => probColor(dayOf(feature).probs[key]), [dayOf, key]);
  const getTooltip = useCallback(
    ({ properties }) => {
      const day = dayOf({ properties });
      return (
        <DistrictTooltip
          name={properties.district}
          state={properties.state}
          lines={[`Chance of ≥ ${mm} mm: ${formatPercent(day.probs[key])}`]}
          override={day.override}
        />
      );
    },
    [dayOf, key, mm],
  );

  return (
    <figure className={styles.panel}>
      <figcaption className={styles.caption}>
        <strong>{label}</strong> · ≥ {mm} mm
      </figcaption>
      <IndiaMap
        features={districts}
        borders={states}
        getFill={getFill}
        getTooltip={getTooltip}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        label={`Chance of ${mm} mm or more by district, Day ${lead}`}
      />
    </figure>
  );
}

/** Chance of heavy, very heavy and extremely heavy rain by district for a lead day. */
export default function HeavyRainMaps({ districts, states, forecast, lead }) {
  return (
    <Card aria-labelledby="heavy-rain-title" className={styles.card}>
      <div className={styles.head}>
        <h2 id="heavy-rain-title" className={styles.title}>
          Chance of heavy rain · Day {lead}
        </h2>
        <span className={styles.note}>IMD thresholds, 24 h to 08:30 IST</span>
      </div>
      <div className={styles.maps}>
        {THRESHOLDS.map((threshold) => (
          <ThresholdMap
            key={threshold.key}
            threshold={threshold}
            districts={districts}
            states={states}
            forecast={forecast}
            lead={lead}
          />
        ))}
      </div>
      <div className={styles.scale}>
        <span className={styles.scaleTitle}>Chance</span>
        {PROB_BANDS.map(({ color, range }) => (
          <span key={color} className={styles.swatch} style={{ background: color }} title={range} />
        ))}
        <span className={styles.ticks}>0 · 10 · 30 · 50 · 70 · 90 · 100%</span>
      </div>
    </Card>
  );
}
