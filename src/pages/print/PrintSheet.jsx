import { useEffect, useRef } from 'react';
import { scenarioNow } from '../../lib/clock.js';
import { formatIstTime } from './printFormat.js';
import styles from './PrintSheet.module.css';

// Maps and charts measure their box after the first paint; give them a moment before printing.
const SETTLE_MS = 400;

/** Opens the print dialog once, when the page's data is in and the web fonts have loaded. */
function usePrintWhenReady(ready) {
  const printed = useRef(false);
  useEffect(() => {
    if (!ready || printed.current) return undefined;
    let timer;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      timer = setTimeout(() => {
        printed.current = true;
        window.print();
      }, SETTLE_MS);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready]);
}

/** Wordmark, report title and the run and validity lines at the top of every printed page set. */
export function PrintHeader({ kicker, title, meta, lines }) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.wordmark}>Varsha</span>
        <span className={styles.tagline}>Regime-aware rainfall forecasts</span>
      </div>
      <div className={styles.titleBlock}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.title}>{title}</h1>
        <dl className={styles.lines}>
          {lines.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {meta && (
            <div>
              <dt>Issued</dt>
              <dd>{formatIstTime(scenarioNow(meta.run.init))}</dd>
            </div>
          )}
        </dl>
      </div>
    </header>
  );
}

export function PrintFooter() {
  return (
    <footer className={styles.footer}>
      Varsha (demo): regime-aware post-processing of GFS 0.25°, verified against IMD gridded rainfall. Demonstration data,
      not an official IMD warning. A duty forecaster approves every warning.
    </footer>
  );
}

/**
 * An A4 report page without the app shell: a sheet on screen with a print button, plain A4 pages
 * in print. The print dialog opens by itself once `ready`.
 */
export default function PrintSheet({ title, ready, status, children }) {
  useEffect(() => {
    document.title = `${title} · Varsha`;
  }, [title]);
  usePrintWhenReady(ready);

  return (
    <div className={styles.screen}>
      <div className={styles.toolbar}>
        <span>{title} · A4</span>
        <button type="button" className={styles.print} onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      <article className={styles.sheet} aria-busy={!ready}>
        {ready ? children : <p className={styles.status}>{status ?? 'Preparing the report…'}</p>}
      </article>
    </div>
  );
}
