import { cx } from '../../lib/cx.js';
import { REGIME_BY_ID } from '../../lib/scales.js';
import Icon from '../Icon/Icon.jsx';
import styles from './OverrideChip.module.css';

/** Marks values a forecaster has overridden; the reason shows on hover and to screen readers. */
export default function OverrideChip({ override, size = 'md', className }) {
  const note = `Regime set to ${REGIME_BY_ID[override.regime].label} by ${override.by}: ${override.reason}`;
  return (
    <span className={cx(styles.chip, styles[size], className)} title={note}>
      <Icon name="pen" size={12} strokeWidth={2} />
      Overridden
      <span className="visually-hidden">. {note}</span>
    </span>
  );
}
