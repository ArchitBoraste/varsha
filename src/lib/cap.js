// CAP 1.2 (OASIS Common Alerting Protocol) documents for NDMA's SACHET feed. The Alerts screen
// previews them and the server writes the same document when an alert is sent.

import { ALERT_LEVELS } from './alertText.js';

const CAP_SENDER = 'alerts@varsha.demo';
export const CAP_SENDER_NAME = 'Varsha (demo)';
const CAP_NAMESPACE = 'urn:oasis:names:tc:emergency:cap:1.2';

const LANGUAGE_TAGS = { en: 'en-IN', hi: 'hi-IN', ml: 'ml-IN' };

const ESCAPES = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
export const xmlEscape = (text) => String(text).replace(/[<>&'"]/g, (c) => ESCAPES[c]);

/** `<name>value</name>`, escaped, or nothing for an empty value. */
const element = (indent, name, value) =>
  value === undefined || value === null || value === '' ? [] : [`${indent}<${name}>${xmlEscape(value)}</${name}>`];

const parameter = (indent, name, value) => [
  `${indent}<parameter>`,
  `${indent}  <valueName>${name}</valueName>`,
  `${indent}  <value>${xmlEscape(value)}</value>`,
  `${indent}</parameter>`,
];

/**
 * A pretty-printed CAP 1.2 alert with one <info> block per language.
 *
 * @param {object} alert  { identifier, sent, level, districtId, areaDesc, validFrom, validTo, chance: { threshold, p },
 *                        rainfall: { mm, range } }
 * @param {object[]} infos [{ lang: 'en'|'hi'|'ml', event, headline?, description, instruction? }]
 */
export function buildCap(alert, infos) {
  const { severity, responseType } = ALERT_LEVELS[alert.level];
  const info = ({ lang, event, headline, description, instruction }) => [
    '  <info>',
    ...element('    ', 'language', LANGUAGE_TAGS[lang]),
    '    <category>Met</category>',
    ...element('    ', 'event', event),
    `    <responseType>${responseType}</responseType>`,
    '    <urgency>Expected</urgency>',
    `    <severity>${severity}</severity>`,
    // Alerts are drafted only when the level's chance is at least 50%.
    '    <certainty>Likely</certainty>',
    ...element('    ', 'effective', alert.sent),
    ...element('    ', 'onset', alert.validFrom),
    ...element('    ', 'expires', alert.validTo),
    ...element('    ', 'senderName', CAP_SENDER_NAME),
    ...element('    ', 'headline', headline),
    ...element('    ', 'description', description),
    ...element('    ', 'instruction', instruction),
    ...parameter('    ', `ChanceOfRainAtOrAbove${alert.chance.threshold}mm`, alert.chance.p),
    ...parameter('    ', 'VarshaRainfallMm', alert.rainfall.mm),
    ...parameter('    ', 'LikelyRangeMm', alert.rainfall.range.join('-')),
    '    <area>',
    ...element('      ', 'areaDesc', alert.areaDesc),
    '      <geocode>',
    '        <valueName>VarshaDistrictId</valueName>',
    ...element('        ', 'value', alert.districtId),
    '      </geocode>',
    '    </area>',
    '  </info>',
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<alert xmlns="${CAP_NAMESPACE}">`,
    ...element('  ', 'identifier', alert.identifier),
    ...element('  ', 'sender', CAP_SENDER),
    ...element('  ', 'sent', alert.sent),
    '  <status>Actual</status>',
    '  <msgType>Alert</msgType>',
    '  <scope>Public</scope>',
    ...infos.flatMap(info),
    '</alert>',
  ].join('\n');
}
