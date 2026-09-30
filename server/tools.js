// Read-only tools for Ask Varsha over the loaded data, with the client's overrides applied. A tool
// returns `result` for the language model and what the reply is built from: `source` labels, and
// optionally a `table` and the `districtIds` it is about.

import { explainCorrection } from '../src/lib/explain.js';
import { capitalize, formatIndian, formatPeople, formatPercent } from '../src/lib/format.js';
import { likeliestPhase, rankRegimes, topRegime } from '../src/lib/regimes.js';
import { THRESHOLDS } from '../src/lib/risk.js';
import { REGIME_BY_ID } from '../src/lib/scales.js';
import { caseDayScores } from '../src/lib/scores.js';
import { buildSearchIndex, normalize, searchDistricts } from '../src/lib/search.js';
import { districtCounts } from '../src/lib/summary.js';
import { data } from './data.js';

const WARNING_RANK = { red: 3, orange: 2, yellow: 1, green: 0 };
const WARNING_FILTERS = {
  red: ['red'],
  orange: ['orange'],
  yellow: ['yellow'],
  green: ['green'],
  orange_or_above: ['red', 'orange'],
  yellow_or_above: ['red', 'orange', 'yellow'],
};
const SORTS = {
  chance: (key) => (a, b) => b.day.probs[key] - a.day.probs[key] || b.day.corrected - a.day.corrected,
  varsha: () => (a, b) => b.day.corrected - a.day.corrected,
  raw: () => (a, b) => b.day.raw - a.day.raw,
  correction: () => (a, b) => b.day.corrected - b.day.raw - (a.day.corrected - a.day.raw),
  name: () => (a, b) => a.district.name.localeCompare(b.district.name),
};
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;
const TABLE_ROWS = 12;

const SEARCH_INDEX = buildSearchIndex(
  Object.entries(data.forecast).map(([id, { name, state }]) => ({ properties: { id, district: name, state } })),
);
const STATES = [...new Set(Object.values(data.forecast).map(({ state }) => state))].sort();

const pct = formatPercent;
const leadInfo = (lead) => data.meta.leads[lead - 1];
const validFor = (lead) => `Day ${lead}: ${leadInfo(lead).period} ${leadInfo(lead).date.slice(0, 4)}`;

/** A lead day from a tool argument, or the one selected in the app. */
function leadArg(value, ctx) {
  const lead = Number(value);
  return Number.isInteger(lead) && lead >= 1 && lead <= data.meta.leads.length ? lead : ctx.lead;
}

/** The IMD threshold nearest to `value` (mm), or undefined. */
function thresholdArg(value) {
  const mm = Number(value);
  if (!Number.isFinite(mm) || mm <= 0) return undefined;
  return THRESHOLDS.reduce((best, t) => (Math.abs(t.mm - mm) < Math.abs(best.mm - mm) ? t : best));
}

