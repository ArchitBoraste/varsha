// Day 1 draft alerts as a static export: the same drafts, messages and CAP 1.2 documents the
// Alerts screen starts from, stamped at the time the run's drafts are ready.

import { alertTexts } from '../../src/lib/alertText.js';
import { capFields, capInfos, districtCodes, draftAlerts } from '../../src/lib/alerts.js';
import { buildCap } from '../../src/lib/cap.js';

const DRAFTED_AT = '2024-07-29T09:40:00+05:30';

export function buildAlerts(forecast, leadInfo) {
  return draftAlerts(forecast, leadInfo, districtCodes(forecast)).map((alert) => {
    const texts = alertTexts(alert);
    return {
      ...alert,
      status: 'draft',
      messageEn: texts.en.message,
      messageHi: texts.hi.message,
      sms: texts.en.sms,
      smsHi: texts.hi.sms,
      capXml: buildCap(capFields(alert, DRAFTED_AT), capInfos(alert, texts)),
    };
  });
}
