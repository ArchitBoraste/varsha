import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import LinkButton from '../../components/Button/LinkButton.jsx';
import Card from '../../components/Card/Card.jsx';
import Icon from '../../components/Icon/Icon.jsx';
import { Skeleton } from '../../components/LoadState/LoadState.jsx';
import OverrideChip from '../../components/OverrideChip/OverrideChip.jsx';
import RegimeMix from '../../components/RegimeMix/RegimeMix.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { cx } from '../../lib/cx.js';
import { explainCorrection } from '../../lib/explain.js';
import { formatPeople, formatSignedMm, plural } from '../../lib/format.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import { useForecast } from '../../state/useForecast.js';
import ChanceBars from './ChanceBars.jsx';
import styles from './DistrictPanel.module.css';

function DistrictDetails({ id, district, lead, leadInfo, onClose }) {
  const day = district.days[lead - 1];
  const change = day.corrected - day.raw;
  const { population, landslideProne, dams } = district.exposure;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.name}>{district.name}</h2>
          <p className={styles.context}>
            {district.state} · Day {lead} · {leadInfo.period}
          </p>
        </div>
        <Button variant="ghost" square aria-label="Close district panel" onClick={onClose}>
          <Icon name="close" size={16} strokeWidth={1.8} />
        </Button>
      </header>

      <div className={styles.badges}>
        <WarningBadge level={day.warning} showAction />
        {day.override && <OverrideChip override={day.override} />}
        {landslideProne && (
          <span className={styles.chip}>
            <Icon name="triangle" size={12} strokeWidth={2} />
            Landslide-prone
          </span>
        )}
      </div>

      <div className={styles.amounts}>
        <p className={styles.amount}>
          <span className={styles.amountLabel}>Varsha corrected</span>
          <span className={styles.corrected}>
            {day.corrected}
            <span className={styles.unit}> mm</span>
          </span>
        </p>
        <p className={styles.amount}>
          <span className={styles.amountLabel}>Raw GFS</span>
          <span className={styles.raw}>
            {day.raw}
            <span className={styles.rawUnit}> mm</span>
          </span>
        </p>
        <span className={cx(styles.change, change < 0 && styles.lowered)}>{formatSignedMm(change)}</span>
      </div>

      <section className={styles.section} aria-labelledby={`${id}-mix`}>
        <div className={styles.sectionHead}>
          <h3 id={`${id}-mix`} className={styles.sectionTitle}>
            Regime mix
          </h3>
          <span className={styles.note}>blend weights for the correction</span>
        </div>
        <RegimeMix weights={day.p} />
      </section>

      <section className={styles.section} aria-labelledby={`${id}-chance`}>
        <h3 id={`${id}-chance`} className={styles.sectionTitle}>
          Chance of heavy rain
        </h3>
        <ChanceBars probs={day.probs} />
      </section>

      <section className={styles.why} aria-labelledby={`${id}-why`}>
        <h3 id={`${id}-why`} className={styles.sectionTitle}>
          Why this correction
        </h3>
        <p className={styles.explanation}>{explainCorrection(district, day)}</p>
      </section>

      <p className={styles.exposure}>
        <span>
          Exposure: {formatPeople(population)} people · {plural(dams.length, 'large dam')}
        </span>
        <span className={styles.source}>Census 2011</span>
      </p>

      <LinkButton variant="primary" to={`/districts/${id}`} className={styles.open}>
        Open district page
        <Icon name="arrowRight" size={16} strokeWidth={1.8} />
      </LinkButton>
    </>
  );
}

function EmptyState({ message, takeFocus }) {
  const ref = useRef(null);
  useEffect(() => {
    if (takeFocus) ref.current.focus();
  }, [takeFocus]);
  return (
    <p ref={ref} tabIndex={-1} className={styles.empty}>
      {message}
    </p>
  );
}

/** The selected district for the current lead day, or a prompt to pick one. */
export default function DistrictPanel() {
  const { lead, selectedDistrictId, selectDistrict } = useAppState();
  const { data: forecast } = useForecast();
  const { data: meta } = useDataset('meta.json');
  // Closing the panel moves focus to the empty state rather than dropping it on the page.
  const [closedByUser, setClosedByUser] = useState(false);
  const district = forecast?.[selectedDistrictId];

  let content;
  if (!forecast || !meta) {
    content = (
      <div className={styles.loading} aria-busy="true">
        <span className="visually-hidden" role="status">
          Loading district…
        </span>
        <Skeleton className={styles.skeletonTitle} />
        <Skeleton className={styles.skeletonBlock} />
        <Skeleton className={styles.skeletonBlock} />
      </div>
    );
  } else if (district) {
    content = (
      <DistrictDetails
        id={selectedDistrictId}
        district={district}
        lead={lead}
        leadInfo={meta.leads[lead - 1]}
        onClose={() => {
          setClosedByUser(true);
          selectDistrict(null);
        }}
      />
    );
  } else {
    content = <EmptyState message="Click any district on the map" takeFocus={closedByUser} />;
  }

  return (
    <Card as="aside" aria-label="Selected district" className={styles.panel}>
      {content}
    </Card>
  );
}