function stateArg(value) {
  const query = normalize(String(value ?? ''));
  if (!query) return { state: undefined };
  const state =
    STATES.find((name) => normalize(name) === query) ??
    STATES.find((name) => normalize(name).startsWith(query)) ??
    STATES.find((name) => normalize(name).includes(query));
  return state ? { state } : { error: `No state or union territory matches "${value}".` };
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

/**
 * The district a name (optionally "Name, State") or id refers to: an exact or partial match on
 * the name, else the closest spelling. Returns { id } or { error, candidates? }.
 */
function findDistrict(nameOrId) {
  const text = String(nameOrId ?? '').trim();
  if (!text) return { error: 'Give a district name.' };
  if (Object.hasOwn(data.forecast, text)) return { id: text };

  const [namePart, statePart = ''] = text.split(',');
  const query = normalize(namePart);
  const inState = (entry) => !statePart.trim() || entry.stateKey.includes(normalize(statePart));
  const byName = searchDistricts(SEARCH_INDEX, query, 20).filter((entry) => entry.nameKey.includes(query) && inState(entry));
  const exact = byName.filter((entry) => entry.nameKey === query);
  const matches = exact.length ? exact : byName;
  if (matches.length === 1) return { id: matches[0].id };
  if (matches.length > 1) {
    return { error: `"${text}" matches several districts.`, candidates: matches.slice(0, 6).map((e) => `${e.name}, ${e.state}`) };
  }

  const scored = SEARCH_INDEX.filter(inState)
    .map((entry) => ({ entry, distance: editDistance(query, entry.nameKey) }))
    .sort((a, b) => a.distance - b.distance);
  const [best] = scored;
  if (best && best.distance <= Math.max(1, Math.floor(query.length / 4))) return { id: best.entry.id };
  return { error: `No district matches "${text}".`, candidates: scored.slice(0, 3).map(({ entry }) => `${entry.name}, ${entry.state}`) };
}

const chances = (probs) => Object.fromEntries(THRESHOLDS.map(({ key, mm }) => [`>=${mm}mm`, pct(probs[key])]));

const overrideNote = (day) =>
  day.override && { regime: REGIME_BY_ID[day.override.regime].label, reason: day.override.reason, by: day.override.by };

/** A district-day's numbers as the model sees them. */
function dayFields(day) {
  const regime = topRegime(day.p);
  return {
    varshaMm: day.corrected,
    rawGfsMm: day.raw,
    correctionMm: day.corrected - day.raw,
    likelyRangeMm: `${day.range[0]}-${day.range[1]}`,
    chance: chances(day.probs),
    warning: day.warning,
    mainRegime: `${regime.label} (${pct(regime.share)})`,
    forecasterOverride: overrideNote(day),
  };
}

const dayRow = (id, district, day) => ({ id, district: district.name, state: district.state, ...dayFields(day) });

const mm = (value) => `${value} mm`;

function listDistricts(args, ctx) {
  const lead = leadArg(args.lead, ctx);
  const { state, error } = stateArg(args.state);
  if (error) return { result: { error, knownStates: STATES } };
  const levels = WARNING_FILTERS[args.warning] ?? null;
  const threshold =
    thresholdArg(args.threshold) ??
    (args.warning === 'red' ? THRESHOLDS[2] : args.warning === 'yellow' || args.warning === 'yellow_or_above' ? THRESHOLDS[0] : THRESHOLDS[1]);
  const minProbability = Number(args.minProbability) > 1 ? Number(args.minProbability) / 100 : Number(args.minProbability) || 0;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.round(Number(args.limit)) || DEFAULT_LIMIT));
  const sort = (SORTS[args.sortBy] ?? SORTS.chance)(threshold.key);

  const matched = Object.entries(ctx.forecast)
    .map(([id, district]) => ({ id, district, day: district.days[lead - 1] }))
    .filter(
      ({ district, day }) =>
        (!state || district.state === state) && (!levels || levels.includes(day.warning)) && day.probs[threshold.key] >= minProbability,
    )
    .sort(sort);
  const shown = matched.slice(0, limit);
  const multiState = new Set(shown.map(({ district }) => district.state)).size > 1;

  return {
    result: {
      lead,
      validFor: validFor(lead),
      filters: { state: state ?? 'all India', warning: args.warning ?? 'any', chanceShownAt: `>=${threshold.mm}mm`, minProbability },
      matchingDistricts: matched.length,
      shown: shown.length,
      districts: shown.map(({ id, district, day }) => ({ ...dayRow(id, district, day), why: explainCorrection(district, day) })),
    },
    source: [`District table · Day ${lead}`, 'Regime engine'],
    table: shown.length
      ? {
          columns: ['District', ...(multiState ? ['State'] : []), 'Varsha', `≥ ${threshold.mm} mm`],
          rows: shown
            .slice(0, TABLE_ROWS)
            .map(({ district, day }) => [district.name, ...(multiState ? [district.state] : []), mm(day.corrected), pct(day.probs[threshold.key])]),
          ...(shown.length > TABLE_ROWS && { note: `${shown.length - TABLE_ROWS} more not shown` }),
        }
      : undefined,
    districtIds: shown.map(({ id }) => id),
    lead,
  };
}

