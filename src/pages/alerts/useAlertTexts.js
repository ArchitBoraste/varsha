import { useEffect, useMemo, useReducer } from 'react';
import { alertTexts } from '../../lib/alertText.js';
import { postJson } from '../../lib/api.js';
import { useAppState } from '../../state/AppState.jsx';

// Malayalam drafts by alert id for this session; the server also caches them on disk.
const malayalam = new Map();

const translate = (text) => postJson('/api/translate', { text, target: 'ml' }).then((reply) => reply.text);

/**
 * The Malayalam message and SMS for an alert, asked of Varsha Assist the first time `active` is
 * true: `{ status: 'idle' | 'loading' | 'done' | 'unavailable', message?, sms? }`.
 */
function useMalayalam(id, english, active) {
  const [, rerender] = useReducer((count) => count + 1, 0);

  useEffect(() => {
    if (!active || malayalam.has(id)) return;
    malayalam.set(id, { status: 'loading' });
    rerender();
    Promise.all([translate(english.message), translate(english.sms).catch(() => null)])
      .then(([message, sms]) => malayalam.set(id, message ? { status: 'done', message, sms: sms ?? undefined } : { status: 'unavailable' }))
      .catch(() => malayalam.set(id, { status: 'unavailable' }))
      .finally(rerender);
  }, [id, english, active]);

  return malayalam.get(id) ?? { status: 'idle' };
}

/**
 * An alert's texts by language, `{ en, hi, ml }` of { message, sms, headline?, instruction? }, with
 * the forecaster's edits applied. English and Hindi come from the templates; Malayalam is drafted
 * by Varsha Assist and shows the English text until (or unless) a draft is available.
 */
export function useAlertTexts(alert, lang) {
  const { alertEdits } = useAppState();
  const base = useMemo(() => alertTexts(alert), [alert]);
  const translation = useMalayalam(alert.id, base.en, lang === 'ml');
  const edits = alertEdits[alert.id] ?? {};
  const edited = (language, field, fallback) => edits[language]?.[field] ?? fallback;

  const texts = {
    en: { ...base.en, message: edited('en', 'message', base.en.message), sms: edited('en', 'sms', base.en.sms) },
    hi: { ...base.hi, message: edited('hi', 'message', base.hi.message), sms: edited('hi', 'sms', base.hi.sms) },
    ml: {
      message: edited('ml', 'message', translation.message ?? base.en.message),
      sms: edited('ml', 'sms', translation.sms ?? base.en.sms),
    },
  };
  // Malayalam goes into the CAP document only once there is Malayalam text to send.
  const hasMalayalam = translation.status === 'done' || edits.ml?.message !== undefined;

  return { texts, translation, hasMalayalam };
}
