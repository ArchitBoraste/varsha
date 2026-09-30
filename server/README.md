# Varsha API server

Express (Node ESM) on port 8787 (`API_PORT`); Vite proxies `/api` here. Settings come from the root
`.env` (see `.env.example`). It loads `public/data` once at start and imports the shared modules in
`src/lib` (override, summary, alerts, alertText, cap, explain), so its numbers match the UI exactly.

| File            | Role                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| `index.js`      | Routes, localhost-only CORS, JSON body limit, friendly JSON errors                      |
| `config.js`     | `.env` settings; keys never leave this process                                           |
| `data.js`       | The data files and the forecast with a request's overrides applied                      |
| `tools.js`      | Read-only assistant tools and the table, sources and districts each call yields          |
| `assistant.js`  | System prompt, the tool loop (at most five rounds) and the reply shape                    |
| `llm/`          | Gemini (`@google/genai`) and Claude (`@anthropic-ai/sdk`) adapters, 30 s per call        |
| `fallback.js`   | Rule-based answers from the same tools when no model is configured or a call fails       |
| `translate.js`  | Alert translations, cached in `cache/translations.json`                                  |
| `alerts.js`     | Sending an approved alert: CAP file in `outbox/`, receipt, Atom feed                     |
| `validate.js`   | Request checks                                                                          |

| Route                          | Body / result                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `POST /api/ask`                | `{ question, history, lead, overrides, lang? }` → `{ text, table?, sources, actions? }` |
| `POST /api/translate`          | `{ text, target: 'hi' \| 'ml' }` → `{ text }` (`null` without a model)             |
| `POST /api/alerts/:id/send`    | `{ lead, channels, texts, overrides }` → receipt with the delivery steps             |
| `GET /api/cap/feed`            | Atom feed of alerts published to the SACHET channel                                  |
| `GET /api/cap/alerts/:id.xml`  | A sent alert's CAP 1.2 document                                                      |
| `GET /api/health`              | `{ ok: true }`                                                                       |

`outbox/` and `cache/` are written at run time and are not committed.