function getDistrict(args, ctx) {
  const found = findDistrict(args.nameOrId);
  if (found.error) return { result: found };
  const lead = leadArg(args.lead, ctx);
  const district = ctx.forecast[found.id];
  const day = district.days[lead - 1];
  const regime = topRegime(day.p);
  const { population, landslideProne, dams } = district.exposure;

  return {
    result: {
      id: found.id,
      district: district.name,
      state: district.state,
      selectedLead: lead,
      days: district.days.map((d) => ({ validFor: validFor(d.lead), ...dayFields(d) })),
      whyForSelectedLead: explainCorrection(district, day),
      driversForSelectedLeadMm: day.drivers.map(({ name, mm: value }) => ({
        factor: name === 'Regime expert' ? `${regime.short} regime expert` : name,
        mm: value,
      })),
      exposure: { people: `${formatPeople(population)} (${formatIndian(population)}, Census 2011)`, landslideProne, largeDams: dams },
    },
    source: [`District forecast · ${district.name}`, 'Regime engine'],
    districtIds: [found.id],
    lead,
  };
}

function getNationalSummary(args, ctx) {
  const lead = leadArg(args.lead, ctx);
  const { phase, systems } = data.meta.days[lead - 1];
  const { warnings, exposure, regimes } = districtCounts(ctx.forecast, lead);
  const entries = Object.entries(ctx.forecast).map(([id, district]) => ({ id, district, day: district.days[lead - 1] }));
  const wettest = [...entries].sort(SORTS.varsha()).slice(0, 5);

  return {
    result: {
      lead,
      validFor: validFor(lead),
      run: `${data.meta.run.model}, ${data.meta.run.longLabel}`,
      monsoonPhase: { likeliest: likeliestPhase(phase), active: pct(phase.active), normal: pct(phase.normal), break: pct(phase.break) },
      weatherSystems: systems.map(({ label, location, confidence }) => ({ system: label, location, confidence: pct(confidence) })),
      districtsByWarning: warnings,
      inRedAndOrangeDistricts: {
        people: `${formatPeople(exposure.population)} (${formatIndian(exposure.population)})`,
        landslideProneDistricts: exposure.landslideProne,
        largeDams: exposure.dams,
      },
      districtsByMainRegime: Object.fromEntries(Object.entries(regimes).map(([id, count]) => [REGIME_BY_ID[id].label, count])),
      wettestDistricts: wettest.map(({ id, district, day }) => ({ id, district: district.name, state: district.state, varshaMm: day.corrected, warning: day.warning })),
      forecasterOverrides: entries.filter(({ day }) => day.override).map(({ district }) => district.name),
    },
    source: [`National summary · Day ${lead}`],
    lead,
  };
}

function getRegimeMix(args, ctx) {
  const found = findDistrict(args.nameOrId);
  if (found.error) return { result: found };
  const lead = leadArg(args.lead, ctx);
  const district = ctx.forecast[found.id];
  const day = district.days[lead - 1];

  return {
    result: {
      district: district.name,
      state: district.state,
      validFor: validFor(lead),
      regimeMix: rankRegimes(day.p).map(({ id, label, share }) => ({ regime: label, share: pct(share), expertMm: day.experts[id] })),
      blendedVarshaMm: day.corrected,
      rawGfsMm: day.raw,
      note: 'Varsha = sum of share × expert amount over the six regimes.',
      forecasterOverride: overrideNote(day),
    },
    source: ['Regime engine'],
    districtIds: [found.id],
    lead,
  };
}

const METRICS = ['rmse', 'ets64', 'pod115', 'far115'];
const scorePair = (score) => ({ rawGfs: score.raw, varsha: score.varsha, ci95: score.ci });

