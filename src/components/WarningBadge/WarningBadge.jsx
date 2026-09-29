import { cx } from '../../lib/cx.js';
import { WARNINGS } from '../../lib/scales.js';
import styles from './WarningBadge.module.css';

/** IMD warning colour chip: "Red", or "Red · Take action" with `showAction`. */
export default function WarningBadge({ level, showAction = false, size = 'md' }) {
  const { label, action, color, text } = WARNINGS[level];
  return (
    <span className={cx(styles.badge, styles[size])} style={{ background: color, color: text }}>
      {showAction ? `${label} · ${action}` : label}
    </span>
  );
}
