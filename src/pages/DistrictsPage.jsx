import LoadState, { Skeleton } from '../components/LoadState/LoadState.jsx';
import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import Page from '../components/Page/Page.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import { useAppState } from '../state/AppState.jsx';
import { useDataset, useIndiaGeo } from '../state/useDataset.js';
import { useForecast } from '../state/useForecast.js';
import DistrictTable from './districts/DistrictTable.jsx';
import HeavyRainMaps from './districts/HeavyRainMaps.jsx';
import styles from './DistrictsPage.module.css';

export default function DistrictsPage() {
  const { lead } = useAppState();
  const { districts, states, error: geoError } = useIndiaGeo();
  const { data: forecast, error: forecastError } = useForecast();
  const { data: meta } = useDataset('meta.json');
  const error = geoError ?? forecastError;
  const ready = districts && states && forecast && meta;

  return (
    <Page
      title="Districts"
      subtitle="Warnings for every district"
      controls={
        <>
          <RunButton />
          <LeadDaySelector />
        </>
      }
    >
      {!ready && (
        <LoadState error={error} label="Loading districts…" className={styles.loading}>
          <Skeleton className={styles.skeletonMaps} />
          <Skeleton className={styles.skeletonTable} />
        </LoadState>
      )}
      {ready && (
        <>
          <HeavyRainMaps districts={districts} states={states} forecast={forecast} lead={lead} />
          <DistrictTable forecast={forecast} leadInfo={meta.leads[lead - 1]} />
        </>
      )}
    </Page>
  );
}