function getVerification(args, ctx) {
  const report = data.verification;
  const lead = leadArg(args.lead, ctx);
  const region = report.regions.find(({ id }) => id === args.region) ?? report.regions[0];
  const regime = report.regimes.find(({ id }) => id === args.regime && id !== 'all');
  const about = {
    season: report.seasons[0].label,
    lead,
    region: region.label,
    truth: report.sample.truth,
    metrics: 'RMSE mm/day (lower is better); ETS at >=64.5 mm; POD and FAR at >=115.6 mm',
  };
  const source = [`Verification · ${region.label}, Day ${lead}`];

  if (regime) {
    const entry = report.scores[region.id][regime.id];
    if (!entry) return { result: { ...about, regime: regime.label, error: `No ${regime.label} days in ${region.label}.` }, source };
    const day = entry.leads[lead - 1];
    return {
      result: {
        ...about,
        regime: regime.label,
        ...Object.fromEntries(METRICS.map((metric) => [metric, scorePair(day[metric])])),
        baselineLadderEts64: Object.fromEntries(report.methods.map(({ id, label }) => [label, day.ets64[id]])),
      },
      source,
    };
  }

  const byRegime = report.regimes
    .filter(({ id }) => id !== 'all' && report.scores[region.id][id])
    .map(({ id, label }) => ({ regime: label, ...report.scores[region.id][id].leads[lead - 1] }));
  const ranked = (compare) => [...byRegime].sort(compare).map(({ regime: label }) => label);
  const all = report.scores[region.id].all.leads[lead - 1];

  return {
    result: {
      ...about,
      allRegimes: Object.fromEntries(METRICS.map((metric) => [metric, scorePair(all[metric])])),
      byRegime: byRegime.map((entry) => ({ regime: entry.regime, ...Object.fromEntries(METRICS.map((m) => [m, scorePair(entry[m])])) })),
      rankings: {
        rawGfsWorstFirstByEts64: ranked((a, b) => a.ets64.raw - b.ets64.raw),
        rawGfsWorstFirstByRmse: ranked((a, b) => b.rmse.raw - a.rmse.raw),
        largestVarshaGainFirstByEts64: ranked((a, b) => b.ets64.varsha - b.ets64.raw - (a.ets64.varsha - a.ets64.raw)),
      },
    },
    source,
    table: {
      columns: ['Regime', 'ETS raw → Varsha', 'RMSE raw → Varsha'],
      rows: [...byRegime]
        .sort((a, b) => a.ets64.raw - b.ets64.raw)
        .map((entry) => [entry.regime, `${entry.ets64.raw.toFixed(2)} → ${entry.ets64.varsha.toFixed(2)}`, `${entry.rmse.raw.toFixed(1)} → ${entry.rmse.varsha.toFixed(1)}`]),
    },
  };
}

function getCase(args) {
  const query = normalize(String(args.id ?? ''));
  const summaries = data.cases.map(({ id, title, region, dates, regime }) => ({ id, title, region, dates, mainRegime: REGIME_BY_ID[regime].label }));
  const found = query && data.cases.find(({ id, title, region }) => [id, title, region].some((text) => normalize(text).includes(query)));
  if (!found) {
    return { result: { cases: summaries, ...(query && { error: `No case matches "${args.id}".` }) }, source: ['Case studies'] };
  }

  const focus = data.forecast[found.focusDistrict].name;
  const regionIds = Object.keys(data.forecast).filter((id) => found.focusStates.includes(data.forecast[id].state));
  const days = found.days.map((day) => {
    const { raw, corrected, observed } = day.values[found.focusDistrict];
    const scores = caseDayScores(day, regionIds);
    return {
      rainDay: `24 h to 08:30 IST, ${day.label}`,
      run: day.run,
      focus: { rawGfsMm: raw, varshaMm: corrected, observedMm: observed },
      regionAtOrAbove115_6mm: {
        observedDistricts: scores.observed,
        caughtByVarsha: scores.caught.varsha,
        caughtByRawGfs: scores.caught.raw,
        falseAlarmsVarsha: scores.falseAlarms.varsha,
        falseAlarmsRawGfs: scores.falseAlarms.raw,
      },
    };
  });

  return {
    result: { ...summaries.find(({ id }) => id === found.id), focusDistrict: focus, days },
    source: [`Case study · ${found.title}`],
    table: {
      columns: [`${focus}, 24 h to 08:30`, 'Raw', 'Varsha', 'Observed'],
      rows: found.days.map((day, i) => [day.label, mm(days[i].focus.rawGfsMm), mm(days[i].focus.varshaMm), mm(days[i].focus.observedMm)]),
    },
    districtIds: [found.focusDistrict],
  };
}

