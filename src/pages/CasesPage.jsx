import { useMemo, useState } from 'react';
import Card from '../components/Card/Card.jsx';
import Page from '../components/Page/Page.jsx';
import { useDataset, useIndiaGeo } from '../state/useDataset.js';
import CaseList from './cases/CaseList.jsx';
import CaseReplay from './cases/CaseReplay.jsx';
import styles from './CasesPage.module.css';

export default function CasesPage() {
  const { data, error: casesError } = useDataset('cases.json');
  const { districts, states, error: geoError } = useIndiaGeo();
  const [caseId, setCaseId] = useState(null);
  const error = casesError ?? geoError;

  // Names come from the boundaries; the replay data holds only the amounts.
  const places = useMemo(
    () => districts && Object.fromEntries(districts.map(({ properties }) => [properties.id, properties])),
    [districts],
  );
  const selected = data && (data.cases.find(({ id }) => id === caseId) ?? data.cases[0]);

  return (
    <Page title="Case studies" subtitle="Replay past events: raw, corrected and what actually fell" className={styles.page}>
      {selected && places && states ? (
        <>
          <CaseList cases={data.cases} selectedId={selected.id} onSelect={setCaseId} />
          <CaseReplay key={selected.id} caseStudy={selected} districts={districts} states={states} places={places} />
        </>
      ) : (
        <Card className={styles.status} role={error ? 'alert' : undefined}>
          {error ? error.message : 'Loading case studies…'}
        </Card>
      )}
    </Page>
  );
}
