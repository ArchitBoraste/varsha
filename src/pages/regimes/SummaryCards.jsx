import Card from '../../components/Card/Card.jsx';
import { formatPercent } from '../../lib/format.js';
import { likeliestPhase } from '../../lib/regimes.js';
import { MONSOON_PHASES, REGIMES, REGIME_BY_ID } from '../../lib/scales.js';
import styles from './SummaryCards.module.css';

const PHASES = Object.keys(MONSOON_PHASES);

/** All-India monsoon phase: the likeliest phase and the chance of each. */
export function PhaseCard({ phase }) {
  const likeliest = likeliestPhase(phase);
  const description = PHASES.map((id) => `${MONSOON_PHASES[id].label} ${formatPercent(phase[id])}`).join(', ');
  return (
    <Card className={styles.card} aria-labelledby="phase-title">
      <h2 id="phase-title" className={styles.eyebrow}>
        Monsoon phase · all India
      </h2>
      <p className={styles.phase}>
        <span className={styles.phaseName}>{MONSOON_PHASES[likeliest].label}</span>
        <span className={styles.phaseShare}>{formatPercent(phase[likeliest])}</span>
      </p>
      <div className={styles.phaseBar} role="img" aria-label={`Chance of each phase: ${description}`}>
        {PHASES.map((id) => (
          <span key={id} style={{ width: formatPercent(phase[id]), background: MONSOON_PHASES[id].color }} />
        ))}
      </div>
      <p className={styles.phaseLabels} aria-hidden="true">
        {PHASES.map((id) => (
          <span key={id}>
            {MONSOON_PHASES[id].label} {formatPercent(phase[id])}
          </span>
        ))}
      </p>
    </Card>
  );
}

/** The weather systems the regime engine's tracker found, with its confidence in each. */
export function SystemsCard({ systems }) {
  return (
    <Card className={styles.card} aria-labelledby="systems-title">
      <h2 id="systems-title" className={styles.eyebrow}>
        Weather systems detected
      </h2>
      <ul className={styles.systems}>
        {systems.map(({ type, label, location, confidence, regime }) => (
          <li key={type} className={styles.system}>
            <span className={styles.dot} style={{ background: REGIME_BY_ID[regime].color }} />
            <span className={styles.systemName}>{label}</span>
            <span className={styles.location} title={location}>
              {location}
            </span>
            <span className={styles.confidence}>
              <span className="visually-hidden">confidence </span>
              {formatPercent(confidence)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** How many districts have each regime as their largest share. */
export function RegimeCountsCard({ counts }) {
  const largest = Math.max(1, ...Object.values(counts));
  return (
    <Card className={styles.card} aria-labelledby="counts-title">
      <h2 id="counts-title" className={styles.eyebrow}>
        Districts by main regime
      </h2>
      <ul className={styles.counts}>
        {REGIMES.map(({ id, label, color }) => (
          <li key={id} className={styles.count}>
            <span className={styles.countLabel}>
              <span className={styles.smallDot} style={{ background: color }} />
              {label}
            </span>
            <span className={styles.track} aria-hidden="true">
              <span style={{ width: `${(counts[id] / largest) * 100}%`, background: color }} />
            </span>
            <span className={styles.countValue}>{counts[id]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