function compareLeads(args, ctx) {
  const from = leadArg(args.fromLead ?? 1, ctx);
  const to = leadArg(args.toLead ?? Math.min(from + 1, data.meta.leads.length), ctx);
  const changes = Object.entries(ctx.forecast)
    .map(([id, district]) => ({ id, district, a: district.days[from - 1], b: district.days[to - 1] }))
    .filter(({ a, b }) => a.warning !== b.warning && Math.max(WARNING_RANK[a.warning], WARNING_RANK[b.warning]) >= WARNING_RANK.orange)
    .sort((x, y) => Math.abs(y.b.corrected - y.a.corrected) - Math.abs(x.b.corrected - x.a.corrected));
  const describe = ({ district, a, b }) => ({
    district: district.name,
    state: district.state,
    [`day${from}`]: `${a.warning}, ${a.corrected} mm`,
    [`day${to}`]: `${b.warning}, ${b.corrected} mm`,
  });
  const raised = changes.filter(({ a, b }) => WARNING_RANK[b.warning] > WARNING_RANK[a.warning]);
  const lowered = changes.filter(({ a, b }) => WARNING_RANK[b.warning] < WARNING_RANK[a.warning]);
  const summary = (lead) => ({ validFor: validFor(lead), districtsByWarning: districtCounts(ctx.forecast, lead).warnings });

  return {
    result: {
      note: `The demo holds a single model run (${data.meta.run.longLabel}); this compares two of its lead days.`,
      from: summary(from),
      to: summary(to),
      weatherSystemsTo: data.meta.days[to - 1].systems.map(({ label, location }) => `${label}: ${location}`),
      warningRaised: raised.slice(0, 10).map(describe),
      warningLowered: lowered.slice(0, 15).map(describe),
    },
    source: [`District table · Day ${from} vs Day ${to}`],
    table: changes.length
      ? {
          columns: ['District', `Day ${from}`, `Day ${to}`],
          rows: changes.slice(0, 8).map(({ district, a, b }) => [district.name, `${capitalize(a.warning)} · ${mm(a.corrected)}`, `${capitalize(b.warning)} · ${mm(b.corrected)}`]),
          ...(changes.length > 8 && { note: `${changes.length - 8} more warning changes` }),
        }
      : undefined,
    districtIds: changes.slice(0, 8).map(({ id }) => id),
    lead: to,
  };
}

const LEAD = { type: 'integer', description: 'Lead day 1-5. Defaults to the day selected in the app.' };
const DISTRICT = { type: 'string', description: 'District name (optionally "Name, State") or id, e.g. "Wayanad".' };

