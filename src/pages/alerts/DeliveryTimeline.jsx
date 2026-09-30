import Icon from '../../components/Icon/Icon.jsx';
import { istClock } from '../../lib/clock.js';
import styles from './DeliveryTimeline.module.css';

/** What happened to a sent alert on each channel, with times, and a link to its CAP file. */
export default function DeliveryTimeline({ alert, receipt }) {
  const steps = [{ channel: 'approved', label: `Approved by ${alert.record.by}`, at: receipt.sent }, ...receipt.deliveries];
  return (
    <section aria-labelledby="delivery-title" className={styles.delivery}>
      <div className={styles.head}>
        <h3 id="delivery-title" className={styles.title}>
          Delivery
        </h3>
        <a className={styles.cap} href={receipt.capUrl} target="_blank" rel="noreferrer">
          Open CAP file
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
      <ol className={styles.steps}>
        {steps.map(({ channel, label, at }) => (
          <li key={channel} className={styles.step}>
            <span className={styles.icon}>
              <Icon name="check" size={12} strokeWidth={2.4} />
            </span>
            <span className={styles.label}>{label}</span>
            <time className={styles.time} dateTime={at}>
              {istClock(at, true)} IST
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
