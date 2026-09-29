import Card from '../../components/Card/Card.jsx';
import { formatPercent } from '../../lib/format.js';
import { THRESHOLDS } from '../../lib/risk.js';
import { probColor } from '../../lib/scales.js';
import styles from './ChanceGrid.module.css';

// Chances at or above this use white text on the darker cells.
const DARK_CELL = 0.7;

/** Chance of each heavy-rain threshold for the five lead days. */
export default function ChanceGrid({ district, lead }) {
  return (
    <Card aria-labelledby="chance-grid-title" className={styles.card}>
      <h2 id="chance-grid-title" className={styles.title}>
        Chance of heavy rain, next 5 days
      </h2>
      <table className={styles.grid}>
        <thead>
          <tr>
            <td />
            {district.days.map((day) => (
              <th key={day.lead} scope="col" className={day.lead === lead ? styles.current : undefined}>
                Day {day.lead}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {THRESHOLDS.map(({ key, mm }) => (
            <tr key={key}>
              <th scope="row" className={styles.rowLabel}>
                ≥ {mm} mm
              </th>
              {district.days.map((day) => {
                const p = day.probs[key];
                return (
                  <td
                    key={day.lead}
                    className={styles.cell}
                    style={{ background: probColor(p), color: p >= DARK_CELL ? '#FFFFFF' : 'var(--ink)' }}
                  >
                    {formatPercent(p)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
