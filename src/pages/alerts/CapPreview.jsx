import { useEffect, useState } from 'react';
import Card from '../../components/Card/Card.jsx';
import styles from './CapPreview.module.css';

const COPIED_MS = 2000;

/** The CAP 1.2 document that goes to SACHET, generated from the composer's current fields. */
export default function CapPreview({ xml }) {
  const [copyState, setCopyState] = useState('idle');

  useEffect(() => {
    if (copyState === 'idle') return undefined;
    const timer = setTimeout(() => setCopyState('idle'), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copyState]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <Card aria-labelledby="cap-preview-title" className={styles.card}>
      <div className={styles.head}>
        <h2 id="cap-preview-title" className={styles.title}>
          CAP 1.2 for SACHET
        </h2>
        <button type="button" className={styles.copy} onClick={copy}>
          {{ idle: 'Copy', copied: 'Copied', failed: 'Copy failed' }[copyState]}
        </button>
      </div>
      {/* Focusable so the document can be scrolled from the keyboard. */}
      <pre className={styles.xml} tabIndex={0} aria-label="CAP 1.2 XML">
        {xml}
      </pre>
    </Card>
  );
}
