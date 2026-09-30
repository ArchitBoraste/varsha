import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { formatIndian, formatSigned, formatSignedDecimal } from '../../lib/format.js';
import { useDataset } from '../../state/useDataset.js';
import { filteredScores, filtersFromParams, ladderMax } from '../verification/reportView.js';
import FssChart from '../verification/FssChart.jsx';
import { KPIS } from '../verification/kpis.js';
import LadderChart from '../verification/LadderChart.jsx';
import LeadTable from '../verification/LeadTable.jsx';
import ReliabilityChart from '../verification/ReliabilityChart.jsx';
import PrintSheet, { PrintFooter, PrintHeader } from './PrintSheet.jsx';
import styles from './VerificationPrint.module.css';

function KpiTable({ day, thresholds, missing }) {
  if (!day) return <p className={styles.missing}>{missing}</p>;
  return (
    <table className={styles.kpis}>
      <thead>
        <tr>
          <th scope="col">Score</th>
          <th scope="col">Raw GFS</th>
          <th scope="col">Varsha</th>
          <th scope="col">Change</th>
          <th scope="col">95% interval</th>
        </tr>
      </thead>
      <tbody>
        {KPIS.map((kpi) => {
          const { raw, varsha, ci } = day[kpi.key];
          const change = kpi.relative ? `${formatSigned(((varsha - raw) / raw) * 100)}%` : formatSignedDecimal(varsha - raw, kpi.digits);
          return (
            <tr key={kpi.key}>
              <th scope="row">
                {kpi.name(thresholds)} <span className={styles.hint}>· {kpi.hint}</span>
              </th>
              <td>{raw.toFixed(kpi.digits)}</td>
              <td>
                <strong>{varsha.toFixed(kpi.digits)}</strong>
              </td>
              <td className={styles.better}>{change}</td>
              <td>±{ci.toFixed(kpi.digits)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Report({ report, filters }) {
  const { lead, regime, region } = filters;
  const axisMax = useMemo(() => ladderMax(report.scores), [report]);
  const { entry, day, regimeLabel, regionLabel, missing } = filteredScores(report, filters);
  const { cells } = report.regions.find(({ id }) => id === region);

  return (
    <>
      <PrintHeader
        kicker="Verification report"
        title={`${regionLabel} · ${regimeLabel} · Day ${lead}`}
        lines={[
          ['Season', report.seasons[0].label],
          ['Sample', `${report.sample.days} days · ${formatIndian(cells)} grid cells`],
          ['Truth', report.sample.truth],
        ]}
      />

      <section className={styles.block}>
        <h2 className={styles.title}>Headline scores · raw GFS against Varsha</h2>
        <KpiTable day={day} thresholds={report.thresholds} missing={missing} />
      </section>

      <div className={styles.block}>
        <LadderChart report={report} lead={lead} region={region} regime={regime} regionLabel={regionLabel} axisMax={axisMax} />
      </div>
      <div className={styles.pair}>
        <ReliabilityChart report={report} day={day} missing={missing} />
        <FssChart report={report} day={day} missing={missing} />
      </div>
      <div className={styles.block}>
        <LeadTable entry={entry} lead={lead} missing={missing} />
      </div>

      <PrintFooter />
    </>
  );
}

/** /print/verification?lead&regime&region: the Verification lab's scores for one filter set. */
export default function VerificationPrint() {
  const [params] = useSearchParams();
  const { data: report, error } = useDataset('verification.json');
  const filters = useMemo(() => report && filtersFromParams(report, params), [report, params]);

  return (
    <PrintSheet title="Verification report" ready={Boolean(report)} status={error?.message}>
      {report && <Report report={report} filters={filters} />}
    </PrintSheet>
  );
}
