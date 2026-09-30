import { useCallback, useEffect, useState } from 'react';
import { OVERRIDE_AUTHOR, sanitizeOverrides } from '../lib/override.js';
import { loadStored, saveStored } from './storage.js';

const STORAGE_KEY = 'varsha.overrides';

/**
 * Forecaster overrides, `{ [districtId]: { [lead]: { regime, reason, by, at } } }`, kept in
 * localStorage when it is available.
 */
export function useOverrides() {
  const [overrides, setOverrides] = useState(() => loadStored(STORAGE_KEY, sanitizeOverrides));

  useEffect(() => saveStored(STORAGE_KEY, overrides), [overrides]);

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

  const clearOverrides = useCallback(() => setOverrides({}), []);

  return { overrides, applyOverride, undoOverride, clearOverrides };
}
