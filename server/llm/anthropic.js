// Claude through the official @anthropic-ai/sdk.

import Anthropic from '@anthropic-ai/sdk';

const MAX_TOKENS = 8000;
// Current Claude 5-family models take an effort level and a refusal fallback; older ones do not.
const CURRENT_FAMILY = /^claude-(opus|sonnet|fable)-5/;

const textOf = (message) =>
  message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

export function createAnthropic({ key, model, timeoutMs }) {
  // A timed-out or failed call is not retried: the assistant falls back instead.
  const client = new Anthropic({ apiKey: key, timeout: timeoutMs, maxRetries: 0 });
  const options = CURRENT_FAMILY.test(model)
    ? { output_config: { effort: 'low' }, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }
    : {};
  const create = async (params) => {
    const message = await client.beta.messages.create({ model, max_tokens: MAX_TOKENS, ...options, ...params });
    if (message.stop_reason === 'refusal') throw new Error('The model declined the request');
    return message;
  };

  return {
    /**
     * Runs the conversation with tool calling: at most `maxRounds` rounds of tool calls, then the
     * model must answer in text. Returns the final text.
     */
    async runToolLoop({ system, history, tools, execute, maxRounds }) {
      const messages = history.map(({ role, text }) => ({ role, content: text }));
      const definitions = tools.map(({ name, description, parameters }) => ({ name, description, input_schema: parameters }));

      for (let round = 0; ; round++) {
        const lastRound = round === maxRounds;
        const message = await create({
          system,
          tools: definitions,
          tool_choice: { type: lastRound ? 'none' : 'auto' },
          messages,
        });
        const calls = message.content.filter((block) => block.type === 'tool_use');
        if (message.stop_reason !== 'tool_use' || !calls.length || lastRound) return textOf(message);

        messages.push({ role: 'assistant', content: message.content });
        messages.push({
          role: 'user',
          content: calls.map((call) => ({
            type: 'tool_result',
            tool_use_id: call.id,
            content: JSON.stringify(execute(call.name, call.input)),
          })),
        });
      }
    },

    async complete({ system, prompt }) {
      return textOf(await create({ system, messages: [{ role: 'user', content: prompt }] }));
    },
  };
}
