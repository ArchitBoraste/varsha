import { useCallback, useEffect, useState } from 'react';
import { OVERRIDE_AUTHOR, sanitizeOverrides } from '../lib/override.js';

const STORAGE_KEY = 'varsha.overrides';

// Storage may be missing or blocked (private windows, strict settings); overrides then live in memory.
function load() {
  try {
    return sanitizeOverrides(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

function save(overrides) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Keep working from memory.
  }
}

/**
 * Forecaster overrides, `{ [districtId]: { [lead]: { regime, reason, by, at } } }`, kept in
 * localStorage when it is available.
 */
export function useOverrides() {
  const [overrides, setOverrides] = useState(load);

  useEffect(() => save(overrides), [overrides]);

  const applyOverride = useCallback((districtId, lead, regime, reason) => {
    const override = { regime, reason, by: OVERRIDE_AUTHOR, at: new Date().toISOString() };
    setOverrides((current) => ({ ...current, [districtId]: { ...current[districtId], [lead]: override } }));
  }, []);

  const undoOverride = useCallback((districtId, lead) => {
    setOverrides((current) => {
      const { [lead]: removed, ...rest } = current[districtId] ?? {};
      if (!removed) return current;
      const next = { ...current, [districtId]: rest };
      if (!Object.keys(rest).length) delete next[districtId];
      return next;
    });
  }, []);

  return { overrides, applyOverride, undoOverride };
}
