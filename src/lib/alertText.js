// Warning wording shared by the Alerts screen, the Ask Varsha server and the data generator: the
// event for each alert level, and the English and Hindi messages and SMS for a district-day.

import { hindiName } from './hindiNames.js';
import { WARNINGS } from './scales.js';

/** The two levels that get an alert. `probKey` and `threshold` name the chance that sets the level. */
export const ALERT_LEVELS = {
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

export const isAlertLevel = (warning) => Object.hasOwn(ALERT_LEVELS, warning);

const SMS_LIMIT = 160;
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

const joinAnd = (items, and) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}` : items[0]);

/**
 * English and Hindi messages, SMS, headline and safety instruction for a draft alert (see
 * alerts.js). The rain day is the IMD one: the 24 hours ending 08:30 IST on `validity.date`.
 */
export function alertTexts({ districtId, name, level, validity, exposure }) {
  const { event, eventHi, threshold, labelHi } = ALERT_LEVELS[level];
  const label = WARNINGS[level].label;
  const over = Math.floor(threshold);
  const [, month, day] = validity.date.split('-').map(Number);
  const { landslideProne, dams } = exposure;
  const nameHi = hindiName(districtId, name);

  const instruction = landslideProne
    ? 'Stay away from slopes and streams, and follow district administration advice.'
    : 'Avoid rivers and waterlogged roads, and follow district administration advice.';
  const instructionHi = landslideProne
    ? 'ढलानों और नालों से दूर रहें और जिला प्रशासन की सलाह मानें।'
    : 'नदियों और जलभराव वाली सड़कों से दूर रहें और जिला प्रशासन की सलाह मानें।';

  const message = [
    `${label} alert for ${name}.`,
    `${event} (over ${over} mm) is likely in the 24 hours up to 8:30 am on ${day} ${MONTHS_EN[month - 1]}.`,
    landslideProne && 'Landslides are possible in hilly areas.',
    dams.length > 0 && `Watch for water releases from ${joinAnd(dams, 'and')} ${dams.length > 1 ? 'dams' : 'dam'}.`,
    instruction,
  ]
    .filter(Boolean)
    .join(' ');

  const messageHi = [
    `${labelHi}, ${nameHi}: ${day} ${MONTHS_HI[month - 1]} सुबह 8:30 बजे तक के 24 घंटों में ${eventHi} (${over} मिमी से अधिक) की संभावना।`,
    landslideProne && 'पहाड़ी क्षेत्रों में भूस्खलन संभव है।',
    dams.length > 0 && `${joinAnd(dams, 'और')} ${dams.length > 1 ? 'बांधों' : 'बांध'} से पानी छोड़े जाने पर नज़र रखें।`,
    instructionHi,
  ]
    .filter(Boolean)
    .join(' ');

  // The longest English variant that fits one 160-character SMS.
  const head = `${label.toUpperCase()} ALERT ${name}: ${event.toLowerCase()} (over ${over} mm) likely till 8:30 am, ${day} ${MONTHS_EN[month - 1].slice(0, 3)}.`;
  const advice = landslideProne ? 'Landslides possible. Avoid slopes and streams.' : 'Avoid rivers and flooded roads.';
  const sms = [`${head} ${advice} Follow district advice.`, `${head} ${advice}`, head].find((text) => text.length <= SMS_LIMIT) ?? head;

  const smsHi = [
    `${labelHi} ${nameHi}: ${day} ${MONTHS_HI[month - 1]} सुबह 8:30 बजे तक ${eventHi} (${over} मिमी से अधिक) की संभावना।`,
    landslideProne ? 'भूस्खलन संभव। ढलानों और नालों से दूर रहें।' : 'नदियों और जलभराव से दूर रहें।',
  ].join(' ');

  return {
    en: { message, sms, instruction, headline: `${label} alert: ${event.toLowerCase()} in ${name}` },
    hi: { message: messageHi, sms: smsHi, instruction: instructionHi, headline: `${labelHi}: ${nameHi} में ${eventHi}` },
  };
}

// GSM 03.38 characters: the extension table's count twice; anything else makes the SMS Unicode.
const GSM_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
const GSM_EXTENDED = new Set('^{}\\[~]|€');

/**
 * Length and number of SMS segments: 160 GSM characters or 70 Unicode (UTF-16) units in one
 * message; a longer text is split into parts of 153 or 67 to leave room for the joining header.
 */
export function smsSegments(text) {
  const chars = [...text];
  const gsm = chars.every((c) => GSM_BASIC.has(c) || GSM_EXTENDED.has(c));
  const length = gsm ? chars.reduce((n, c) => n + (GSM_EXTENDED.has(c) ? 2 : 1), 0) : text.length;
  const [single, part] = gsm ? [160, 153] : [70, 67];
  const segments = length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / part);
  return { encoding: gsm ? 'GSM' : 'Unicode', length, single, segments };
}
