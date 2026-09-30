import { useCallback, useMemo } from 'react';
import IndiaMap from '../../components/IndiaMap';
import OverrideChip from '../../components/OverrideChip/OverrideChip.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { isAlertLevel } from '../../lib/alertText.js';
import { formatPeople, formatPercent } from '../../lib/format.js';
import { topRegime } from '../../lib/regimes.js';
import { THRESHOLDS } from '../../lib/risk.js';
import { WARNINGS } from '../../lib/scales.js';
import { useDataset, useIndiaGeo } from '../../state/useDataset.js';
import { useForecast, useNationalSummary } from '../../state/useForecast.js';
import PrintSheet, { PrintFooter, PrintHeader } from './PrintSheet.jsx';
import { formatIstTime, useLeadParam } from './printFormat.js';
import styles from './BulletinPrint.module.css';

const MAP_WIDTH = 330;
const MAP_HEIGHT = 380;
const WARNING_RANK = { red: 0, orange: 1 };
const RULES = {
  red: 'Chance of ≥ 204.5 mm at least 60%',
  orange: 'Chance of ≥ 115.6 mm at least 50%',
  yellow: 'Chance of ≥ 64.5 mm at least 50%',
  green: 'Below the heavy-rain thresholds',
};

/** Red and orange district-days, most severe and most likely first. */
function warnedRows(forecast, lead) {
  const chance = ({ day }) => day.probs[day.warning === 'red' ? 'p204' : 'p115'];
  return Object.entries(forecast)
    .map(([id, district]) => ({ id, district, day: district.days[lead - 1] }))
    .filter(({ day }) => isAlertLevel(day.warning))
    .sort((a, b) => WARNING_RANK[a.day.warning] - WARNING_RANK[b.day.warning] || chance(b) - chance(a) || b.day.corrected - a.day.corrected);
}

function Bulletin({ districts, states, forecast, meta, summary, lead }) {
  const info = meta.leads[lead - 1];
  const rows = useMemo(() => warnedRows(forecast, lead), [forecast, lead]);
  const getFill = useCallback((feature) => WARNINGS[forecast[feature.properties.id].days[lead - 1].warning].color, [forecast, lead]);
  const { warnings, exposure } = summary;

  return (
    <>
      <PrintHeader
        kicker="All-India district bulletin"
        title={`Day ${lead} · 24 h ending 08:30 IST, ${info.label} ${info.date.slice(0, 4)}`}
        meta={meta}
        lines={[
          ['Run', `${meta.run.model} · ${meta.run.longLabel}`],
          ['Valid', `${formatIstTime(info.validFrom)} to ${formatIstTime(info.validTo)}`],
        ]}
      />

      <section className={styles.overview}>
        <figure className={styles.mapFigure}>
          <IndiaMap
            features={districts}
            borders={states}
            getFill={getFill}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            label={`Warning level by district, Day ${lead}`}
          />
          <figcaption className={styles.legend}>
            {Object.values(WARNINGS).map(({ id, label, action, color }) => (
              <span key={id} className={styles.legendItem}>
                <span className={styles.swatch} style={{ background: color }} />
                <span>
                  <strong>
                    {label} · {action}
                  </strong>
                  <br />
                  {RULES[id]}
                </span>
              </span>
            ))}
          </figcaption>
        </figure>

        <div className={styles.facts}>
          <h2 className={styles.sectionTitle}>Districts by warning</h2>
          <ul className={styles.counts}>
            {Object.values(WARNINGS).map(({ id, label, color, text }) => (
              <li key={id} className={styles.count} style={{ background: color, color: text }}>
                <span className={styles.countValue}>{warnings[id]}</span>
                {label}
              </li>
            ))}
          </ul>

          <h2 className={styles.sectionTitle}>Exposed in red and orange districts</h2>
          <dl className={styles.exposure}>
            <div>
              <dt>People (Census 2011)</dt>
              <dd>{formatPeople(exposure.population)}</dd>
            </div>
            <div>
              <dt>Landslide-prone districts</dt>
              <dd>{exposure.landslideProne}</dd>
            </div>
            <div>
              <dt>Large dams</dt>
              <dd>{exposure.dams}</dd>
            </div>
          </dl>

          <h2 className={styles.sectionTitle}>Weather systems</h2>
          <ul className={styles.systems}>
            {summary.systems.map(({ label, location, confidence }) => (
              <li key={label}>
                {label}, {location} <span className={styles.muted}>· {formatPercent(confidence)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className={styles.tableTitle}>Red and orange districts · {rows.length}</h2>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">District</th>
                <th scope="col">State</th>
                <th scope="col" className={styles.num}>
                  Varsha mm
                </th>
                <th scope="col" className={styles.num}>
                  Likely range
                </th>
                {THRESHOLDS.map(({ key, mm }) => (
                  <th key={key} scope="col" className={styles.num}>
                    ≥ {mm}
                  </th>
                ))}
                <th scope="col">Regime</th>
                <th scope="col">Warning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ id, district, day }) => (
                <tr key={id}>
                  <th scope="row">
                    {district.name}
                    {day.override && <OverrideChip override={day.override} size="sm" className={styles.override} />}
                  </th>
                  <td>{district.state}</td>
                  <td className={styles.num}>
                    <strong>{day.corrected}</strong>
                  </td>
                  <td className={styles.num}>
                    {day.range[0]}–{day.range[1]}
                  </td>
                  {THRESHOLDS.map(({ key }) => (
                    <td key={key} className={styles.num}>
                      {formatPercent(day.probs[key])}
                    </td>
                  ))}
                  <td>{topRegime(day.p).short}</td>
                  <td>
                    <WarningBadge level={day.warning} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.none}>No district reaches an orange or red warning on Day {lead}.</p>
        )}
        <p className={styles.note}>
          Chances are of 24-hour rainfall reaching the IMD thresholds (mm). Varsha is the regime-aware correction of
          the raw GFS forecast; the likely range is where the amount falls in most cases.
        </p>
      </section>

      <PrintFooter />
    </>
  );
}

/** /print/bulletin?lead=N: the all-India district bulletin for one lead day on A4. */
export default function BulletinPrint() {
  const lead = useLeadParam();
  const { districts, states, error: geoError } = useIndiaGeo();
  const { data: forecast, error: forecastError } = useForecast();
  const { data: meta } = useDataset('meta.json');
  const summary = useNationalSummary(lead);
  const error = geoError ?? forecastError;
  const ready = Boolean(districts && states && forecast && meta && summary);

  return (
    <PrintSheet title={`All-India bulletin, Day ${lead}`} ready={ready} status={error?.message}>
      {ready && <Bulletin districts={districts} states={states} forecast={forecast} meta={meta} summary={summary} lead={lead} />}
    </PrintSheet>
  );
}
