import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import LinkButton from '../components/Button/LinkButton.jsx';
import Card from '../components/Card/Card.jsx';
import Icon from '../components/Icon/Icon.jsx';
import LoadState, { Skeleton } from '../components/LoadState/LoadState.jsx';
import Page from '../components/Page/Page.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import { useAppState } from '../state/AppState.jsx';
import { useDataset } from '../state/useDataset.js';
import { useForecast } from '../state/useForecast.js';
import ChanceGrid from './district/ChanceGrid.jsx';
import DistrictHeader from './district/DistrictHeader.jsx';
import DriversCard from './district/DriversCard.jsx';
import FiveDayChart from './district/FiveDayChart.jsx';
import HistoryCard from './district/HistoryCard.jsx';
import styles from './DistrictPage.module.css';

export default function DistrictPage() {
  const { id } = useParams();
  const { lead, selectDistrict } = useAppState();
  const { data: forecast, error } = useForecast();
  const { data: meta } = useDataset('meta.json');
  const district = forecast?.[id];

  // Opening a district page makes it the selected district everywhere else too.
  useEffect(() => {
    if (district) selectDistrict(id);
  }, [district, id, selectDistrict]);

  const name = district?.name ?? (forecast ? 'Unknown district' : 'District');

  return (
    <Page
      title={name}
      breadcrumb={[{ label: 'Districts', to: '/districts' }, { label: name }]}
      controls={
        <>
          <RunButton />
          {district && (
            <LinkButton to={`/print/district/${id}?lead=${lead}`} target="_blank" rel="noopener">
              <Icon name="download" size={16} />
              District bulletin
              <span className="visually-hidden"> (opens in a new tab)</span>
            </LinkButton>
          )}
        </>
      }
    >
      {!forecast && (
        <LoadState error={error} label="Loading district…" className={styles.loading}>
          <Skeleton className={styles.skeletonHeader} />
          <Skeleton className={styles.skeletonBody} />
        </LoadState>
      )}
      {forecast && !district && (
        <Card className={styles.message}>
          There is no district with the id “{id}”. <Link to="/districts">Back to all districts</Link>
        </Card>
      )}
      {district && meta && (
        <>
          <DistrictHeader id={id} district={district} lead={lead} />
          <div className={styles.columns}>
            <div className={styles.main}>
              <FiveDayChart district={district} leads={meta.leads} />
              <DriversCard day={district.days[lead - 1]} />
            </div>
            <div className={styles.side}>
              <ChanceGrid district={district} lead={lead} />
              <HistoryCard id={id} name={district.name} />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
