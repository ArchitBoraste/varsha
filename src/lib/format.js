// Number, date and text formatting for the UI.

const MINUS = '−';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sign = (value) => (value > 0 ? '+' : value < 0 ? MINUS : '');

export const formatMm = (mm) => `${Math.round(mm)} mm`;

/** "+163", "−12" or "0". */
export const formatSigned = (value) => `${sign(Math.round(value))}${Math.abs(Math.round(value))}`;

export const formatSignedMm = (mm) => `${formatSigned(mm)} mm`;

/** "+0.08", "−0.06" or "0.00" with a fixed number of decimals. */
export function formatSignedDecimal(value, digits) {
  const text = Math.abs(value).toFixed(digits);
  return Number(text) === 0 ? text : `${sign(value)}${text}`;
}

/** Probability (0–1) as a whole percentage. */
export const formatPercent = (p) => `${Math.round(p * 100)}%`;

/** Indian digit grouping: 8,17,420. */
export const formatIndian = (n) => Math.round(n).toLocaleString('en-IN');

const oneDecimal = (value) => value.toFixed(1).replace(/\.0$/, '');

/** People in lakh and crore: 8.2 lakh, 7.2 crore; smaller counts in Indian grouping. */
export function formatPeople(n) {
  if (n >= 1e7) return `${oneDecimal(n / 1e7)} crore`;
  if (n >= 1e5) return `${oneDecimal(n / 1e5)} lakh`;
  return formatIndian(n);
}

/** "30 Jul" from an ISO date (YYYY-MM-DD). */
export function formatShortDate(isoDate) {
  const [, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/** "09:42", the local 24-hour time of an ISO timestamp. */
export const formatClock = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

/** "1 large dam", "2 large dams". */
export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Lower-cases the first letter unless the text starts with an acronym ("WD interaction"). */
export const lowerFirst = (text) => (/^[A-Z]{2}/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1));

/** "a", "a and b", "a, b and c". */
export const joinAnd = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0] ?? '');
