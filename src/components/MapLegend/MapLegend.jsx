import { cx } from '../../lib/cx.js';
import styles from './MapLegend.module.css';

/** Map key: a title and swatches of { color, label?, range? }. Position it with `className`. */
export default function MapLegend({ title, items, className }) {
  return (
    <div className={cx(styles.legend, className)}>
      <p className={styles.title}>{title}</p>
      <ul className={styles.items}>
        {items.map(({ color, label, range }) => (
          <li key={color} className={styles.item}>
            <span className={styles.swatch} style={{ background: color }} />
            {label && <span className={styles.label}>{label}</span>}
            {range && <span className={styles.range}>{range}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
