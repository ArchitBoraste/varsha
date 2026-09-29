import Button from '../components/Button/Button.jsx';
import Icon from '../components/Icon/Icon.jsx';
import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import Page from '../components/Page/Page.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import { useAppState } from '../state/AppState.jsx';
import DistrictPanel from './forecast/DistrictPanel.jsx';
import ForecastMap from './forecast/ForecastMap.jsx';
import styles from './ForecastPage.module.css';

export default function ForecastPage() {
  const { openSearch } = useAppState();
  return (
    <Page
      title="Forecast"
      subtitle="Corrected all-India rainfall"
      className={styles.page}
      controls={
        <>
          <RunButton />
          <LeadDaySelector />
          <Button
            square
            aria-label="Search districts"
            aria-keyshortcuts="Control+K Meta+K"
            title="Search districts (Ctrl+K)"
            onClick={openSearch}
          >
            <Icon name="search" size={16} />
          </Button>
        </>
      }
    >
      <ForecastMap />
      <DistrictPanel />
    </Page>
  );
}
