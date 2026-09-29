import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AppStateContext = createContext(null);

// The demo opens on the district at the centre of the Wayanad case.
const DEFAULT_DISTRICT_ID = 'wayanad-kerala';

export function AppStateProvider({ children }) {
  // null means the latest run listed in meta.json (00 UTC 29 Jul 2024 in the demo data).
  const [runId, setRunId] = useState(null);
  const [lead, setLead] = useState(1);
  const [selectedDistrictId, setSelectedDistrictId] = useState(DEFAULT_DISTRICT_ID);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const toggleAssistant = useCallback(() => setAssistantOpen((open) => !open), []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);

  const value = useMemo(
    () => ({
      runId,
      setRunId,
      lead,
      setLead,
      selectedDistrictId,
      selectDistrict: setSelectedDistrictId,
      assistantOpen,
      toggleAssistant,
      closeAssistant,
    }),
    [runId, lead, selectedDistrictId, assistantOpen, toggleAssistant, closeAssistant],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
