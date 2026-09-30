import Card from '../../components/Card/Card.jsx';
import { cx } from '../../lib/cx.js';
import styles from './ChartCard.module.css';

/** A verification card: a title with a note on the right, then the chart or table. */
export default function ChartCard({ id, title, note, className, children }) {
  return (
    <Card aria-labelledby={id} className={cx(styles.card, className)}>
      <div className={styles.head}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {note && <span className={styles.note}>{note}</span>}
      </div>
      {children}
    </Card>
  );
}
