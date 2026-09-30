// Server settings from the root .env file. Keys stay on the server: they are never logged or sent
// to the browser.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));

dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

const env = (name, fallback = '') => process.env[name]?.trim() || fallback;

const PROVIDERS = {
  gemini: { key: env('GEMINI_API_KEY'), model: env('GEMINI_MODEL', 'gemini-flash-latest') },
  anthropic: { key: env('ANTHROPIC_API_KEY'), model: env('ANTHROPIC_MODEL', 'claude-opus-5-5') },
};

const requested = env('LLM_PROVIDER', 'gemini').toLowerCase();
const providerName = Object.hasOwn(PROVIDERS, requested) ? requested : 'gemini';

export const config = {
  port: Number(env('API_PORT', '8787')),
  llm: { provider: providerName, ...PROVIDERS[providerName] },
  // Each call to the language model gives up after this long.
  llmTimeoutMs: 30_000,
  paths: {
    data: path.join(ROOT, 'public', 'data'),
    outbox: path.join(ROOT, 'server', 'outbox'),
    cache: path.join(ROOT, 'server', 'cache'),
  },
};

/** Whether a language model can be called at all; without one the assistant uses its fallback. */
export const llmConfigured = () => Boolean(config.llm.key);
