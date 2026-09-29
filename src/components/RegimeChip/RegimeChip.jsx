import { formatPercent } from '../../lib/format.js';
import { regimeTint, topRegime } from '../../lib/regimes.js';
import styles from './RegimeChip.module.css';

/** The top regime and its share, e.g. "Orographic regime · 95%", on a tint of its colour. */
export default function RegimeChip({ weights }) {
  const regime = topRegime(weights);
  return (
    <span className={styles.chip} style={{ background: regimeTint(regime) }}>
      <span className={styles.dot} style={{ background: regime.color }} />
      {regime.short} regime · {formatPercent(regime.share)}
    </span>
  );
}
