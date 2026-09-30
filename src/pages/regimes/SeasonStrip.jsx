import { useMemo } from 'react';
import Card from '../../components/Card/Card.jsx';
import { mix } from '../../lib/color.js';
import { formatShortDate, joinAnd, plural } from '../../lib/format.js';
import { MONSOON_PHASES } from '../../lib/scales.js';
import { useDataset } from '../../state/useDataset.js';
import styles from './SeasonStrip.module.css';

const PHASES = Object.keys(MONSOON_PHASES);
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep'];
// Forecast days are drawn as a lighter tint of their phase.
const forecastTint = (color) => mix(color, '#FFFFFF', 0.45);

function cellColor({ phase, forecast }) {
  if (!phase) return 'var(--surface-2)';
  return forecast ? forecastTint(MONSOON_PHASES[phase].color) : MONSOON_PHASES[phase].color;
}

const cellTitle = ({ date, phase, forecast, today }) =>
  `${formatShortDate(date)}: ${phase ? `${MONSOON_PHASES[phase].label}${forecast ? ' (forecast)' : ''}` : 'still to come'}${today ? ', today' : ''}`;

function describe(days) {
  const observed = days.filter((day) => day.phase && !day.forecast);
  const counts = PHASES.map((id) => plural(observed.filter((day) => day.phase === id).length, `${id} day`));
  const forecast = days.filter((day) => day.forecast);
  const outlook = [...new Set(forecast.map((day) => MONSOON_PHASES[day.phase].label.toLowerCase()))];
  return `So far ${joinAnd(counts)}; forecast ${joinAnd(outlook)} for the next ${forecast.length} days.`;
}

/** The monsoon phase of each day of the season: observed to today, then the forecast days. */
export default function SeasonStrip() {
  const { data: timeline } = useDataset('timeline.json');

  const layout = useMemo(() => {
    if (!timeline) return null;
    const { days } = timeline;
    const at = (index) => `${(index / days.length) * 100}%`;
    return {
      today: at(days.findIndex((day) => day.today) + 1),
      months: MONTHS.map((label, month) => ({ label, left: at(days.findIndex((day) => Number(day.date.slice(5, 7)) === month + 6)) })),
      description: describe(days),
    };
  }, [timeline]);

  return (
    <Card aria-labelledby="season-title" className={styles.card}>
      <div className={styles.head}>
        <h2 id="season-title" className={styles.title}>
          {timeline ? `${timeline.season} so far` : 'Season so far'}
        </h2>
        {timeline && (
          <span className={styles.note}>
            {formatShortDate(timeline.start)} to {formatShortDate(timeline.end)} · phase by day
          </span>
        )}
      </div>

      {timeline && (
        <>
          <div className={styles.strip} role="img" aria-label={layout.description}>
            {timeline.days.map((day) => (
              <span key={day.date} className={styles.cell} style={{ background: cellColor(day) }} title={cellTitle(day)} />
            ))}
            <span className={styles.today} style={{ left: layout.today }} />
          </div>
          <div className={styles.axis} aria-hidden="true">
            {layout.months.map(({ label, left }) => (
              <span key={label} style={{ left }}>
                {label}
              </span>
            ))}
            <span className={styles.todayLabel} style={{ right: `calc(100% - ${layout.today} + 6px)` }}>
              Today
            </span>
          </div>
        </>
      )}

      <ul className={styles.legend} aria-label="Legend">
        {PHASES.map((id) => (
          <li key={id}>
            <span className={styles.swatch} style={{ background: MONSOON_PHASES[id].color }} />
            {MONSOON_PHASES[id].label}
          </li>
        ))}
        <li>
          <span className={styles.swatch} style={{ background: forecastTint(MONSOON_PHASES.active.color) }} />
          Forecast
        </li>
      </ul>
    </Card>
  );
}
