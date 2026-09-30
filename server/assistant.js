// Ask Varsha: a grounded answer from the language model with read-only tools, or from the rule-based
// fallback. The reply's table, sources and actions are built from the tool calls, not from free text.

import { isAlertLevel } from '../src/lib/alertText.js';
import { data, effectiveForecast } from './data.js';
import { fallbackAnswer } from './fallback.js';
import { llm, llmLabel } from './llm/index.js';
import { TOOLS, runTool } from './tools.js';

const MAX_TOOL_ROUNDS = 5;
const LANGUAGES = { en: 'English', hi: 'Hindi', ml: 'Malayalam' };
// Tools whose districts the reply can act on (draft alerts, show on the map).
const ACTIONABLE = new Set(['list_districts', 'get_district', 'get_regime_mix', 'compare_leads']);

const leadLines = data.meta.leads.map(({ lead, period, date }) => `- Day ${lead}: ${period} ${date.slice(0, 4)}`).join('\n');

function systemPrompt(lead, lang) {
  return `You are Varsha Assist, the assistant inside Varsha, a regime-aware rainfall forecast system used by IMD and NCMRWF forecasters and district officials in India.

Data: the ${data.meta.run.model} ${data.meta.run.longLabel} run, corrected by Varsha ("Varsha" is the corrected forecast, "raw" is raw GFS). Lead days are IMD rain days of 24 h ending 08:30 IST:
${leadLines}
"Tomorrow" is Day 1. The app currently shows Day ${lead}; use it when the user does not name a day.

Rules:
- Answer only from tool results. Never invent, estimate or round away numbers; if the tools cannot answer, say so.
- Use IMD terms: heavy rain ≥ 64.5 mm, very heavy ≥ 115.6 mm, extremely heavy ≥ 204.5 mm in 24 h. Warning levels: red (take action) when the chance of ≥ 204.5 mm is at least 60%, orange (be prepared) when the chance of ≥ 115.6 mm is at least 50%, yellow (be aware) when the chance of ≥ 64.5 mm is at least 50%, otherwise green.
- Be concise: one lead sentence that answers, then a few short sentences at most. When you list districts, do not repeat their numbers in a list or table: the app shows a table from your list_districts call under your text.
- When asked why, name the regime and the top drivers (the why and driver fields).
- Mention a forecaster override when a result has one: it replaces the regime engine's call for that district and day.
- The demo holds only this run. For "what changed since yesterday's run", say so and compare Day 1 with Day 2 with compare_leads.
- For "where is the raw model worst", call get_verification without a regime and give the regime with the lowest raw ETS and the one with the largest raw RMSE, with the numbers.
- You explain and draft (bulletins, messages, translations). You never issue or approve warnings: a duty forecaster approves every alert on the Alerts screen.
- Politely refuse anything outside Varsha's data (other places or dates, general knowledge, code, personal advice) in one sentence and say what you can help with.
- Reply in the user's language; Hindi and Malayalam are welcome. Keep numbers in digits.${lang && lang !== 'en' ? ` The user prefers ${LANGUAGES[lang]}.` : ''}
- Plain text. No headings or tables; **bold** and short "- " lists are fine.`;
}

/** Drops Markdown the drawer does not render: tables and heading marks. */
const cleanText = (text) =>
  text
    .split('\n')
    .filter((line) => !line.trim().startsWith('|'))
    .map((line) => line.replace(/^#{1,6}\s+/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function buildReply(text, calls, forecast) {
  const sources = [...new Set(calls.flatMap((call) => call.source ?? []))];
  const withIds = calls.filter((call) => ACTIONABLE.has(call.name) && call.districtIds?.length);
  const overridden = withIds.some((call) => call.districtIds.some((id) => forecast[id].days[call.lead - 1].override));
  if (overridden) sources.push('Forecaster override');

  const reply = { text, sources };
  const table = calls.findLast((call) => call.table)?.table;
  if (table) reply.table = table;

  // Act on the districts of the table's call, else of the last call about districts.
  const basis = calls.findLast((call) => call.table && withIds.includes(call)) ?? withIds.at(-1);
  if (basis) {
    const { districtIds, lead } = basis;
    const warned = districtIds.filter((id) => isAlertLevel(forecast[id].days[lead - 1].warning));
    reply.actions = [
      ...(warned.length && basis.name !== 'compare_leads' ? [{ type: 'draft_alerts', districtIds: warned, lead }] : []),
      { type: 'show_on_map', districtIds, lead },
    ];
  }
  return reply;
}

/** Answers `question` for the client's lead day and overrides; never throws for model failures. */
export async function answer({ question, history, lead, overrides, lang }) {
  const forecast = effectiveForecast(overrides);
  const ctx = { forecast, lead };
  let calls = [];
  const execute = (name, args) => {
    const output = runTool(name, args, ctx);
    calls.push({ name, ...output });
    return output.result;
  };

  let text = '';
  if (llm) {
    try {
      const reply = await llm.runToolLoop({
        system: systemPrompt(lead, lang),
        history: [...history, { role: 'user', text: question }],
        tools: TOOLS,
        execute,
        maxRounds: MAX_TOOL_ROUNDS,
      });
      text = cleanText(reply);
    } catch (error) {
      console.warn(`[assistant] ${llmLabel} failed: ${error.message}`);
    }
  }
  if (!text) {
    console.log('[assistant] fallback used');
    calls = [];
    text = fallbackAnswer(question, { lead, lang, execute });
  }
  return buildReply(text, calls, forecast);
}
