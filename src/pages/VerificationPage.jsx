import { useMemo, useState } from 'react';
import LinkButton from '../components/Button/LinkButton.jsx';
import Icon from '../components/Icon/Icon.jsx';
import LoadState, { Skeleton } from '../components/LoadState/LoadState.jsx';
import Page from '../components/Page/Page.jsx';
import { useDataset } from '../state/useDataset.js';
import ClassifierCard from './verification/ClassifierCard.jsx';
import Filters from './verification/Filters.jsx';
import { INITIAL_FILTERS, filteredScores, ladderMax } from './verification/reportView.js';
import FssChart from './verification/FssChart.jsx';
import KpiTiles from './verification/KpiTiles.jsx';
import LadderChart from './verification/LadderChart.jsx';
import LeadTable from './verification/LeadTable.jsx';
import ReliabilityChart from './verification/ReliabilityChart.jsx';
import styles from './VerificationPage.module.css';

function Report({ report, filters, onFilters }) {
  const { lead, regime, region } = filters;
  const axisMax = useMemo(() => ladderMax(report.scores), [report]);
  const { entry, day, regionLabel, missing } = filteredScores(report, filters);

  return (
    <>
      <Filters report={report} filters={filters} onChange={onFilters} />
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
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const reportUrl = `/print/verification?lead=${filters.lead}&regime=${filters.regime}&region=${filters.region}`;

  return (
    <Page
      title="Verification"
      subtitle="How much better than the raw model, and in which regimes"
      controls={
        <LinkButton variant="primary" to={reportUrl} target="_blank" rel="noopener">
          <Icon name="download" size={16} />
          Verification report (PDF)
          <span className="visually-hidden"> (opens in a new tab)</span>
        </LinkButton>
      }
    >
      {report ? (
        <Report report={report} filters={filters} onFilters={setFilters} />
      ) : (
        <LoadState error={error} label="Loading verification…" className={styles.loading}>
          <Skeleton className={styles.skeletonFilters} />
          <Skeleton className={styles.skeletonTiles} />
          <Skeleton className={styles.skeletonCharts} />
        </LoadState>
      )}
    </Page>
  );
}
