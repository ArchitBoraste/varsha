import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import Card from '../components/Card/Card.jsx';
import Page from '../components/Page/Page.jsx';
import Placeholder from '../components/Placeholder/Placeholder.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';
import { useAppState } from '../state/AppState.jsx';
import { useDataset } from '../state/useDataset.js';
import styles from './DistrictPage.module.css';

export default function DistrictPage() {
  const { id } = useParams();
  const { selectDistrict } = useAppState();
  const { data: forecast, error } = useDataset('forecast.json');
  const district = forecast?.[id];

  // Opening a district page makes it the selected district everywhere else too.
  useEffect(() => {
    if (district) selectDistrict(id);
  }, [district, id, selectDistrict]);

  const name = district?.name ?? (forecast ? 'Unknown district' : 'District');

  return (
    <Page title={name} breadcrumb={[{ label: 'Districts', to: '/districts' }, { label: name }]} controls={<RunButton />}>
      {error && (
        <p role="alert" className={styles.message}>
          {error.message}
        </p>
      )}
      {forecast && !district && (
        <Card className={styles.message}>
          There is no district with the id “{id}”. <Link to="/districts">Back to all districts</Link>
        </Card>
      )}
      {district && (
        <>
          <Card className={styles.header}>
            <h1 className={styles.name}>{district.name}</h1>
            <span className={styles.state}>{district.state}</span>
          </Card>
          <Placeholder heading="District page">
            Five-day raw and corrected rainfall with the likely range, why Varsha changed the forecast, the chance of heavy
            rain by day and the last 30 days of forecasts against observations.
          </Placeholder>
        </>
      )}
    </Page>
  );
}
