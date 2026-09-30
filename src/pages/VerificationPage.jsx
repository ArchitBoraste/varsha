import { useMemo, useState } from 'react';
import Button from '../components/Button/Button.jsx';
import Card from '../components/Card/Card.jsx';
import Icon from '../components/Icon/Icon.jsx';
import Page from '../components/Page/Page.jsx';
import { lowerFirst } from '../lib/format.js';
import { useDataset } from '../state/useDataset.js';
import ClassifierCard from './verification/ClassifierCard.jsx';
import Filters from './verification/Filters.jsx';
import FssChart from './verification/FssChart.jsx';
import KpiTiles from './verification/KpiTiles.jsx';
import LadderChart from './verification/LadderChart.jsx';
import LeadTable from './verification/LeadTable.jsx';
import ReliabilityChart from './verification/ReliabilityChart.jsx';
import styles from './VerificationPage.module.css';

const INITIAL_FILTERS = { season: 'monsoon-2024', lead: 1, regime: 'all', region: 'all' };

/** A fixed ETS axis for every filter, so bars can be compared as the filters change. */
function ladderMax(scores) {
  let max = 0;
  for (const byRegime of Object.values(scores)) {
    for (const entry of Object.values(byRegime)) {
      for (const { ets64 } of entry?.leads ?? []) max = Math.max(max, ets64.varsha + ets64.ci);
    }
  }
  return Math.ceil(max * 10) / 10;
}

function Report({ report }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const { lead, regime, region } = filters;
  const axisMax = useMemo(() => ladderMax(report.scores), [report]);

  const entry = report.scores[region][regime];
  const day = entry?.leads[lead - 1];
  const regimeLabel = report.regimes.find(({ id }) => id === regime).label;
  const regionLabel = report.regions.find(({ id }) => id === region).label;
  // Some regions never see some regimes (no western disturbances in the south peninsula).
  const missing = `No ${lowerFirst(regimeLabel)} days in ${regionLabel}`;

  return (
    <>
      <Filters report={report} filters={filters} onChange={setFilters} />
      <KpiTiles day={day} thresholds={report.thresholds} missing={missing} />
      <div className={styles.chartsRow}>
        <LadderChart report={report} lead={lead} region={region} regime={regime} regionLabel={regionLabel} axisMax={axisMax} />
        <ReliabilityChart report={report} day={day} missing={missing} />
      </div>
      <div className={styles.tablesRow}>
        <FssChart report={report} day={day} missing={missing} />
        <LeadTable entry={entry} lead={lead} missing={missing} />
      </div>
      <ClassifierCard report={report} lead={lead} region={region} regime={regime} />
    </>
  );
}

export default function VerificationPage() {
  const { data: report, error } = useDataset('verification.json');

  return (
    <Page
      title="Verification"
      subtitle="How much better than the raw model, and in which regimes"
      controls={
        <Button variant="primary" aria-disabled="true" title="Coming in the next step">
          <Icon name="download" size={16} />
          Verification report (PDF)
        </Button>
      }
    >
      {report ? (
        <Report report={report} />
      ) : (
        <Card className={styles.status} role={error ? 'alert' : undefined}>
          {error ? error.message : 'Loading verification…'}
        </Card>
      )}
    </Page>
  );
}
