import Card from '../components/Card/Card.jsx';
import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import Page from '../components/Page/Page.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import SearchButton from '../components/SearchButton/SearchButton.jsx';
import { useAppState } from '../state/AppState.jsx';
import { useIndiaGeo } from '../state/useDataset.js';
import { useForecast, useNationalSummary } from '../state/useForecast.js';
import OverrideCard from './regimes/OverrideCard.jsx';
import OverrideLog from './regimes/OverrideLog.jsx';
import RegimeMap from './regimes/RegimeMap.jsx';
import SeasonStrip from './regimes/SeasonStrip.jsx';
import { PhaseCard, RegimeCountsCard, SystemsCard } from './regimes/SummaryCards.jsx';
import styles from './RegimesPage.module.css';

export default function RegimesPage() {
  const { lead } = useAppState();
  const { districts, states, error: geoError } = useIndiaGeo();
  const { data: forecast, error: forecastError } = useForecast();
  const summary = useNationalSummary(lead);
  const error = geoError ?? forecastError;
  const ready = districts && states && forecast && summary;

  return (
    <Page
      title="Regimes"
      subtitle="What kind of rain each district is getting"
      controls={
        <>
          <RunButton />
          <LeadDaySelector />
          <SearchButton />
        </>
      }
    >
      {!ready && (
        <Card className={styles.status} role={error ? 'alert' : undefined}>
          {error ? error.message : 'Loading regimes…'}
        </Card>
      )}
      {ready && (
        <>
          <div className={styles.summary}>
            <PhaseCard phase={summary.phase} />
            <SystemsCard systems={summary.systems} />
            <RegimeCountsCard counts={summary.regimes} />
          </div>
          <div className={styles.main}>
            <RegimeMap districts={districts} states={states} forecast={forecast} lead={lead} />
            <div className={styles.side}>
              <SeasonStrip />
              <OverrideCard />
              <OverrideLog />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
