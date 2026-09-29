import { cx } from '../../lib/cx.js';
import styles from './Card.module.css';

/** White content card with the standard border and radius. */
export default function Card({ as: Element = 'section', className, ...props }) {
  return <Element className={cx(styles.card, className)} {...props} />;
}
