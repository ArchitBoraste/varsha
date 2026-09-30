// Draft alerts derived from the forecast: one per red or orange district on a lead day. Shared by
// the Alerts screen (with the forecaster's overrides applied), the server and the data generator.

import { ALERT_LEVELS, isAlertLevel } from './alertText.js';
import { topRegime } from './regimes.js';

/** Three-letter code: first letter, next consonant and last consonant (Wayanad → WYD), kept unique. */
function districtCode(name, used) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  const consonants = letters.slice(1).replace(/[AEIOU]/g, '');
  const candidates = [letters[0] + consonants[0] + consonants.at(-1), letters.slice(0, 3), letters[0] + consonants.slice(0, 2)];
  let code = candidates.find((c) => c.length === 3 && !used.has(c));
  for (let n = 2; !code; n++) {
    if (!used.has(`${letters.slice(0, 2)}${n}`)) code = `${letters.slice(0, 2)}${n}`;
  }
  used.add(code);
  return code;
}

/** A stable code for every district, assigned in id order so it never depends on the warnings. */
export function districtCodes(forecast) {
  const used = new Set();
  return Object.fromEntries(
    Object.keys(forecast)
      .sort()
      .map((id) => [id, districtCode(forecast[id].name, used)]),
  );
}

/** CAP identifier of a district's alert for a rain day: VRS-20240730-WYD. */
const alertId = (date, code) => `VRS-${date.replaceAll('-', '')}-${code}`;

export const ALERT_ID_PATTERN = /^VRS-\d{8}-[A-Z0-9]{3,4}$/;

const chanceOf = (day) => day.probs[ALERT_LEVELS[day.warning].probKey];

/** Red first, then by the chance that sets the level, then by amount. */
const bySeverity = (a, b) =>
  Object.keys(ALERT_LEVELS).indexOf(a.day.warning) - Object.keys(ALERT_LEVELS).indexOf(b.day.warning) ||
  chanceOf(b.day) - chanceOf(a.day) ||
  b.day.corrected - a.day.corrected;

/** One draft per red or orange district for `leadInfo`'s day, most severe and most likely first. */
export function draftAlerts(forecast, leadInfo, codes) {
  return Object.entries(forecast)
    .map(([districtId, district]) => ({ districtId, district, day: district.days[leadInfo.lead - 1] }))
    .filter(({ day }) => isAlertLevel(day.warning))
    .sort(bySeverity)
    .map(({ districtId, district, day }) => {
      const { event, threshold } = ALERT_LEVELS[day.warning];
      const regime = topRegime(day.p);
      return {
        id: alertId(leadInfo.date, codes[districtId]),
        districtId,
        name: district.name,
        state: district.state,
        lead: leadInfo.lead,
        level: day.warning,
        event,
        validity: { date: leadInfo.date, label: leadInfo.label, from: leadInfo.validFrom, to: leadInfo.validTo },
        chance: { threshold, p: chanceOf(day) },
        rainfall: { mm: day.corrected, range: day.range },
        regime: { id: regime.id, label: regime.label, share: regime.share },
        exposure: district.exposure,
        override: day.override,
      };
    });
}

/**
 * CAP <info> blocks for the languages that have a message; `texts` is { en, hi, ml? } of
 * { message, headline?, instruction? }. Malayalam keeps the English event name.
 */
export function capInfos(alert, texts) {
  const { event, eventHi } = ALERT_LEVELS[alert.level];
  return ['en', 'hi', 'ml']
    .filter((lang) => texts[lang]?.message)
    .map((lang) => ({
      lang,
      event: lang === 'hi' ? eventHi : event,
      headline: texts[lang].headline,
      description: texts[lang].message,
      instruction: texts[lang].instruction,
    }));
}

/** The fields of an alert that go into its CAP document, sent at `sent`. */
export const capFields = (alert, sent) => ({
  identifier: alert.id,
  sent,
  level: alert.level,
  districtId: alert.districtId,
  areaDesc: `${alert.name}, ${alert.state}`,
  validFrom: alert.validity.from,
  validTo: alert.validity.to,
  chance: alert.chance,
  rainfall: alert.rainfall,
});
