// District search over district and state names.

const normalize = (text) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Search entries for district features, sorted by name. */
export const buildSearchIndex = (features) =>
  features
    .map(({ properties: { id, district, state } }) => ({
      id,
      name: district,
      state,
      nameKey: normalize(district),
      stateKey: normalize(state),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

/** 0 (best) to 4 for a match on the district or state name; Infinity for no match. */
function matchRank({ nameKey, stateKey }, query) {
  if (nameKey.startsWith(query)) return 0;
  if (nameKey.includes(` ${query}`)) return 1;
  if (nameKey.includes(query)) return 2;
  if (stateKey.startsWith(query)) return 3;
  if (stateKey.includes(query)) return 4;
  return Infinity;
}

/** Matching entries, best first; empty for an empty query. */
export function searchDistricts(index, query, limit = Infinity) {
  const q = normalize(query);
  if (!q) return [];
  return index
    .map((entry) => ({ entry, rank: matchRank(entry, q) }))
    .filter(({ rank }) => rank < Infinity)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

/** Whether a district or state name matches the query (an empty query matches everything). */
export function matchesQuery(name, state, query) {
  const q = normalize(query);
  return !q || matchRank({ nameKey: normalize(name), stateKey: normalize(state) }, q) < Infinity;
}
