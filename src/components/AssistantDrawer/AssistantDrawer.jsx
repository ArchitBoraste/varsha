import { useEffect, useRef } from 'react';
import { cx } from '../../lib/cx.js';
import { useAppState } from '../../state/AppState.jsx';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';
import styles from './AssistantDrawer.module.css';

export const ASSISTANT_ID = 'ask-varsha';

/** Ask Varsha: a right-hand drawer over the page content. Closes with its X button or Escape. */
export default function AssistantDrawer() {
  const { assistantOpen, closeAssistant } = useAppState();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!assistantOpen) return undefined;
    const opener = document.activeElement;
    closeButtonRef.current.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeAssistant();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Give focus back to whatever opened the drawer, if it is still on the page.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [assistantOpen, closeAssistant]);

  return (
    <aside id={ASSISTANT_ID} aria-label="Ask Varsha" className={cx(styles.drawer, assistantOpen && styles.open)}>
      <header className={styles.header}>
        <span className={styles.avatar}>
          <Icon name="sparkle" />
        </span>
        <div className={styles.heading}>
          <h2 className={styles.title}>Ask Varsha</h2>
          <p className={styles.subtitle}>Answers from today&apos;s forecast data</p>
        </div>
        <Button ref={closeButtonRef} variant="icon" aria-label="Close assistant" onClick={closeAssistant}>
          <Icon name="close" size={16} strokeWidth={1.8} />
        </Button>
      </header>

      <div className={styles.body}>
        <p className={styles.placeholder}>
          Ask about any district, regime or score. The assistant is connected in a later build step.
        </p>
      </div>

      <footer className={styles.footer}>Varsha Assist reads forecast data only. Forecasters approve every warning.</footer>
    </aside>
  );
}
