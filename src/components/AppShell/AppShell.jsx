import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAppState } from '../../state/AppState.jsx';
import AssistantDrawer from '../AssistantDrawer/AssistantDrawer.jsx';
import CommandPalette from '../CommandPalette/CommandPalette.jsx';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import Toast from '../Toast/Toast.jsx';
import styles from './AppShell.module.css';

/** Alt+Shift+R resets the demo between recordings; it has no visible control on purpose. */
function useDemoReset() {
  const { resetDemo } = useAppState();
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.shiftKey && event.code === 'KeyR') {
        event.preventDefault();
        resetDemo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [resetDemo]);
}

export default function AppShell() {
  const { pathname } = useLocation();
  useDemoReset();

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <Sidebar />
      <main id="main" tabIndex={-1} className={styles.main}>
        {/* A new screen gets a fresh boundary, so one screen's error does not stick to the next. */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <AssistantDrawer />
      <CommandPalette />
      <Toast />
    </div>
  );
}
