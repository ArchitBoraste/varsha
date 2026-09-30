import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import Page from '../components/Page/Page.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import SearchButton from '../components/SearchButton/SearchButton.jsx';
import DistrictPanel from './forecast/DistrictPanel.jsx';
import ForecastMap from './forecast/ForecastMap.jsx';
import styles from './ForecastPage.module.css';

export default function ForecastPage() {
  return (
    <Page
      title="Forecast"
      subtitle="Corrected all-India rainfall"
      className={styles.page}
      controls={
        <>
          <RunButton />
          <LeadDaySelector />
          <SearchButton />
        </>
      }
    >
      <ForecastMap />
      <DistrictPanel />
    </Page>
  );
}
