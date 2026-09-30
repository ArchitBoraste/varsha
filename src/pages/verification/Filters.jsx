import { formatIndian } from '../../lib/format.js';
import styles from './Filters.module.css';

function Select({ label, value, options, onChange }) {
  return (
    <label className={styles.filter}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(({ id, label: optionLabel }) => (
          <option key={id} value={id}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Season, lead day, regime and region filters, and the size of the verification sample. */
export default function Filters({ report, filters, onChange }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: key === 'lead' ? Number(value) : value });
  const leads = report.leads.map((lead) => ({ id: lead, label: `Day ${lead}` }));
  const { cells } = report.regions.find(({ id }) => id === filters.region);
  const truth = report.sample.truth.split(',')[0];

  return (
    <div className={styles.row} role="group" aria-label="Filters">
      <Select label="Season" value={filters.season} options={report.seasons} onChange={set('season')} />
      <Select label="Lead" value={filters.lead} options={leads} onChange={set('lead')} />
      <Select label="Regime" value={filters.regime} options={report.regimes} onChange={set('regime')} />
      <Select label="Region" value={filters.region} options={report.regions} onChange={set('region')} />
      <p className={styles.sample}>
        {report.sample.days} days · {formatIndian(cells)} grid cells · truth: {truth}
      </p>
    </div>
  );
}
