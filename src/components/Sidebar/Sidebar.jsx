import { NavLink } from 'react-router';
import { cx } from '../../lib/cx.js';
import { useDataset } from '../../state/useDataset.js';
import Icon from '../Icon/Icon.jsx';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Forecast', icon: 'map', end: true },
  { to: '/regimes', label: 'Regimes', icon: 'layers' },
  { to: '/districts', label: 'Districts', icon: 'grid' },
  { to: '/alerts', label: 'Alerts', icon: 'bell', showDraftCount: true },
  { to: '/verification', label: 'Verification', icon: 'chart' },
  { to: '/cases', label: 'Case studies', icon: 'play' },
];

export default function Sidebar() {
  const { data: alerts } = useDataset('alerts.json');
  const drafts = alerts?.filter((alert) => alert.status === 'draft').length ?? 0;

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.wordmark}>Varsha</span>
        <span className={styles.tagline}>Regime-aware rainfall forecasts</span>
      </div>

      <nav aria-label="Main">
        <ul className={styles.links}>
          {NAV_ITEMS.map(({ to, label, icon, end, showDraftCount }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => cx(styles.link, isActive && styles.active)}>
                <Icon name={icon} />
                {label}
                {showDraftCount && drafts > 0 && (
                  <span className={styles.badge}>
                    {drafts}
                    <span className="visually-hidden"> drafts awaiting approval</span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.source}>
        <span className={styles.sourceLabel}>Source model</span>
        <span className={styles.sourceModel}>GFS 0.25° · 00 UTC run</span>
        <span className={styles.sourceNote}>Verified against IMD gridded rainfall</span>
      </div>
    </div>
  );
}
