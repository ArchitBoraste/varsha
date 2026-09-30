import { cx } from '../../lib/cx.js';
import { REGIMES } from '../../lib/scales.js';
import ChartCard from './ChartCard.jsx';
import { CLASSIFIER_COLORS } from './palette.js';
import styles from './ClassifierCard.module.css';

const SERIES = [
  { id: 'persistence', label: 'Persistence' },
  { id: 'varsha', label: 'Varsha classifier' },
];

const pair = ({ persistence, varsha }) => (
  <span className={styles.values}>
    <span className="visually-hidden">persistence </span>
    {persistence.toFixed(2)}
    <span aria-hidden="true"> → </span>
    <span className="visually-hidden">, classifier </span>
    <strong>{varsha.toFixed(2)}</strong>
  </span>
);

/** How well the regime engine labels each day, against persistence (tomorrow's regime is today's). */
export default function ClassifierCard({ report, lead, region, regime }) {
  const byLead = report.classifier[region];
  const { f1 } = byLead[lead - 1];

  return (
    <ChartCard
      id="classifier-title"
      title="Regime classifier · against observed regime labels"
      note="Persistence: tomorrow's regime is today's"
      className={styles.card}
    >
      <ul className={styles.legend} aria-hidden="true">
        {SERIES.map(({ id, label }) => (
          <li key={id}>
            <span className={styles.swatch} style={{ background: CLASSIFIER_COLORS[id] }} />
            {label}
          </li>
        ))}
      </ul>

      <div className={styles.panels}>
        <section aria-labelledby="f1-title">
          <h3 id="f1-title" className={styles.panelTitle}>
            F1 score by regime · Day {lead}
          </h3>
          <ul className={styles.rows}>
            {REGIMES.map(({ id, short, color }) => (
              <li key={id} className={cx(styles.row, regime !== 'all' && regime !== id && styles.faded)}>
                <span className={styles.rowLabel}>
                  <span className={styles.dot} style={{ background: color }} />
                  {short}
                </span>
                {f1[id] ? (
                  <>
                    <span className={styles.pairBars} aria-hidden="true">
                      {SERIES.map((series) => (
                        <span
                          key={series.id}
                          style={{ width: `${f1[id][series.id] * 100}%`, background: CLASSIFIER_COLORS[series.id] }}
                        />
                      ))}
                    </span>
                    {pair(f1[id])}
                  </>
                ) : (
                  <span className={styles.none}>Not seen in this region</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="accuracy-title">
          <h3 id="accuracy-title" className={styles.panelTitle}>
            Overall accuracy by lead day
          </h3>
          <ul className={styles.columns}>
            {byLead.map(({ lead: day, accuracy }) => (
              <li key={day} className={cx(styles.column, day === lead && styles.current)}>
                <span className={styles.columnBars} aria-hidden="true">
                  {SERIES.map((series) => (
                    <span
                      key={series.id}
                      style={{ height: `${accuracy[series.id] * 100}%`, background: CLASSIFIER_COLORS[series.id] }}
                    />
                  ))}
                </span>
                <span className={styles.columnLabel}>Day {day}</span>
                {pair(accuracy)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ChartCard>
  );
}
