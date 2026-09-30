import Card from '../../components/Card/Card.jsx';
import { cx } from '../../lib/cx.js';
import { formatSigned } from '../../lib/format.js';
import { topRegime } from '../../lib/regimes.js';
import styles from './DriversCard.module.css';

// The widest bar spans this share of the track on its side of zero.
const MAX_BAR = 48;

function barStyle(mm, largest) {
  const width = (Math.abs(mm) / largest) * MAX_BAR;
  return { left: `${mm >= 0 ? 50 : 50 - width}%`, width: `${width}%` };
}

/** Diverging bars of the drivers behind the correction for one lead day; `compact` fits a half-width column. */
export default function DriversCard({ day, compact = false }) {
  const change = day.corrected - day.raw;
  const title =
    change === 0
      ? `Why Varsha left Day ${day.lead} unchanged`
      : `Why Varsha ${change > 0 ? 'raised' : 'lowered'} Day ${day.lead} by ${Math.abs(change)} mm`;
  const expert = `${topRegime(day.p).short} regime expert`;
  const largest = Math.max(1, ...day.drivers.map(({ mm }) => Math.abs(mm)));

  return (
    <Card aria-labelledby="drivers-title" className={cx(styles.card, compact && styles.compact)}>
      <div className={styles.head}>
        <h2 id="drivers-title" className={styles.title}>
          {title}
        </h2>
        <span className={styles.note}>Contribution of each factor, mm</span>
      </div>
      <ul className={styles.rows}>
        {day.drivers.map(({ name, mm }) => (
          <li key={name} className={styles.row}>
            <span>{name === 'Regime expert' ? expert : name}</span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.zero} />
              <span className={cx(styles.bar, mm < 0 && styles.negative)} style={barStyle(mm, largest)} />
            </span>
            <span className={styles.value}>{formatSigned(mm)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
