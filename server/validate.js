// Request validation: a failed check throws an error with an HTTP status and a message for the user.

export function httpError(status, message) {
  return Object.assign(new Error(message), { status, expose: true });
}

const MAX_HISTORY_TURNS = 6;
const MAX_TURN_CHARS = 4000;

export function text(value, name, { max, required = true }) {
  if (value === undefined || value === null || value === '') {
    if (required) throw httpError(400, `${name} is required.`);
    return '';
  }
  if (typeof value !== 'string') throw httpError(400, `${name} must be text.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw httpError(400, `${name} is required.`);
  if (trimmed.length > max) throw httpError(400, `${name} is too long (at most ${max} characters).`);
  return trimmed;
}

export function lead(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) throw httpError(400, 'lead must be a day from 1 to 5.');
  return number;
}

export function oneOf(value, name, allowed, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (!allowed.includes(value)) throw httpError(400, `${name} must be one of ${allowed.join(', ')}.`);
  return value;
}

/** Forecaster overrides are checked in detail by sanitizeOverrides; here only the shape. */
export function overrides(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw httpError(400, 'overrides must be an object.');
  return value;
}

/**
 * The last turns of the chat as alternating { role, text } starting with the user, which both
 * model APIs expect; malformed turns are dropped.
 */
export function history(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw httpError(400, 'history must be a list of turns.');
  const turns = [];
  for (const turn of value.slice(-MAX_HISTORY_TURNS)) {
    if (!turn || !['user', 'assistant'].includes(turn.role) || typeof turn.text !== 'string' || !turn.text.trim()) continue;
    const entry = { role: turn.role, text: turn.text.trim().slice(0, MAX_TURN_CHARS) };
    if (turns.at(-1)?.role === entry.role) turns.at(-1).text += `\n\n${entry.text}`;
    else if (turns.length || entry.role === 'user') turns.push(entry);
  }
  // The new question follows, so the history must end with an answer.
  if (turns.at(-1)?.role === 'user') turns.pop();
  return turns;
}
