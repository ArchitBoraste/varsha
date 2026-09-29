import { formatPercent } from '../../lib/format.js';
import { THRESHOLDS } from '../../lib/risk.js';
import { THRESHOLD_COLORS } from '../../lib/scales.js';
import styles from './ChanceBars.module.css';

/** Chance of reaching each IMD heavy-rain threshold, as labelled bars. */
export default function ChanceBars({ probs }) {
  return (
    <ul className={styles.bars}>
      {THRESHOLDS.map(({ key, mm, label }) => (
        <li key={key} className={styles.item}>
          <span className={styles.row}>
            <span className={styles.label}>
              {label}, ≥ {mm} mm
            </span>
            <span className={styles.value}>{formatPercent(probs[key])}</span>
          </span>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.fill} style={{ width: formatPercent(probs[key]), background: THRESHOLD_COLORS[key] }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
