import { cx } from '../../lib/cx.js';
import styles from './MapLegend.module.css';

// Symbols for legend entries that are map markers rather than fills.
const SHAPES = {
  triangle: (color) => <path d="M7 2l6 10H1z" fill={color} />,
  square: (color) => <rect x="3" y="3" width="8" height="8" fill={color} />,
  arrow: (color) => (
    <>
      <path d="M1 7h8" stroke={color} strokeWidth="1.5" />
      <path d="M8 3.5L13 7l-5 3.5z" fill={color} />
    </>
  ),
};

function Swatch({ color, shape }) {
  if (!shape) return <span className={styles.swatch} style={{ background: color }} />;
  return (
    <svg className={styles.symbol} viewBox="0 0 14 14" aria-hidden="true">
      {SHAPES[shape](color)}
    </svg>
  );
}

/**
 * Map key: an optional title and entries of { color, label?, range?, shape? }, where `shape` is
 * 'triangle', 'square' or 'arrow' for marker overlays. Position it with `className`.
 */
export default function MapLegend({ title, items, className }) {
  return (
    <div className={cx(styles.legend, className)}>
      {title && <p className={styles.title}>{title}</p>}
      <ul className={styles.items}>
        {items.map(({ color, label, range, shape }) => (
          <li key={`${color}${label ?? range}`} className={styles.item}>
            <Swatch color={color} shape={shape} />
            {label && <span className={styles.label}>{label}</span>}
            {range && <span className={styles.range}>{range}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
