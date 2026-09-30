import { useId, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import Card from '../../components/Card/Card.jsx';
import OverrideChip from '../../components/OverrideChip/OverrideChip.jsx';
import RegimeMix from '../../components/RegimeMix/RegimeMix.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { cx } from '../../lib/cx.js';
import { formatClock, formatMm, formatPercent } from '../../lib/format.js';
import { withRegime } from '../../lib/override.js';
import { topRegime } from '../../lib/regimes.js';
import { REGIMES, REGIME_BY_ID, WARNINGS } from '../../lib/scales.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import { useDistrictDay } from '../../state/useForecast.js';
import styles from './OverrideCard.module.css';

// Rows of the comparison; `text` is the plain-text value where `value` renders an element.
const COMPARED = [
  { label: 'Corrected rainfall', value: (day) => formatMm(day.corrected) },
  { label: 'Likely range', value: (day) => `${day.range[0]}–${day.range[1]} mm` },
  { label: 'Chance ≥ 204.5 mm', value: (day) => formatPercent(day.probs.p204) },
  {
    label: 'Warning',
    value: (day) => <WarningBadge level={day.warning} size="xs" />,
    text: (day) => WARNINGS[day.warning].label,
  },
];

const describeAfter = (after) =>
  `After override: ${COMPARED.map(({ label, value, text = value }) => `${label} ${text(after)}`).join(', ')}.`;

/** The effective day now against the day recomputed with the chosen regime. */
function Comparison({ now, after }) {
  return (
    <table className={styles.compare}>
      <thead>
        <tr>
          <td />
          <th scope="col">Now</th>
          <th scope="col">After override</th>
        </tr>
      </thead>
      <tbody>
        {COMPARED.map(({ label, value }) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value(now)}</td>
            <td className={styles.after}>{after ? value(after) : <span aria-label="No change">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Override form for one district-day: pick a regime, give a reason, compare, then apply or undo. */
function OverrideForm({ id, name, day, modelDay }) {
  const { applyOverride, undoOverride } = useAppState();
  const hintId = useId();
  const current = topRegime(day.p).id;
  const [choice, setChoice] = useState(current);
  const [reason, setReason] = useState('');
  const [announcement, setAnnouncement] = useState('');

  // An override applied or undone anywhere (e.g. from the log) resets the choice to the new regime.
  const [shownRegime, setShownRegime] = useState(current);
  if (shownRegime !== current) {
    setShownRegime(current);
    setChoice(current);
  }

  const changed = choice !== current;
  const ready = changed && reason.trim() !== '';
  const after = changed ? withRegime(modelDay, choice) : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!ready) return;
    applyOverride(id, day.lead, choice, reason.trim());
    setReason('');
    setAnnouncement(`Override applied: ${name}, Day ${day.lead} is now ${REGIME_BY_ID[choice].label}.`);
  };

  const cancel = () => {
    setChoice(current);
    setReason('');
  };

  const undo = () => {
    undoOverride(id, day.lead);
    setAnnouncement(`Override undone: ${name}, Day ${day.lead} is back to the regime engine's mix.`);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label={`Override the regime for ${name}`}>
      <div className={styles.fields}>
        <label className={styles.field}>
          Override regime to
          <select className={styles.select} value={choice} onChange={(event) => setChoice(event.target.value)}>
            {REGIMES.map((regime) => (
              <option key={regime.id} value={regime.id}>
                {regime.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.reason}>
          <span className={styles.reasonLabel}>Reason</span>
          <input
            value={reason}
            maxLength={160}
            placeholder="Required"
            aria-required="true"
            aria-describedby={hintId}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
      </div>

      <Comparison now={day} after={after} />

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          aria-disabled={!ready}
          title={ready ? undefined : 'Choose a different regime and give a reason'}
        >
          Apply override
        </Button>
        <Button aria-disabled={!changed && !reason} onClick={cancel}>
          Cancel
        </Button>
        {day.override ? (
          <p id={hintId} className={styles.status}>
            Overridden by {day.override.by} · {formatClock(day.override.at)} ·
            <button type="button" className={styles.undo} onClick={undo}>
              Undo
            </button>
          </p>
        ) : (
          <p id={hintId} className={styles.hint}>
            Logged with your name and a reason
          </p>
        )}
      </div>

      <p role="status" className="visually-hidden">
        {announcement || (after ? describeAfter(after) : '')}
      </p>
    </form>
  );
}

/** The district selected on the map: its regime mix and the forecaster override. */
export default function OverrideCard() {
  const { lead, selectedDistrictId } = useAppState();
  const { district, day } = useDistrictDay(selectedDistrictId, lead);
  // The regime engine's own forecast, which an override replaces.
  const { data: model } = useDataset('forecast.json');

  if (!district || !model) {
    return (
      <Card className={cx(styles.card, styles.empty)} aria-label="Selected district">
        Click a district on the map to review its regime.
      </Card>
    );
  }

  return (
    <Card aria-labelledby="override-title" className={styles.card}>
      <div className={styles.head}>
        <h2 id="override-title" className={styles.name}>
          {district.name}
        </h2>
        <span className={styles.context}>{district.state} · selected on map</span>
        {day.override && <OverrideChip override={day.override} size="sm" className={styles.chip} />}
        <span className={styles.day}>Day {lead}</span>
      </div>

      <section className={styles.mix} aria-labelledby="override-mix">
        <h3 id="override-mix" className={styles.sectionTitle}>
          Regime mix
        </h3>
        <RegimeMix weights={day.p} />
      </section>

      <OverrideForm
        key={`${selectedDistrictId}-${lead}`}
        id={selectedDistrictId}
        name={district.name}
        day={day}
        modelDay={model[selectedDistrictId].days[lead - 1]}
      />
    </Card>
  );
}
