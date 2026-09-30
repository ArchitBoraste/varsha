import { useEffect } from 'react';
import { useParams } from 'react-router';
import OverrideChip from '../../components/OverrideChip/OverrideChip.jsx';
import RegimeChip from '../../components/RegimeChip/RegimeChip.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { explainCorrection } from '../../lib/explain.js';
import { formatPeople, formatPercent, joinAnd, plural } from '../../lib/format.js';
import { LEVEL_THRESHOLDS } from '../../lib/risk.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import { useForecast } from '../../state/useForecast.js';
import ChanceGrid from '../district/ChanceGrid.jsx';
import DriversCard from '../district/DriversCard.jsx';
import FiveDayChart from '../district/FiveDayChart.jsx';
import PrintSheet, { PrintFooter, PrintHeader } from './PrintSheet.jsx';
import { formatIstTime, useLeadParam } from './printFormat.js';
import styles from './DistrictPrint.module.css';

function exposureText({ population, landslideProne, dams }) {
  const parts = [`${formatPeople(population)} people (Census 2011)`, landslideProne ? 'landslide-prone hills' : null];
  if (dams.length) parts.push(`${plural(dams.length, 'large dam')}: ${joinAnd(dams)}`);
  return joinAnd(parts.filter(Boolean));
}

function DistrictBulletin({ district, meta, lead }) {
  const day = district.days[lead - 1];
  const info = meta.leads[lead - 1];
  const { key, mm } = LEVEL_THRESHOLDS[day.warning];
  const stats = [
    ['Varsha', `${day.corrected} mm`],
    ['Raw GFS', `${day.raw} mm`],
    ['Likely range', `${day.range[0]}–${day.range[1]} mm`],
    [`Chance ≥ ${mm} mm`, formatPercent(day.probs[key])],
  ];

  return (
    <>
      <PrintHeader
        kicker={`District bulletin · Day ${lead}`}
        title={`${district.name}, ${district.state}`}
        meta={meta}
        lines={[
          ['Run', `${meta.run.model} · ${meta.run.longLabel}`],
          ['Valid', `${formatIstTime(info.validFrom)} to ${formatIstTime(info.validTo)}`],
        ]}
      />

      <section className={styles.summary} aria-label="Headline">
        <div className={styles.badges}>
          <WarningBadge level={day.warning} showAction />
          <RegimeChip weights={day.p} />
          {day.override && <OverrideChip override={day.override} />}
        </div>
        <dl className={styles.stats}>
          {stats.map(([label, value]) => (
            <div key={label} className={styles.stat}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <FiveDayChart district={district} leads={meta.leads} />

      <div className={styles.columns}>
        <ChanceGrid district={district} lead={lead} />
        <DriversCard day={day} compact />
      </div>

      <section className={styles.text}>
        <p>
          <strong>Why this correction.</strong> {explainCorrection(district, day)}
        </p>
        {day.override && (
          <p>
            <strong>Forecaster override.</strong> {day.override.by}: {day.override.reason}
          </p>
        )}
        <p>
          <strong>Exposure.</strong> {exposureText(district.exposure)}.
        </p>
      </section>

      <PrintFooter />
    </>
  );
}

/** /print/district/:id?lead=N: a one-page bulletin for one district. */
export default function DistrictPrint() {
  const { id } = useParams();
  const lead = useLeadParam();
  const { lead: appLead, setLead } = useAppState();
  const { data: forecast, error } = useForecast();
  const { data: meta } = useDataset('meta.json');
  const district = forecast?.[id];

  // The shared district charts highlight the app's lead day.
  useEffect(() => setLead(lead), [lead, setLead]);

  const status = error?.message ?? (forecast && !district ? `There is no district with the id “${id}”.` : undefined);
  const ready = Boolean(district && meta && appLead === lead);

  return (
    <PrintSheet title={district ? `${district.name} bulletin, Day ${lead}` : 'District bulletin'} ready={ready} status={status}>
      {ready && <DistrictBulletin district={district} meta={meta} lead={lead} />}
    </PrintSheet>
  );
}
