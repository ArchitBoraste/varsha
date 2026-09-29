import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import Page from '../components/Page/Page.jsx';
import Placeholder from '../components/Placeholder/Placeholder.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';

export default function RegimesPage() {
  return (
    <Page
      title="Regimes"
      subtitle="What kind of rain each district is getting"
      controls={
        <>
          <RunButton />
          <LeadDaySelector />
        </>
      }
    >
      <Placeholder heading="Regime monitor">
        Monsoon phase, detected weather systems, districts by main regime, the regime and saliency maps, the
        season timeline and forecaster overrides.
      </Placeholder>
    </Page>
  );
}
