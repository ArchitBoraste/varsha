import Card from '../../components/Card/Card.jsx';
import { cx } from '../../lib/cx.js';
import { formatSigned, formatSignedDecimal } from '../../lib/format.js';
import { KPIS } from './kpis.js';
import styles from './KpiTiles.module.css';

function Tile({ kpi, name, score, missing }) {
  const titleId = `kpi-${kpi.key}`;
  if (!score) {
    return (
      <Card className={styles.tile} aria-labelledby={titleId}>
        <div className={styles.head}>
          <h2 id={titleId} className={styles.name}>
            {name}
          </h2>
          <span className={styles.hint}>{kpi.hint}</span>
        </div>
        <p className={styles.missing}>{missing}</p>
      </Card>
    );
  }

  const { raw, varsha, ci } = score;
  const improved = kpi.better === 'lower' ? varsha < raw : varsha > raw;
  const delta = kpi.relative ? `${formatSigned(((varsha - raw) / raw) * 100)}%` : formatSignedDecimal(varsha - raw, kpi.digits);

  return (
    <Card className={styles.tile} aria-labelledby={titleId}>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.name}>
          {name}
        </h2>
        <span className={styles.hint}>{kpi.hint}</span>
      </div>
      <p className={styles.values}>
        <span className={styles.value}>
          <span className="visually-hidden">Varsha </span>
          {varsha.toFixed(kpi.digits)}
        </span>
        <span className={styles.raw}>raw {raw.toFixed(kpi.digits)}</span>
      </p>
      <p className={styles.foot}>
        <span className={cx(styles.delta, !improved && styles.worse)}>
          {delta}
          <span className="visually-hidden">{improved ? ', better than raw' : ', worse than raw'}</span>
        </span>
        <span className={styles.ci} title="Half-width of the 95% confidence interval">
          ±{ci.toFixed(kpi.digits)} (95%)
        </span>
      </p>
    </Card>
  );
}

/** Headline scores for the filtered sample: Varsha, raw and the change. */
export default function KpiTiles({ day, thresholds, missing }) {
  return (
    <div className={styles.tiles}>
      {KPIS.map((kpi) => (
        <Tile key={kpi.key} kpi={kpi} name={kpi.name(thresholds)} score={day?.[kpi.key]} missing={missing} />
      ))}
    </div>
  );
}
