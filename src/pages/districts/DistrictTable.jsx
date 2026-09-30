import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Button from '../../components/Button/Button.jsx';
import Card from '../../components/Card/Card.jsx';
import Icon from '../../components/Icon/Icon.jsx';
import OverrideChip from '../../components/OverrideChip/OverrideChip.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { cx } from '../../lib/cx.js';
import { downloadText, toCsv } from '../../lib/csv.js';
import { formatPercent } from '../../lib/format.js';
import { THRESHOLDS } from '../../lib/risk.js';
import { probColor } from '../../lib/scales.js';
import { matchesQuery } from '../../lib/search.js';
import { COLUMNS, DEFAULT_SORT, WARNING_FILTERS, compareRows, csvColumns, districtRows } from './districtRows.js';
import styles from './DistrictTable.module.css';

const COMING_NEXT = 'Coming in the next step';

// Memoised so re-sorting only moves rows instead of re-rendering every cell.
const DistrictRow = memo(function DistrictRow({ row, onOpen }) {
  return (
    <tr
      className={styles.row}
      onClick={(event) => {
        if (!event.target.closest('a')) onOpen(row.id);
      }}
    >
      <th scope="row" className={styles.name}>
        <Link to={`/districts/${row.id}`}>{row.name}</Link>
      </th>
      <td className={styles.muted}>{row.state}</td>
      <td className={cx(styles.mono, styles.strong)}>{row.corrected}</td>
      <td className={cx(styles.mono, styles.muted)}>{row.raw}</td>
      <td>
        <span className={styles.regime}>
          <span className={styles.dot} style={{ background: row.regime.color }} />
          {row.regime.label}
        </span>
      </td>
      {THRESHOLDS.map(({ key }) => (
        <td key={key}>
          <span className={styles.chance}>
            <span className={styles.swatch} style={{ background: probColor(row.probs[key]) }} />
            {formatPercent(row.probs[key])}
          </span>
        </td>
      ))}
      <td>
        <span className={styles.warning}>
          <WarningBadge level={row.warning} size="sm" />
          {row.override && <OverrideChip override={row.override} size="sm" />}
        </span>
      </td>
    </tr>
  );
});

/** Every district for a lead day: search, filters, sortable columns and CSV export. */
export default function DistrictTable({ forecast, leadInfo }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [warningFilter, setWarningFilter] = useState('orange');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(() => districtRows(forecast, leadInfo.lead), [forecast, leadInfo.lead]);
  const stateNames = useMemo(() => [...new Set(rows.map((row) => row.state))].sort(), [rows]);

  const visible = useMemo(() => {
    const { levels } = WARNING_FILTERS.find(({ id }) => id === warningFilter);
    return rows
      .filter(
        (row) =>
          levels.includes(row.warning) &&
          (stateFilter === 'all' || row.state === stateFilter) &&
          matchesQuery(row.name, row.state, deferredQuery),
      )
      .sort(compareRows(sort));
  }, [rows, warningFilter, stateFilter, deferredQuery, sort]);

  const openDistrict = useCallback((id) => navigate(`/districts/${id}`), [navigate]);

  const toggleSort = (column) =>
    setSort((current) =>
      current.key === column.key
        ? { key: column.key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' }
        : { key: column.key, direction: column.firstSort ?? 'descending' },
    );

  const exportCsv = () =>
    downloadText(`varsha-districts-day${leadInfo.lead}-${leadInfo.date}.csv`, toCsv(csvColumns(leadInfo), visible));

  return (
    <Card aria-label="District table" className={styles.card}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Icon name="search" size={16} />
          <span className="visually-hidden">Search districts</span>
          <input
            type="search"
            value={query}
            placeholder={`Search ${rows.length} districts`}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.filter}>
          State
          <select className={styles.stateSelect} value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
            <option value="all">All states</option>
            {stateNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          Warning
          <select className={styles.warningSelect} value={warningFilter} onChange={(event) => setWarningFilter(event.target.value)}>
            {WARNING_FILTERS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button className={styles.export} onClick={exportCsv}>
          <Icon name="download" size={16} />
          Export CSV
        </Button>
        <Button variant="primary" aria-disabled="true" title={COMING_NEXT}>
          Download bulletin (PDF)
        </Button>
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className="visually-hidden">Districts for Day {leadInfo.lead}, {leadInfo.period}</caption>
          <colgroup>
            {COLUMNS.map(({ key, width }) => (
              <col key={key} style={{ width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((column) => {
                const sorted = sort.key === column.key;
                return (
                  <th key={column.key} scope="col" aria-sort={sorted ? sort.direction : 'none'}>
                    <button type="button" className={styles.sortButton} onClick={() => toggleSort(column)}>
                      {column.label}
                      {sorted && (
                        <Icon name={sort.direction === 'ascending' ? 'chevronUp' : 'chevronDown'} size={14} strokeWidth={2} />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <DistrictRow key={row.id} row={row} onOpen={openDistrict} />
            ))}
          </tbody>
        </table>
        {!visible.length && <p className={styles.empty}>No district matches these filters.</p>}
      </div>

      <p role="status" className={styles.count}>
        Showing {visible.length} of {rows.length} districts
      </p>
    </Card>
  );
}
