// Google Gemini through the official @google/genai SDK.

import { GoogleGenAI } from '@google/genai';

export function createGemini({ key, model, timeoutMs }) {
  const ai = new GoogleGenAI({ apiKey: key });
  const request = (contents, config) =>
    ai.models.generateContent({ model, contents, config: { ...config, httpOptions: { timeout: timeoutMs } } });

  return {
    /**
     * Runs the conversation with tool calling: at most `maxRounds` rounds of tool calls, then the
     * model must answer in text. Returns the final text.
     */
    async runToolLoop({ system, history, tools, execute, maxRounds }) {
      const contents = history.map(({ role, text }) => ({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text }] }));
      const functionDeclarations = tools.map(({ name, description, parameters }) => ({ name, description, parametersJsonSchema: parameters }));

      for (let round = 0; ; round++) {
        const lastRound = round === maxRounds;
        const response = await request(contents, {
          systemInstruction: system,
          tools: [{ functionDeclarations }],
          toolConfig: { functionCallingConfig: { mode: lastRound ? 'NONE' : 'AUTO' } },
        });
        const calls = response.functionCalls ?? [];
        if (!calls.length || lastRound) return response.text ?? '';

        // The model's turn goes back unchanged, so any thought signatures in it are kept.
        contents.push(response.candidates[0].content);
        contents.push({
          role: 'user',
          parts: calls.map((call) => ({
            functionResponse: { id: call.id, name: call.name, response: { result: execute(call.name, call.args ?? {}) } },
          })),
        });
      }
    },

    async complete({ system, prompt }) {
      const response = await request([{ role: 'user', parts: [{ text: prompt }] }], { systemInstruction: system });
      return response.text ?? '';
    },
  };
}
