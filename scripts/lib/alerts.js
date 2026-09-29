// Draft alerts for every red and orange district on Day 1: messages in English and Hindi, an
// SMS and a CAP 1.2 document for NDMA's SACHET feed.

import { REGIME_BY_ID, WARNINGS } from '../../src/lib/scales.js';
import { mainRegime } from './regimes.js';

const SENDER = 'alerts@varsha.demo';
const DRAFTED_AT = '2024-07-29T09:40:00+05:30';
const SMS_LIMIT = 160;

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

const LEVELS = {
  red: {
    event: 'Extremely heavy rain',
    eventHi: 'अत्यंत भारी वर्षा',
    probKey: 'p204',
    threshold: 204.5,
    severity: 'Severe',
    responseType: 'Execute',
    labelHi: 'रेड अलर्ट',
  },
  orange: {
    event: 'Very heavy rain',
    eventHi: 'बहुत भारी वर्षा',
    probKey: 'p115',
    threshold: 115.6,
    severity: 'Moderate',
    responseType: 'Prepare',
    labelHi: 'ऑरेंज अलर्ट',
  },
};

const xmlEscape = (text) =>
  String(text).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

const joinAnd = (items, and) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}` : items[0]);

/** Three-letter code: first letter, next consonant and last consonant (Wayanad → WYD), kept unique. */
function districtCode(name, used) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  const consonants = letters.slice(1).replace(/[AEIOU]/g, '');
  const candidates = [letters[0] + consonants[0] + consonants.at(-1), letters.slice(0, 3), letters[0] + consonants.slice(0, 2)];
  let code = candidates.find((c) => c.length === 3 && !used.has(c));
  for (let n = 2; !code; n++) code = `${letters.slice(0, 2)}${n}`;
  used.add(code);
  return code;
}

function messages(district, level, validTo) {
  const { name, exposure } = district;
  const { event, eventHi, threshold, labelHi } = LEVELS[level];
  const over = Math.floor(threshold);
  const day = validTo.getUTCDate();
  const month = validTo.getUTCMonth();
  const { landslideProne, dams } = exposure;

  const instruction = landslideProne
    ? 'Stay away from slopes and streams, and follow district administration advice.'
    : 'Avoid rivers and waterlogged roads, and follow district administration advice.';
  const messageEn = [
    `${WARNINGS[level].label} alert for ${name}.`,
    `${event} (over ${over} mm) is likely in the 24 hours up to 8:30 am on ${day} ${MONTHS_EN[month]}.`,
    landslideProne && 'Landslides are possible in hilly areas.',
    dams.length > 0 && `Watch for water releases from ${joinAnd(dams, 'and')} ${dams.length > 1 ? 'dams' : 'dam'}.`,
    instruction,
  ]
    .filter(Boolean)
    .join(' ');

  const messageHi = [
    `${labelHi}, ${name}: ${day} ${MONTHS_HI[month]} सुबह 8:30 बजे तक के 24 घंटों में ${eventHi} (${over} मिमी से अधिक) की संभावना।`,
    landslideProne && 'पहाड़ी क्षेत्रों में भूस्खलन संभव है।',
    dams.length > 0 && `${joinAnd(dams, 'और')} ${dams.length > 1 ? 'बांधों' : 'बांध'} से पानी छोड़े जाने पर नज़र रखें।`,
    landslideProne
      ? 'ढलानों और नालों से दूर रहें और जिला प्रशासन की सलाह मानें।'
      : 'नदियों और जलभराव वाली सड़कों से दूर रहें और जिला प्रशासन की सलाह मानें।',
  ]
    .filter(Boolean)
    .join(' ');

  // Longest SMS variant that fits a single 160-character message.
  const head = `${WARNINGS[level].label.toUpperCase()} ALERT ${name}: ${event.toLowerCase()} (over ${over} mm) likely till 8:30 am, ${day} ${MONTHS_EN[month].slice(0, 3)}.`;
  const advice = landslideProne ? 'Landslides possible. Avoid slopes and streams.' : 'Avoid rivers and flooded roads.';
  const sms = [`${head} ${advice} Follow district advice.`, `${head} ${advice}`, head].find((text) => text.length <= SMS_LIMIT);
  if (!sms) throw new Error(`No SMS variant fits ${SMS_LIMIT} characters for ${name}`);

  return { messageEn, messageHi, sms, instruction };
}

function capXml({ id, level, event, validity, chance, name, state, messageEn, instruction }) {
  const { severity, responseType, threshold } = LEVELS[level];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">',
    `  <identifier>${id}</identifier>`,
    `  <sender>${SENDER}</sender>`,
    `  <sent>${DRAFTED_AT}</sent>`,
    '  <status>Actual</status>',
    '  <msgType>Alert</msgType>',
    '  <scope>Public</scope>',
    '  <info>',
    '    <language>en-IN</language>',
    '    <category>Met</category>',
    `    <event>${event}</event>`,
    `    <responseType>${responseType}</responseType>`,
    '    <urgency>Expected</urgency>',
    `    <severity>${severity}</severity>`,
    `    <certainty>${chance.p >= 0.5 ? 'Likely' : 'Possible'}</certainty>`,
    `    <effective>${DRAFTED_AT}</effective>`,
    `    <onset>${validity.from}</onset>`,
    `    <expires>${validity.to}</expires>`,
    '    <senderName>Varsha regime-aware rainfall forecasts (demo)</senderName>',
    `    <headline>${WARNINGS[level].label} alert: ${event.toLowerCase()} in ${xmlEscape(name)}</headline>`,
    `    <description>${xmlEscape(messageEn)}</description>`,
    `    <instruction>${xmlEscape(instruction)}</instruction>`,
    '    <parameter>',
    `      <valueName>ChanceOfRainAtOrAbove${threshold}mm</valueName>`,
    `      <value>${chance.p}</value>`,
    '    </parameter>',
    '    <area>',
    `      <areaDesc>${xmlEscape(name)}, ${xmlEscape(state)}</areaDesc>`,
    '    </area>',
    '  </info>',
    '</alert>',
  ].join('\n');
}

/** One draft per red or orange district on `leadInfo`'s day, most severe and most likely first. */
export function buildAlerts(forecast, leadInfo) {
  const validTo = new Date(leadInfo.validTo);
  const idDate = leadInfo.date.replaceAll('-', '');
  const usedCodes = new Set();

  const warned = Object.entries(forecast)
    .map(([districtId, district]) => ({ districtId, district, day: district.days[leadInfo.lead - 1] }))
    .filter(({ day }) => day.warning in LEVELS)
    .sort((a, b) => {
      const byLevel = Object.keys(LEVELS).indexOf(a.day.warning) - Object.keys(LEVELS).indexOf(b.day.warning);
      const chance = ({ day }) => day.probs[LEVELS[day.warning].probKey];
      return byLevel || chance(b) - chance(a) || b.day.corrected - a.day.corrected;
    });

  return warned.map(({ districtId, district, day }) => {
    const level = day.warning;
    const { event, probKey, threshold } = LEVELS[level];
    const regime = mainRegime(day.p);
    const { instruction, ...text } = messages(district, level, validTo);
    const alert = {
      id: `VRS-${idDate}-${districtCode(district.name, usedCodes)}`,
      districtId,
      name: district.name,
      state: district.state,
      status: 'draft',
      level,
      event,
      validity: { label: leadInfo.period, from: leadInfo.validFrom, to: leadInfo.validTo },
      chance: { threshold, p: day.probs[probKey] },
      rainfall: { mm: day.corrected, range: day.range },
      regime: { id: regime, label: REGIME_BY_ID[regime].label, share: day.p[regime] },
      exposure: district.exposure,
      ...text,
    };
    return { ...alert, capXml: capXml({ ...alert, instruction }) };
  });
}
