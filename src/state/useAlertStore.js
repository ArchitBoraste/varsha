import { useCallback, useEffect, useMemo, useState } from 'react';
import { ALERT_ID_PATTERN } from '../lib/alerts.js';
import { OVERRIDE_AUTHOR } from '../lib/override.js';
import { loadStored, saveStored } from './storage.js';

const STORAGE_KEY = 'varsha.alerts';
const STATUSES = ['sent', 'rejected'];
const ALERT_LANGUAGES = ['en', 'hi', 'ml'];
const MAX_TEXT = 2000;

const isObject = (value) => value !== null && typeof value === 'object';

const isReceipt = (value) =>
  isObject(value) &&
  typeof value.sent === 'string' &&
  typeof value.capUrl === 'string' &&
  Array.isArray(value.deliveries) &&
  value.deliveries.every((step) => isObject(step) && ['channel', 'label', 'at'].every((key) => typeof step[key] === 'string'));

// A sent alert needs its receipt for the delivery timeline.
const isRecord = (value) =>
  isObject(value) &&
  STATUSES.includes(value.status) &&
  typeof value.at === 'string' &&
  typeof value.by === 'string' &&
  (value.status !== 'sent' || isReceipt(value.receipt));

const isEdit = (value) =>
  isObject(value) &&
  Object.entries(value).every(
    ([field, text]) => ['message', 'sms'].includes(field) && typeof text === 'string' && text.length <= MAX_TEXT,
  );

/** Keeps only well-formed records and edits from untrusted (stored) data. */
function sanitize(value) {
  const clean = { records: {}, edits: {} };
  if (!isObject(value)) return clean;
  for (const [id, record] of Object.entries(value.records ?? {})) {
    if (ALERT_ID_PATTERN.test(id) && isRecord(record)) clean.records[id] = record;
  }
  for (const [id, byLang] of Object.entries(value.edits ?? {})) {
    if (!ALERT_ID_PATTERN.test(id) || !isObject(byLang)) continue;
    const valid = Object.entries(byLang).filter(([lang, edit]) => ALERT_LANGUAGES.includes(lang) && isEdit(edit));
    if (valid.length) clean.edits[id] = Object.fromEntries(valid);
  }
  return clean;
}

/**
 * Alert decisions and message edits, kept in localStorage when it is available. An alert without a
 * record is a draft; records are `{ status: 'sent' | 'rejected', at, by, receipt? }` by alert id
 * (`at` in scenario time, see clock.js), and edits `{ [lang]: { message?, sms? } }` by alert id.
 */
export function useAlertStore() {
  const [store, setStore] = useState(() => loadStored(STORAGE_KEY, sanitize));

  useEffect(() => saveStored(STORAGE_KEY, store), [store]);

  const setRecord = useCallback((id, record) => {
    setStore((current) => {
      const records = { ...current.records };
      if (record) records[id] = record;
      else delete records[id];
      return { ...current, records };
    });
  }, []);

  const markSent = useCallback(
    (id, receipt) => setRecord(id, { status: 'sent', at: receipt.sent, by: OVERRIDE_AUTHOR, receipt }),
    [setRecord],
  );
  const markRejected = useCallback((id, at) => setRecord(id, { status: 'rejected', at, by: OVERRIDE_AUTHOR }), [setRecord]);
  const restoreDraft = useCallback((id) => setRecord(id, null), [setRecord]);

  const editText = useCallback((id, lang, field, text) => {
    setStore((current) => ({
      ...current,
      edits: { ...current.edits, [id]: { ...current.edits[id], [lang]: { ...current.edits[id]?.[lang], [field]: text } } },
    }));
  }, []);

  const clearAlerts = useCallback(() => setStore({ records: {}, edits: {} }), []);

  return useMemo(
    () => ({ alertRecords: store.records, alertEdits: store.edits, markSent, markRejected, restoreDraft, editText, clearAlerts }),
    [store, markSent, markRejected, restoreDraft, editText, clearAlerts],
  );
}
