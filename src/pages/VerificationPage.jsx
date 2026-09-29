import Page from '../components/Page/Page.jsx';
import Placeholder from '../components/Placeholder/Placeholder.jsx';

export default function VerificationPage() {
  return (
    <Page title="Verification" subtitle="How much better than the raw model, and in which regimes">
      <Placeholder heading="Verification lab">
        Headline scores against raw GFS, the baseline ladder by regime, reliability of the heavy-rain chances, fractions
        skill score by scale and scores by lead day.
      </Placeholder>
    </Page>
  );
}