/** Name, description and JSON Schema parameters of each tool, plus its implementation. */
export const TOOLS = [
  {
    name: 'list_districts',
    description:
      'Districts for one lead day with Varsha (corrected) and raw GFS rainfall, likely range, chances of IMD heavy-rain thresholds, warning level and main regime, filtered and sorted. Use for any question about which districts get a warning or heavy rain.',
    parameters: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'State or union territory name, e.g. "Kerala".' },
        warning: {
          type: 'string',
          enum: Object.keys(WARNING_FILTERS),
          description: 'Warning filter. orange_or_above = red and orange (the districts that get alerts).',
        },
        threshold: { type: 'number', description: 'IMD threshold in mm for the chance filter, sort and table: 64.5, 115.6 or 204.5.' },
        minProbability: { type: 'number', description: 'Minimum chance (0-1) of reaching the threshold.' },
        sortBy: { type: 'string', enum: Object.keys(SORTS), description: 'chance (default), varsha, raw, correction or name.' },
        limit: { type: 'integer', description: `Maximum districts to return (default ${DEFAULT_LIMIT}, at most ${MAX_LIMIT}).` },
        lead: LEAD,
      },
    },
    run: listDistricts,
  },
  {
    name: 'get_district',
    description:
      "One district's five-day forecast (Varsha, raw GFS, range, chances, warning, regime), why Varsha corrected the selected day (drivers in mm), and exposure. Fuzzy matches the name.",
    parameters: { type: 'object', properties: { nameOrId: DISTRICT, lead: LEAD }, required: ['nameOrId'] },
    run: getDistrict,
  },
  {
    name: 'get_national_summary',
    description:
      'All-India summary for a lead day: monsoon phase, detected weather systems, districts by warning level, people, landslide-prone districts and dams in red and orange districts, districts by main regime and the wettest districts.',
    parameters: { type: 'object', properties: { lead: LEAD } },
    run: getNationalSummary,
  },
  {
    name: 'get_regime_mix',
    description: "A district's regime weights and each regime expert's rainfall; Varsha blends the experts by these weights.",
    parameters: { type: 'object', properties: { nameOrId: DISTRICT, lead: LEAD }, required: ['nameOrId'] },
    run: getRegimeMix,
  },
  {
    name: 'get_verification',
    description:
      'Held-out Monsoon 2024 verification against IMD gridded rainfall, raw GFS vs Varsha: RMSE, ETS >=64.5 mm, POD and FAR >=115.6 mm with 95% intervals. Without a regime it returns every regime with rankings (e.g. where the raw model is worst).',
    parameters: {
      type: 'object',
      properties: {
        lead: LEAD,
        regime: { type: 'string', enum: data.verification.regimes.map(({ id }) => id), description: 'Regime id; omit or "all" to compare regimes.' },
        region: { type: 'string', enum: data.verification.regions.map(({ id }) => id), description: 'Region id; default all India.' },
      },
    },
    run: getVerification,
  },
  {
    name: 'get_case',
    description: 'Past-event replays (raw, Varsha and observed rainfall). Without an id it lists the cases.',
    parameters: { type: 'object', properties: { id: { type: 'string', description: 'Case id or a word from its title, e.g. "wayanad".' } } },
    run: getCase,
  },
  {
    name: 'compare_leads',
    description:
      'How the outlook changes between two lead days of this run: warning counts and the districts whose warning is raised or lowered. Use for "what changed" questions; the demo holds only one run.',
    parameters: {
      type: 'object',
      properties: {
        fromLead: { type: 'integer', description: 'Earlier lead day (default 1).' },
        toLead: { type: 'integer', description: 'Later lead day (default fromLead + 1).' },
      },
    },
    run: compareLeads,
  },
];

const TOOL_BY_NAME = Object.fromEntries(TOOLS.map((tool) => [tool.name, tool]));

/** Runs a tool by name with the model's arguments; unknown tools and failures become an error result. */
export function runTool(name, args, ctx) {
  const tool = TOOL_BY_NAME[name];
  if (!tool) return { result: { error: `Unknown tool ${name}.` } };
  try {
    return tool.run(args && typeof args === 'object' ? args : {}, ctx);
  } catch (error) {
    console.error(`[assistant] tool ${name} failed:`, error.message);
    return { result: { error: `The ${name} tool failed.` } };
  }
}
