import { Outlet } from 'react-router';
import AssistantDrawer from '../AssistantDrawer/AssistantDrawer.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import styles from './AppShell.module.css';

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <Sidebar />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <AssistantDrawer />
    </div>
  );
}
