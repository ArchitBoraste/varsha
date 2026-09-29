import Page from '../components/Page/Page.jsx';
import Placeholder from '../components/Placeholder/Placeholder.jsx';

export default function AlertsPage() {
  return (
    <Page title="Alerts" subtitle="Draft, approve and send district warnings">
      <Placeholder heading="Alert composer">
        Draft warnings for every red and orange district, with English and Hindi messages, SMS and CAP 1.2 previews, and
        forecaster approval before anything is sent.
      </Placeholder>
    </Page>
  );
}
