import { cx } from '../../lib/cx.js';
import styles from './LoadState.module.css';

/** A shimmering placeholder block; size it with `className` or `style`. */
export function Skeleton({ className, style }) {
  return <span className={cx(styles.block, className)} style={style} aria-hidden="true" />;
}

/**
 * Loading and error state for a screen or card: shimmering placeholders shaped by `children` while
 * loading, or a friendly message with a retry when the data failed to load.
 */
export default function LoadState({ error, label, className, children }) {
  if (error) {
    return (
      <div role="alert" className={cx(styles.error, className)}>
        <p className={styles.errorTitle}>Some data could not be loaded</p>
        <p className={styles.errorText}>{error.message}</p>
        <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className={cx(styles.loading, className)} aria-busy="true">
      <span className="visually-hidden" role="status">
        {label}
      </span>
      {children ?? <Skeleton className={styles.fill} />}
    </div>
  );
}
