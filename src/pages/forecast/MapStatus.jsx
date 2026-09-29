import { explainSaliency } from '../../lib/explain.js';
import { formatPeople } from '../../lib/format.js';
import { likeliestPhase } from '../../lib/regimes.js';
import { MONSOON_PHASES, REGIME_BY_ID, WARNINGS } from '../../lib/scales.js';
import styles from './MapStatus.module.css';

function StatusChips({ summary }) {
  const phase = MONSOON_PHASES[likeliestPhase(summary.phase)];
  const [system] = [...summary.systems].sort((a, b) => b.confidence - a.confidence);
  const { red, orange } = summary.warnings;
  return (
    <ul className={styles.chips} aria-label="Forecast status">
      <li className={styles.chip}>
        <span className={styles.dot} style={{ background: phase.color }} />
        Monsoon phase · <strong>{phase.label}</strong>
      </li>
      {system && (
        <li className={styles.chip}>
          <span className={styles.dot} style={{ background: REGIME_BY_ID[system.regime].color }} />
          {system.label} · {system.location.split(',')[0]}
        </li>
      )}
      <li className={styles.chip}>
        <span className={styles.dot} style={{ background: WARNINGS.red.color }} />
        Red {red} · Orange {orange} districts
      </li>
    </ul>
  );
}

function ExposureCard({ exposure }) {
  const rows = [
    ['People (Census 2011)', formatPeople(exposure.population)],
    ['Landslide-prone districts', exposure.landslideProne],
    ['Large dams', exposure.dams],
  ];
  return (
    <section className={styles.card} aria-label="Exposure">
      <h2 className={styles.title}>Exposed in red and orange districts</h2>
      <dl className={styles.rows}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SaliencyCard({ summary }) {
  return (
    <section className={styles.card} aria-label="Saliency">
      <h2 className={styles.title}>What the regime engine looked at</h2>
      <p className={styles.text}>{explainSaliency(summary)}</p>
    </section>
  );
}

/** Top-right map annotations for the active layer, from the lead day's national summary. */
export default function MapStatus({ layer, summary }) {
  if (layer === 'exposure') return <ExposureCard exposure={summary.exposure} />;
  if (layer === 'saliency') return <SaliencyCard summary={summary} />;
  return <StatusChips summary={summary} />;
}
