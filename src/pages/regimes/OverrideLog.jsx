import Button from '../../components/Button/Button.jsx';
import Card from '../../components/Card/Card.jsx';
import Icon from '../../components/Icon/Icon.jsx';
import { formatClock } from '../../lib/format.js';
import { overrideList } from '../../lib/override.js';
import { topRegime } from '../../lib/regimes.js';
import { REGIME_BY_ID } from '../../lib/scales.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import styles from './OverrideLog.module.css';

function RegimeName({ regime }) {
  return (
    <span className={styles.regime}>
      <span className={styles.dot} style={{ background: regime.color }} />
      {regime.short}
    </span>
  );
}

/** Every override in this run, newest first, with a way back to each district-day and an undo. */
export default function OverrideLog() {
  const { overrides, undoOverride, selectDistrict, setLead } = useAppState();
  const { data: model } = useDataset('forecast.json');
  const entries = model ? overrideList(overrides).filter(({ districtId }) => model[districtId]) : [];

  const show = (districtId, lead) => {
    selectDistrict(districtId);
    setLead(lead);
  };

  return (
    <Card aria-labelledby="override-log-title" className={styles.card}>
      <div className={styles.head}>
        <h2 id="override-log-title" className={styles.title}>
          Overrides this run
        </h2>
        <span className={styles.note}>Kept in this browser</span>
      </div>
      {entries.length === 0 ? (
        <p className={styles.empty}>No overrides yet. An override changes the forecast on every screen.</p>
      ) : (
        <ul className={styles.entries}>
          {entries.map(({ districtId, lead, regime, reason, by, at }) => {
            const { name } = model[districtId];
            return (
              <li key={`${districtId}-${lead}`} className={styles.entry}>
                <p className={styles.what}>
                  <button
                    type="button"
                    className={styles.district}
                    title={`Show ${name}, Day ${lead}`}
                    onClick={() => show(districtId, lead)}
                  >
                    {name}
                  </button>
                  <span className={styles.lead}>Day {lead}</span>
                  <span className={styles.change}>
                    <RegimeName regime={topRegime(model[districtId].days[lead - 1].p)} />
                    <span aria-label="changed to">→</span>
                    <RegimeName regime={REGIME_BY_ID[regime]} />
                  </span>
                </p>
                <p className={styles.reason} title={reason}>
                  {reason} · {by}, {formatClock(at)}
                </p>
                <Button
                  variant="ghost"
                  className={styles.undo}
                  aria-label={`Undo override for ${name}, Day ${lead}`}
                  onClick={() => undoOverride(districtId, lead)}
                >
                  <Icon name="undo" size={14} strokeWidth={1.8} />
                  Undo
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
