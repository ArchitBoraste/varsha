// Varsha's API server: the Ask Varsha assistant, alert translations, and sending approved alerts
// with their CAP 1.2 feed. Vite proxies /api here in development.

import express from 'express';
import { sendAlert, capFeed, readCap } from './alerts.js';
import { answer } from './assistant.js';
import { config, llmConfigured } from './config.js';
import { TRANSLATION_TARGETS, translate } from './translate.js';
import * as check from './validate.js';

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const QUESTION_MAX = 1000;
const TRANSLATE_MAX = 2000;

const app = express();
app.disable('x-powered-by');

// Only pages served from this machine may call the API from a browser.
app.use((req, res, next) => {
  const { origin } = req.headers;
  if (origin && !LOCAL_ORIGIN.test(origin)) return res.status(403).json({ error: 'Requests are accepted from localhost only.' });
  if (origin) {
    res.set({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' });
  }
  return req.method === 'OPTIONS' ? res.sendStatus(204) : next();
});
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/ask', async (req, res) => {
  const body = req.body ?? {};
  const reply = await answer({
    question: check.text(body.question, 'question', { max: QUESTION_MAX }),
    history: check.history(body.history),
    lead: check.lead(body.lead),
    overrides: check.overrides(body.overrides),
    lang: check.oneOf(body.lang, 'lang', ['en', 'hi', 'ml'], undefined),
  });
  res.json(reply);
});

app.post('/api/translate', async (req, res) => {
  const body = req.body ?? {};
  const target = check.oneOf(body.target, 'target', Object.keys(TRANSLATION_TARGETS));
  if (!target) throw check.httpError(400, 'target is required.');
  res.json(await translate(check.text(body.text, 'text', { max: TRANSLATE_MAX }), target));
});

app.post('/api/alerts/:id/send', (req, res) => {
  res.json(sendAlert(req.params.id, req.body ?? {}));
});

const baseUrl = (req) => `${req.protocol}://${req.get('host')}`;

app.get('/api/cap/feed', (req, res) => {
  res.type('application/atom+xml; charset=utf-8').send(capFeed(baseUrl(req)));
});

app.get('/api/cap/alerts/:file', (req, res) => {
  const xml = readCap(req.params.file);
  if (!xml) return res.status(404).json({ error: 'No sent alert has that identifier.' });
  return res.type('application/cap+xml; charset=utf-8').send(xml);
});

app.use('/api', (req, res) => res.status(404).json({ error: 'There is no such API route.' }));

// Express 5 passes errors thrown in async handlers here too.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request body is not valid JSON.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'The request is too large.' });
  if (error.expose && error.status < 500) return res.status(error.status).json({ error: error.message });
  console.error('[server]', error);
  return res.status(500).json({ error: 'Something went wrong on the Varsha server. Please try again.' });
});

app.listen(config.port, 'localhost', (error) => {
  if (error) {
    console.error(`[server] cannot listen on port ${config.port}: ${error.message}`);
    process.exit(1);
  }
  const assistant = llmConfigured() ? `${config.llm.provider} (${config.llm.model})` : 'rule-based answers (no API key set)';
  console.log(`Varsha API on http://localhost:${config.port} · assistant: ${assistant}`);
});
