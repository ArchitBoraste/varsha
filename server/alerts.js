// Approved alerts: the CAP 1.2 document is written to server/outbox and listed in an Atom feed, the
// shape SACHET and other CAP aggregators poll. The other channels are simulated with a receipt.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { alertTexts } from '../src/lib/alertText.js';
import { ALERT_ID_PATTERN, capFields, capInfos, draftAlerts } from '../src/lib/alerts.js';
import { CAP_SENDER_NAME, buildCap, xmlEscape } from '../src/lib/cap.js';
import { addSeconds, scenarioNow } from '../src/lib/clock.js';
import { config } from './config.js';
import { data, effectiveForecast } from './data.js';
import * as check from './validate.js';

const CHANNELS = ['sachet', 'sms', 'email', 'webhook'];
const MESSAGE_MAX = 1200;
const SMS_MAX = 480;
const INDEX_FILE = path.join(config.paths.outbox, 'index.json');

function loadIndex() {
  try {
    return JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Sent alerts, newest first: { identifier, headline, summary, sent, published }.
let sentAlerts = loadIndex();

/** A plausible, stable number of district officials on the SMS list: 18 to 57. */
function officialsFor(districtId) {
  let hash = 0;
  for (const char of districtId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 18 + (hash % 40);
}

function readTexts(body) {
  const texts = body.texts && typeof body.texts === 'object' ? body.texts : {};
  const pick = (lang, required) =>
    texts[lang] && {
      message: check.text(texts[lang].message, `${lang} message`, { max: MESSAGE_MAX, required }),
      sms: check.text(texts[lang].sms, `${lang} SMS`, { max: SMS_MAX, required: false }),
    };
  if (!texts.en) throw check.httpError(400, 'The English message is required.');
  return { en: pick('en', true), hi: pick('hi', false), ml: pick('ml', false) };
}

function receiptFor(alert, channels, sent) {
  const steps = {
    sachet: 'CAP 1.2 published to SACHET feed',
    sms: `SMS queued to ${officialsFor(alert.districtId)} district officials`,
    email: `Email sent to ${alert.state} SDMA`,
    webhook: 'Webhook delivered to partner apps',
  };
  return channels.map((channel, index) => ({ channel, label: steps[channel], at: addSeconds(sent, 2 + index * 3) }));
}

/** Validates an approved alert against the forecast, writes its CAP file and returns the receipt. */
export function sendAlert(id, body) {
  if (!ALERT_ID_PATTERN.test(id)) throw check.httpError(400, 'That is not an alert identifier.');
  const lead = check.lead(body.lead);
  const channels = CHANNELS.filter((channel) => Array.isArray(body.channels) && body.channels.includes(channel));
  if (!channels.length) throw check.httpError(400, 'Choose at least one channel.');
  const texts = readTexts(body);

  // The alert must still follow from the forecast the forecaster sees, overrides included.
  const forecast = effectiveForecast(check.overrides(body.overrides));
  const alert = draftAlerts(forecast, data.meta.leads[lead - 1], data.codes).find((draft) => draft.id === id);
  if (!alert) throw check.httpError(409, 'This district no longer has a red or orange warning for that day.');

  const templates = alertTexts(alert);
  const infos = capInfos(alert, {
    en: { ...templates.en, message: texts.en.message },
    hi: texts.hi && { ...templates.hi, message: texts.hi.message },
    ml: texts.ml && { message: texts.ml.message },
  });
  const sent = scenarioNow(data.meta.run.init);
  const xml = buildCap(capFields(alert, sent), infos);

  mkdirSync(config.paths.outbox, { recursive: true });
  writeFileSync(path.join(config.paths.outbox, `${id}.xml`), `${xml}\n`);
  sentAlerts = [
    { identifier: id, headline: templates.en.headline, summary: texts.en.message, sent, published: channels.includes('sachet') },
    ...sentAlerts.filter((entry) => entry.identifier !== id),
  ];
  writeFileSync(INDEX_FILE, `${JSON.stringify(sentAlerts, null, 1)}\n`);

  return { identifier: id, sent, capUrl: `/api/cap/alerts/${id}.xml`, deliveries: receiptFor(alert, channels, sent) };
}

/** The sent alert's CAP file, or null. */
export function readCap(file) {
  const id = file.replace(/\.xml$/, '');
  if (!ALERT_ID_PATTERN.test(id)) return null;
  try {
    return readFileSync(path.join(config.paths.outbox, `${id}.xml`), 'utf8');
  } catch {
    return null;
  }
}

/** Atom feed of the alerts published to the SACHET channel, newest first. */
export function capFeed(baseUrl) {
  const published = sentAlerts.filter((entry) => entry.published);
  const updated = published[0]?.sent ?? `${data.meta.run.init.slice(0, 19)}Z`;
  const entries = published.map(({ identifier, headline, summary, sent }) =>
    [
      '  <entry>',
      `    <id>urn:varsha:cap:${identifier}</id>`,
      `    <title>${xmlEscape(headline)}</title>`,
      `    <updated>${sent}</updated>`,
      `    <author><name>${xmlEscape(CAP_SENDER_NAME)}</name></author>`,
      `    <link rel="alternate" type="application/cap+xml" href="${baseUrl}/api/cap/alerts/${identifier}.xml"/>`,
      `    <summary>${xmlEscape(summary)}</summary>`,
      '  </entry>',
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '  <id>urn:varsha:cap:feed</id>',
    `  <title>${xmlEscape(CAP_SENDER_NAME)} CAP alerts</title>`,
    `  <updated>${updated}</updated>`,
    `  <link rel="self" type="application/atom+xml" href="${baseUrl}/api/cap/feed"/>`,
    ...entries,
    '</feed>',
  ].join('\n');
}
