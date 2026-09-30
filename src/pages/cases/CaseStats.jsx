import Card from '../../components/Card/Card.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { formatMm } from '../../lib/format.js';
import { THRESHOLDS, forecastWarning, observedWarning } from '../../lib/risk.js';
import styles from './CaseStats.module.css';

const VERY_HEAVY = THRESHOLDS.find(({ key }) => key === 'p115').mm;

/** Very heavy days in the case region: how many each forecast caught, and its false alarms. */
function regionScores(day, ids) {
  const scores = { observed: 0, caught: { varsha: 0, raw: 0 }, falseAlarms: { varsha: 0, raw: 0 } };
  for (const id of ids) {
    const { raw, corrected, observed } = day.values[id];
    const tally = observed >= VERY_HEAVY ? scores.caught : scores.falseAlarms;
    if (observed >= VERY_HEAVY) scores.observed += 1;
    if (corrected >= VERY_HEAVY) tally.varsha += 1;
    if (raw >= VERY_HEAVY) tally.raw += 1;
  }
  return scores;
}

/** The replay day's numbers: the focus district, the region's very heavy rain and the warning colours. */
export default function CaseStats({ caseStudy, day, focusName, regionIds }) {
  const focus = day.values[caseStudy.focusDistrict];
  const scores = regionScores(day, regionIds);
  const warnings = [
    { label: 'From raw', level: forecastWarning(focus.raw, day.lead) },
    { label: 'Varsha', level: forecastWarning(focus.corrected, day.lead), strong: true },
    { label: 'What fell', level: observedWarning(focus.observed) },
  ];
  const amounts = [
    { label: 'Raw GFS', mm: focus.raw },
    { label: 'Varsha', mm: focus.corrected, strong: true },
    { label: 'Observed', mm: focus.observed },
  ];

  return (
    <div className={styles.stats}>
      <Card className={styles.card} aria-labelledby="case-focus-title">
        <h3 id="case-focus-title" className={styles.title}>
          {focusName} · 24 h to 08:30 IST, {day.label}
        </h3>
        <dl className={styles.rows}>
          {amounts.map(({ label, mm, strong }) => (
            <div key={label} className={styles.row}>
              <dt className={strong ? styles.strongLabel : undefined}>{label}</dt>
              <dd className={strong ? styles.strongValue : undefined}>{formatMm(mm)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className={styles.card} aria-labelledby="case-caught-title">
        <h3 id="case-caught-title" className={styles.title}>
          {caseStudy.region} districts ≥ {VERY_HEAVY} mm caught
        </h3>
        {scores.observed > 0 ? (
          <p className={styles.headline}>
            <span className={styles.big}>
              {scores.caught.varsha} of {scores.observed}
            </span>
            <span className={styles.muted}>raw caught {scores.caught.raw}</span>
          </p>
        ) : (
          <p className={styles.headline}>
            <span className={styles.big}>None</span>
            <span className={styles.muted}>observed that day</span>
          </p>
        )}
        <p className={styles.muted}>
          False alarms: Varsha {scores.falseAlarms.varsha}, raw {scores.falseAlarms.raw}
        </p>
      </Card>

      <Card className={styles.card} aria-labelledby="case-warning-title">
        <h3 id="case-warning-title" className={styles.title}>
          Warning colour for {focusName}
        </h3>
        <dl className={styles.warnings}>
          {warnings.map(({ label, level, strong }) => (
            <div key={label} className={styles.warning}>
              <dt className={strong ? styles.strongLabel : styles.warningLabel}>{label}</dt>
              <dd>
                <WarningBadge level={level} size="sm" />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
