import { useCallback, useMemo } from 'react';
import Card from '../../components/Card/Card.jsx';
import IndiaMap from '../../components/IndiaMap';
import RegimeChip from '../../components/RegimeChip/RegimeChip.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { formatPercent } from '../../lib/format.js';
import { useIndiaGeo } from '../../state/useDataset.js';
import styles from './DistrictHeader.module.css';

const LOCATOR_FILLS = { district: '#1F5FA8', state: '#C5D0D8', elsewhere: '#E6EAE7' };

/** The district highlighted within its state. */
function Locator({ id, name, state }) {
  const { districts, states } = useIndiaGeo();
  const stateOutline = useMemo(() => states?.find((feature) => feature.properties.state === state), [states, state]);
  const getFill = useCallback(
    ({ properties }) =>
      properties.id === id ? LOCATOR_FILLS.district : properties.state === state ? LOCATOR_FILLS.state : LOCATOR_FILLS.elsewhere,
    [id, state],
  );

  return (
    <div className={styles.locator}>
      {districts && stateOutline && (
        <IndiaMap features={districts} fitTo={stateOutline} getFill={getFill} label={`${name} within ${state}`} />
      )}
    </div>
  );
}

/** Locator, name, warning and regime, and the lead day's headline numbers. */
export default function DistrictHeader({ id, district, lead }) {
  const day = district.days[lead - 1];
  const stats = [
    { label: `Varsha, Day ${lead}`, value: day.corrected, unit: ' mm', className: styles.varsha },
    { label: `Raw GFS, Day ${lead}`, value: day.raw, unit: ' mm', className: styles.raw },
    { label: 'Chance ≥ 204.5 mm', value: formatPercent(day.probs.p204), className: styles.chance },
  ];

  return (
    <Card className={styles.header}>
      <Locator id={id} name={district.name} state={district.state} />
      <div className={styles.identity}>
        <div className={styles.titleRow}>
          <h1 className={styles.name}>{district.name}</h1>
          <span className={styles.state}>{district.state}</span>
        </div>
        <div className={styles.badges}>
          <WarningBadge level={day.warning} showAction />
          <RegimeChip weights={day.p} />
        </div>
      </div>
      <dl className={styles.stats}>
        {stats.map(({ label, value, unit, className }) => (
          <div key={label} className={styles.stat}>
            <dt className={styles.statLabel}>{label}</dt>
            <dd className={className}>
              {value}
              {unit && <span className={styles.unit}>{unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
