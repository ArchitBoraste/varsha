import SegmentedControl from '../../components/SegmentedControl/SegmentedControl.jsx';
import { cx } from '../../lib/cx.js';
import { formatPercent } from '../../lib/format.js';
import { WARNINGS } from '../../lib/scales.js';
import { QUEUE_FILTERS } from './queueFilters.js';
import styles from './AlertQueue.module.css';

const STATUS_LABELS = { sent: 'Sent', rejected: 'Rejected' };

function AlertCard({ alert, selected, onSelect }) {
  return (
    <li>
      <button
        type="button"
        className={cx(styles.card, selected && styles.selected, alert.status === 'rejected' && styles.rejected)}
        aria-pressed={selected}
        onClick={() => onSelect(alert.id)}
      >
        <span className={styles.bar} style={{ background: WARNINGS[alert.level].color }} />
        <span className={styles.main}>
          <span className={styles.name}>
            {alert.name}, {alert.state}
          </span>
          <span className={styles.event}>{alert.event}</span>
        </span>
        <span className={styles.side}>
          <span className={styles.chance}>{formatPercent(alert.chance.p)}</span>
          <span className={cx(styles.level, alert.status === 'sent' && styles.sent)}>
            {STATUS_LABELS[alert.status] ?? WARNINGS[alert.level].label}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * The lead day's alerts with the drafts count, filters and the optional district filter from
 * Ask Varsha (`fromAssistant`, cleared with `onClearDistricts`).
 */
export default function AlertQueue({ alerts, visible, draftCount, lead, filter, onFilter, fromAssistant, onClearDistricts, selectedId, onSelect }) {
  const options = QUEUE_FILTERS.map(({ id, label, test }) => ({ id, label: `${label} ${alerts.filter(test).length}` }));

  return (
    <section aria-labelledby="queue-title" className={styles.queue}>
      <div className={styles.head}>
        <h2 id="queue-title" className={styles.title}>
          Awaiting approval · {draftCount}
        </h2>
        <span className={styles.run}>Day {lead} · from the 00 UTC run</span>
      </div>

      <SegmentedControl label="Show alerts" options={options} value={filter} onChange={onFilter} />

      {fromAssistant && (
        <p className={styles.fromAssistant}>
          {fromAssistant} from Ask Varsha
          <button type="button" className={styles.showAll} onClick={onClearDistricts}>
            Show all
          </button>
        </p>
      )}

      {visible.length > 0 ? (
        <ul className={styles.list} aria-label="Alerts">
          {visible.map((alert) => (
            <AlertCard key={alert.id} alert={alert} selected={alert.id === selectedId} onSelect={onSelect} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>
          {alerts.length ? 'No alert matches this filter.' : `No district has a red or orange warning on Day ${lead}, so there is nothing to approve.`}
        </p>
      )}
    </section>
  );
}
