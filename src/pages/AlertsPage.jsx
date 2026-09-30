import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import LoadState, { Skeleton } from '../components/LoadState/LoadState.jsx';
import Page from '../components/Page/Page.jsx';
import { capFields, capInfos } from '../lib/alerts.js';
import { buildCap } from '../lib/cap.js';
import { scenarioNow } from '../lib/clock.js';
import { useAppState } from '../state/AppState.jsx';
import { useAlerts } from '../state/useAlerts.js';
import AlertComposer from './alerts/AlertComposer.jsx';
import AlertQueue from './alerts/AlertQueue.jsx';
import CapPreview from './alerts/CapPreview.jsx';
import { QUEUE_FILTERS } from './alerts/queueFilters.js';
import SmsPreview from './alerts/SmsPreview.jsx';
import { useAlertTexts } from './alerts/useAlertTexts.js';
import styles from './AlertsPage.module.css';

/** The composer and the two previews for the selected alert. */
function SelectedAlert({ alert, runInit, lang, onLang }) {
  const { texts, translation, hasMalayalam } = useAlertTexts(alert, lang);
  // A draft is previewed as if sent now; a sent alert shows its real send time.
  const draftTime = useMemo(() => scenarioNow(runInit), [runInit]);
  const time = alert.record?.receipt?.sent ?? draftTime;
  const xml = useMemo(
    () => buildCap(capFields(alert, time), capInfos(alert, hasMalayalam ? texts : { en: texts.en, hi: texts.hi })),
    [alert, time, texts, hasMalayalam],
  );

  return (
    <>
      <AlertComposer
        key={alert.id}
        alert={alert}
        runInit={runInit}
        lang={lang}
        onLang={onLang}
        texts={texts}
        translation={translation}
        hasMalayalam={hasMalayalam}
      />
      <div className={styles.previews}>
        <SmsPreview level={alert.level} text={texts[lang].sms} lang={lang} time={time} />
        <CapPreview xml={xml} />
      </div>
    </>
  );
}

function Loading({ error }) {
  return (
    <LoadState error={error} label="Loading alerts…">
      <Skeleton className={styles.skeletonQueue} />
      <Skeleton className={styles.skeletonComposer} />
      <Skeleton className={styles.skeletonPreviews} />
    </LoadState>
  );
}

export default function AlertsPage() {
  const { lead } = useAppState();
  const { alerts, meta, error } = useAlerts(lead);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [lang, setLang] = useState('en');

  // Ask Varsha's "Draft alerts" action opens this screen with ?ids= of districts.
  const districtIds = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];
  const fromAssistant = alerts && districtIds.length ? alerts.filter((alert) => districtIds.includes(alert.districtId)) : null;
  const pool = fromAssistant ?? alerts ?? [];
  const { test } = QUEUE_FILTERS.find(({ id }) => id === filter);
  const visible = pool.filter(test);
  const selected = visible.find(({ id }) => id === selectedId) ?? visible[0];

  return (
    <Page
      title="Alerts"
      subtitle="Draft, approve and send district warnings"
      className={styles.page}
      controls={<LeadDaySelector />}
    >
      {alerts ? (
        <>
          <AlertQueue
            alerts={pool}
            visible={visible}
            draftCount={alerts.filter(({ status }) => status === 'draft').length}
            lead={lead}
            filter={filter}
            onFilter={setFilter}
            fromAssistant={fromAssistant && `${fromAssistant.length === 1 ? '1 district' : `${fromAssistant.length} districts`}`}
            onClearDistricts={() => setSearchParams({})}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
          {selected ? (
            <SelectedAlert alert={selected} runInit={meta.run.init} lang={lang} onLang={setLang} />
          ) : (
            <p className={styles.empty}>
              {alerts.length ? 'Choose an alert on the left to review it.' : `Day ${lead} has no red or orange warnings. Drafts appear here when the forecast calls for one.`}
            </p>
          )}
        </>
      ) : (
        <Loading error={error} />
      )}
    </Page>
  );
}
