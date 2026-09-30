import { cx } from '../../lib/cx.js';
import ChartCard from './ChartCard.jsx';
import chartStyles from './ChartBody.module.css';
import styles from './LeadTable.module.css';

const COLUMNS = [
  { key: 'rmse', label: 'RMSE mm', digits: 1 },
  { key: 'ets64', label: 'ETS ≥ 64.5', digits: 2 },
  { key: 'pod115', label: 'POD ≥ 115.6', digits: 2 },
];

/** Raw → Varsha for each lead day of the filtered sample; the filtered lead day is highlighted. */
export default function LeadTable({ entry, lead, missing }) {
  return (
    <ChartCard id="lead-table-title" title="Scores by lead day · raw → Varsha">
      {entry ? (
        <table className={styles.table} aria-labelledby="lead-table-title">
          <thead>
            <tr>
              <th scope="col">Lead</th>
              {COLUMNS.map(({ key, label }) => (
                <th key={key} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entry.leads.map((day) => (
              <tr key={day.lead} className={cx(day.lead === lead && styles.current)} aria-current={day.lead === lead || undefined}>
                <th scope="row">Day {day.lead}</th>
                {COLUMNS.map(({ key, digits }) => (
                  <td key={key}>
                    <span className={styles.raw}>{day[key].raw.toFixed(digits)} → </span>
                    <strong>{day[key].varsha.toFixed(digits)}</strong>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={chartStyles.missing}>{missing}</p>
      )}
    </ChartCard>
  );
}
