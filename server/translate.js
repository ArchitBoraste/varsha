// Alert translations drafted by the language model, cached on disk so a message is translated once.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { llm, llmLabel } from './llm/index.js';

export const TRANSLATION_TARGETS = { hi: 'Hindi', ml: 'Malayalam' };

const CACHE_FILE = path.join(config.paths.cache, 'translations.json');

function loadCache() {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const cache = loadCache();

function saveCache() {
  try {
    mkdirSync(config.paths.cache, { recursive: true });
    writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 1)}\n`);
  } catch (error) {
    console.warn(`[translate] could not write the cache: ${error.message}`);
  }
}

const SYSTEM =
  'You translate Indian public weather warnings for official SMS and CAP alerts. Translate faithfully and plainly, as IMD and state disaster management authorities write them. Keep every number, unit (write mm in the target script), date and time exactly; keep district and dam names recognisable in the target script. Reply with the translation only.';

/**
 * `text` in the target language, or null when no model is configured or it fails; the caller then
 * shows the English text.
 */
export async function translate(text, target) {
  const key = createHash('sha256').update(`${target}\n${text}`).digest('hex');
  if (cache[key]) return { text: cache[key], cached: true };
  if (!llm) return { text: null };

  try {
    const translated = (await llm.complete({ system: SYSTEM, prompt: `Translate into ${TRANSLATION_TARGETS[target]}:\n\n${text}` })).trim();
    if (!translated) return { text: null };
    cache[key] = translated;
    saveCache();
    return { text: translated, cached: false };
  } catch (error) {
    console.warn(`[translate] ${llmLabel} failed: ${error.message}`);
    return { text: null };
  }
}
