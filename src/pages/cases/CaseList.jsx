import { cx } from '../../lib/cx.js';
import { REGIME_BY_ID } from '../../lib/scales.js';
import styles from './CaseList.module.css';

/** The past events to replay; the selected one has an accent border. */
export default function CaseList({ cases, selectedId, onSelect }) {
  return (
    <nav aria-label="Case studies" className={styles.list}>
      <ul className={styles.cases}>
        {cases.map(({ id, title, region, dates, regime }) => (
          <li key={id}>
            <button
              type="button"
              className={cx(styles.case, id === selectedId && styles.selected)}
              aria-pressed={id === selectedId}
              onClick={() => onSelect(id)}
            >
              <span className={styles.title}>{title}</span>
              <span className={styles.meta}>
                {region} · {dates}
              </span>
              <span className={styles.regime}>
                <span className={styles.dot} style={{ background: REGIME_BY_ID[regime].color }} />
                {REGIME_BY_ID[regime].label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.add} aria-disabled="true" title="Adding cases is not part of this demo">
        Add a case
      </button>
    </nav>
  );
}
