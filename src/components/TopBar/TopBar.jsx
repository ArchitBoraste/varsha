import { Fragment } from 'react';
import { Link } from 'react-router';
import { useAppState } from '../../state/AppState.jsx';
import { ASSISTANT_ID } from '../AssistantDrawer/AssistantDrawer.jsx';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';
import styles from './TopBar.module.css';

/**
 * Page header: a title and subtitle (or a breadcrumb trail of { label, to? } items), page
 * controls on the right and the global Ask Varsha toggle.
 */
export default function TopBar({ title, subtitle, breadcrumb, controls }) {
  const { assistantOpen, toggleAssistant } = useAppState();

  return (
    <header className={styles.bar}>
      {breadcrumb ? (
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          {breadcrumb.map(({ label, to }, index) => (
            <Fragment key={label}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {to ? (
                <Link to={to} className={styles.crumbLink}>
                  {label}
                </Link>
              ) : (
                <span className={styles.crumbCurrent} aria-current="page">
                  {label}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
      ) : (
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && (
            // Narrow windows truncate the subtitle; the title attribute keeps it readable on hover.
            <p className={styles.subtitle} title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={styles.controls}>
        {controls}
        <Button variant="dark" aria-expanded={assistantOpen} aria-controls={ASSISTANT_ID} onClick={toggleAssistant}>
          <Icon name="sparkle" size={16} />
          Ask Varsha
        </Button>
      </div>
    </header>
  );
}
