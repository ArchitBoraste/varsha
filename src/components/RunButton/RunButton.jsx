import { useCallback, useId, useRef, useState } from 'react';
import useDismiss from '../../lib/useDismiss.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';
import styles from './RunButton.module.css';

/** Shows the active model run and opens a list of the available runs to switch between. */
export default function RunButton() {
  const { runId, setRunId } = useAppState();
  const { data: meta } = useDataset('meta.json');
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const close = useCallback((reason) => {
    setOpen(false);
    // A click elsewhere moves focus there; otherwise keep it on the button.
    if (reason !== 'outside') buttonRef.current.focus();
  }, []);
  useDismiss(containerRef, open, close);

  if (!meta) return null;
  const run = meta.runs.find((option) => option.id === runId) ?? meta.runs[0];

  return (
    <div ref={containerRef} className={styles.picker}>
      <Button ref={buttonRef} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
        <Icon name="calendar" size={16} />
        Run {run.label}
      </Button>
      {open && (
        <div id={menuId} className={styles.menu}>
          <p className={styles.menuTitle}>Model runs</p>
          <ul>
            {meta.runs.map((option, index) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={styles.option}
                  aria-pressed={option.id === run.id}
                  onClick={() => {
                    setRunId(option.id);
                    close('select');
                  }}
                >
                  <span className={styles.optionText}>
                    <span className={styles.optionLabel}>{option.longLabel}</span>
                    <span className={styles.optionMeta}>
                      {option.model}
                      {index === 0 && ' · latest'}
                    </span>
                  </span>
                  {option.id === run.id && <Icon name="check" size={16} strokeWidth={2} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
