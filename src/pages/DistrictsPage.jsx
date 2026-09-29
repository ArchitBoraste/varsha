import LeadDaySelector from '../components/LeadDaySelector/LeadDaySelector.jsx';
import Page from '../components/Page/Page.jsx';
import Placeholder from '../components/Placeholder/Placeholder.jsx';
import RunButton from '../components/RunButton/RunButton.jsx';

export default function DistrictsPage() {
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
      <Placeholder heading="District outlook">
        Chance of heavy, very heavy and extremely heavy rain for every district, and a searchable table sorted by risk
        with CSV and bulletin export.
      </Placeholder>
    </Page>
  );
}
