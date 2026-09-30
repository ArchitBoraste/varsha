import { useEffect } from 'react';
import { useAppState } from '../../state/AppState.jsx';
import Icon from '../Icon/Icon.jsx';
import styles from './Toast.module.css';

const VISIBLE_MS = 4000;

/** The app's one toast, announced politely and dismissed after a few seconds. */
export default function Toast() {
  const { toast, dismissToast } = useAppState();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(dismissToast, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <div role="status" aria-live="polite" className={styles.region}>
      {toast && (
        <p key={toast.id} className={styles.toast}>
          <Icon name="check" size={16} strokeWidth={2} />
          {toast.message}
        </p>
      )}
    </div>
  );
}
