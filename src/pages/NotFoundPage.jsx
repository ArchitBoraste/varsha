import { Link } from 'react-router';
import Card from '../components/Card/Card.jsx';
import Page from '../components/Page/Page.jsx';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <Page title="Page not found">
      <Card className={styles.card}>
        This address does not match any screen. <Link to="/">Go to the forecast</Link>
      </Card>
    </Page>
  );
}
