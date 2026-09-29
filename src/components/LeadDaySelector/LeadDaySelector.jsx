import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import styles from './LeadDaySelector.module.css';

/** Day 1–5 segmented control with each lead day's date; drives the global lead day. */
export default function LeadDaySelector() {
  const { lead, setLead } = useAppState();
  const { data: meta } = useDataset('meta.json');
  if (!meta) return null;

  return (
    <div role="group" aria-label="Lead day" className={styles.group}>
      {meta.leads.map((day) => (
        <button
          key={day.lead}
          type="button"
          className={styles.option}
          aria-pressed={day.lead === lead}
          title={day.period}
          onClick={() => setLead(day.lead)}
        >
          <span className={styles.day}>Day {day.lead}</span>
          <span className={styles.date}>{day.label}</span>
        </button>
      ))}
    </div>
  );
}
