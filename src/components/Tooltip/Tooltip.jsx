import styles from './Tooltip.module.css';

const GAP = 14;
// Space kept for the tooltip before it flips to the other side of the pointer, px.
const ROOM_X = 220;
const ROOM_Y = 90;

/**
 * Dark hover tooltip placed next to (x, y) inside a positioned container of `bounds` size,
 * flipping left or up near the container's edges. Decorative: the content is available elsewhere.
 */
export default function Tooltip({ x, y, bounds, children }) {
  const left = x > bounds.width - ROOM_X ? `calc(${x - GAP}px - 100%)` : `${x + GAP}px`;
  const top = y > bounds.height - ROOM_Y ? `calc(${y - GAP}px - 100%)` : `${y + GAP}px`;
  return (
    <div className={styles.tooltip} style={{ transform: `translate(${left}, ${top})` }} aria-hidden="true">
      {children}
    </div>
  );
}
