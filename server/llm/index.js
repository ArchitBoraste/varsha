// The configured language model, or null when no API key is set.

import { config } from '../config.js';
import { createAnthropic } from './anthropic.js';
import { createGemini } from './gemini.js';

const FACTORIES = { gemini: createGemini, anthropic: createAnthropic };

const { provider, key, model } = config.llm;

export const llm = key ? FACTORIES[provider]({ key, model, timeoutMs: config.llmTimeoutMs }) : null;

export const llmLabel = `${provider} (${model})`;
