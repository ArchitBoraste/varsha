import { useMemo } from 'react';
import Card from '../../components/Card/Card.jsx';
import { formatShortDate } from '../../lib/format.js';
import { historyScores } from '../../lib/scores.js';
import useElementSize from '../../lib/useElementSize.js';
import { useDataset } from '../../state/useDataset.js';
import styles from './HistoryCard.module.css';

const CHART_HEIGHT = 96;
const PAD = 4;

const SERIES = [
  { key: 'observed', label: 'Observed (IMD)', className: styles.observed },
  { key: 'varsha', label: 'Varsha', className: styles.varsha },
  { key: 'raw', label: 'Raw', className: styles.raw },
];

function polyline(values, width, max) {
  const step = (width - 2 * PAD) / (values.length - 1);
  return values.map((mm, i) => `${(PAD + i * step).toFixed(1)},${(PAD + (1 - mm / max) * (CHART_HEIGHT - 2 * PAD)).toFixed(1)}`).join(' ');
}

/** The last 30 days of Day 1 forecasts against observations, with two summary scores. */
export default function HistoryCard({ id, name }) {
  const { data: history, error } = useDataset('history.json');
  const [boxRef, size] = useElementSize();
  const series = history?.districts[id];
  const scores = useMemo(() => series && historyScores(series), [series]);
  const max = series ? Math.max(10, ...SERIES.flatMap(({ key }) => series[key])) * 1.05 : 1;

  return (
    <Card aria-labelledby="history-title" className={styles.card}>
      <h2 id="history-title" className={styles.title}>
        Last 30 days in {name} · Day 1 forecasts
      </h2>

      <div ref={boxRef} className={styles.chart}>
        {error && <p className={styles.status}>{error.message}</p>}
        {series && size.width > 0 && (
          <svg
            width={size.width}
            height={CHART_HEIGHT}
            role="img"
            aria-label={`Observed, Varsha and raw rainfall in ${name}, ${formatShortDate(history.dates[0])} to ${formatShortDate(history.dates.at(-1))}`}
          >
            {SERIES.map(({ key, className }) => (
              <polyline key={key} className={className} points={polyline(series[key], size.width, max)} />
            ))}
          </svg>
        )}
      </div>

      <div className={styles.legend} aria-hidden="true">
        {SERIES.map(({ key, label, className }) => (
          <span key={key}>
            <svg width="14" height="2" className={className}>
              <line x1="0" x2="14" y1="1" y2="1" />
            </svg>
            {label}
          </span>
        ))}
      </div>

      {scores && (
        <dl className={styles.tiles}>
          <div className={styles.tile}>
            <dt>Mean absolute error, mm/day</dt>
            <dd>
              <strong>{Math.round(scores.mae.varsha)}</strong> vs raw {Math.round(scores.mae.raw)}
            </dd>
          </div>
          <div className={styles.tile}>
            <dt>Heavy-rain days caught</dt>
            <dd>
              {scores.heavyDays > 0 ? (
                <>
                  <strong>
                    {scores.caught.varsha} of {scores.heavyDays}
                  </strong>{' '}
                  vs raw {scores.caught.raw}
                </>
              ) : (
                <strong>None observed</strong>
              )}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
