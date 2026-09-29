import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { buildSearchIndex, searchDistricts } from '../../lib/search.js';
import { useAppState } from '../../state/AppState.jsx';
import { useDataset } from '../../state/useDataset.js';
import Icon from '../Icon/Icon.jsx';
import styles from './CommandPalette.module.css';

const MAX_RESULTS = 50;
// The forecast console's map shows the selection; anywhere else a pick opens the district page.
const MAP_SCREEN = '/';

/** District search dialog, opened from the top bar or with Ctrl/Cmd+K on any screen. */
export default function CommandPalette() {
  const { searchOpen, openSearch, closeSearch } = useAppState();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  return searchOpen ? <SearchDialog onClose={closeSearch} /> : null;
}

function SearchDialog({ onClose }) {
  const { selectDistrict } = useAppState();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: geo, error } = useDataset('districts.geojson');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const index = useMemo(() => (geo ? buildSearchIndex(geo.features) : []), [geo]);
  const results = useMemo(() => searchDistricts(index, query, MAX_RESULTS), [index, query]);

  // Focus the input while open and give focus back to whatever opened the dialog.
  useEffect(() => {
    const opener = document.activeElement;
    inputRef.current.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const choose = ({ id }) => {
    selectDistrict(id);
    onClose();
    if (pathname !== MAP_SCREEN) navigate(`/districts/${id}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => Math.min(Math.max(index + step, 0), results.length - 1));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation(); // leave other Escape handlers (the assistant drawer) alone
      onClose();
    } else if (event.key === 'Tab') {
      event.preventDefault(); // the input is the dialog's only focus stop
    }
  };

  let message = null;
  if (error) message = error.message;
  else if (!geo) message = 'Loading districts…';
  else if (!query.trim()) message = 'Type a district or state name';
  else if (!results.length) message = 'No district or state matches';

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search districts" className={styles.dialog}>
        <div className={styles.field}>
          <Icon name="search" />
          <input
            ref={inputRef}
            className={styles.input}
            role="combobox"
            aria-label="Search districts and states"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
            placeholder="Search districts and states"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className={styles.key}>Esc</kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Districts" className={styles.list}>
          {results.map((entry, index) => (
            <li
              key={entry.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              className={styles.option}
              onMouseMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(entry)}
            >
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.state}>{entry.state}</span>
            </li>
          ))}
        </ul>
        {message && <p className={styles.message}>{message}</p>}

        <p role="status" className="visually-hidden">
          {query.trim() && geo ? `${results.length} districts found` : ''}
        </p>
        <p className={styles.hint} aria-hidden="true">
          ↑ ↓ to move · Enter to open · Esc to close
        </p>
      </div>
    </div>
  );
}
