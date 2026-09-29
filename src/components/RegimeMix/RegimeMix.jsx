import { formatPercent } from '../../lib/format.js';
import { rankRegimes } from '../../lib/regimes.js';
import styles from './RegimeMix.module.css';

// Shares below this are left out of the bar.
const MIN_SHARE = 0.03;
const LABELLED = 3;

/** Stacked bar of the regime shares (largest first) with the top three labelled. */
export default function RegimeMix({ weights }) {
  const shown = rankRegimes(weights).filter(({ share }) => share >= MIN_SHARE);
  const total = shown.reduce((sum, { share }) => sum + share, 0);
  const description = shown.map(({ label, share }) => `${label} ${formatPercent(share)}`).join(', ');

  return (
    <div className={styles.mix}>
      <div className={styles.bar} role="img" aria-label={`Regime mix: ${description}`}>
        {shown.map(({ id, color, share }) => (
          <span key={id} style={{ width: `${(share / total) * 100}%`, background: color }} />
        ))}
      </div>
      <p className={styles.labels} aria-hidden="true">
        {shown.slice(0, LABELLED).map(({ id, short, share }) => (
          <span key={id}>
            <strong>{formatPercent(share)}</strong> {short}
          </span>
        ))}
      </p>
    </div>
  );
}
