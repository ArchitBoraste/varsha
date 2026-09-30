import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAlertStore } from './useAlertStore.js';
import { useChat } from './useChat.js';
import { useOverrides } from './useOverrides.js';

const AppStateContext = createContext(null);

// The demo opens on the district at the centre of the Wayanad case.
const DEFAULT_DISTRICT_ID = 'wayanad-kerala';
const NO_HIGHLIGHTS = [];

let nextToastId = 1;

export function AppStateProvider({ children }) {
  // null means the latest run listed in meta.json (00 UTC 29 Jul 2024 in the demo data).
  const [runId, setRunId] = useState(null);
  const [lead, setLead] = useState(1);
  // null when no district is selected.
  const [selectedDistrictId, setSelectedDistrictId] = useState(DEFAULT_DISTRICT_ID);
  // Districts outlined together on the Forecast map, e.g. from an Ask Varsha answer.
  const [highlightIds, setHighlightIds] = useState(NO_HIGHLIGHTS);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { overrides, applyOverride, undoOverride, clearOverrides } = useOverrides();
  const alertStore = useAlertStore();
  const chat = useChat();

  const toggleAssistant = useCallback(() => setAssistantOpen((open) => !open), []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const clearHighlights = useCallback(() => setHighlightIds(NO_HIGHLIGHTS), []);
  const showToast = useCallback((message) => setToast({ id: nextToastId++, message }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const { clearAlerts } = alertStore;
  const { resetChat } = chat;
  const resetDemo = useCallback(() => {
    clearOverrides();
    clearAlerts();
    resetChat();
    setHighlightIds(NO_HIGHLIGHTS);
    showToast('Demo reset: overrides, alerts and chat cleared');
  }, [clearOverrides, clearAlerts, resetChat, showToast]);

  const value = useMemo(
    () => ({
      runId,
      setRunId,
      lead,
      setLead,
      selectedDistrictId,
      selectDistrict: setSelectedDistrictId,
      highlightIds,
      setHighlightIds,
      clearHighlights,
      assistantOpen,
      toggleAssistant,
      closeAssistant,
      searchOpen,
      openSearch,
      closeSearch,
      toast,
      showToast,
      dismissToast,
      overrides,
      applyOverride,
      undoOverride,
      chat,
      ...alertStore,
      resetDemo,
    }),
    [
      runId,
      lead,
      selectedDistrictId,
      highlightIds,
      clearHighlights,
      assistantOpen,
      toggleAssistant,
      closeAssistant,
      searchOpen,
      openSearch,
      closeSearch,
      toast,
      showToast,
      dismissToast,
      overrides,
      applyOverride,
      undoOverride,
      chat,
      alertStore,
      resetDemo,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
