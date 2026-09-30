// Rule-based answers for when no language model is configured or the call fails. They use the same
// tools as the model, so the reply's numbers, table, sources and actions are built the same way.

import { lowerFirst } from '../src/lib/format.js';
import { hindiName } from '../src/lib/hindiNames.js';
import { LEVEL_THRESHOLDS } from '../src/lib/risk.js';
import { normalize } from '../src/lib/search.js';
import { data } from './data.js';

const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const SYSTEMS_HI = { depression: 'अवदाब', 'offshore-trough': 'अपतटीय ट्रफ़', 'western-disturbance': 'पश्चिमी विक्षोभ' };
const PLACES_HI = {
  'south Odisha, moving WNW': 'दक्षिण ओडिशा पर, पश्चिम-उत्तर-पश्चिम की ओर बढ़ता हुआ',
  'west Odisha, moving WNW': 'पश्चिम ओडिशा पर, पश्चिम-उत्तर-पश्चिम की ओर बढ़ता हुआ',
  'central Chhattisgarh, moving WNW': 'मध्य छत्तीसगढ़ पर, पश्चिम-उत्तर-पश्चिम की ओर बढ़ता हुआ',
  'west Chhattisgarh, moving WNW': 'पश्चिम छत्तीसगढ़ पर, पश्चिम-उत्तर-पश्चिम की ओर बढ़ता हुआ',
  'east Madhya Pradesh, weakening': 'पूर्वी मध्य प्रदेश पर, कमज़ोर होता हुआ',
  'Konkan to Kerala': 'कोंकण से केरल तक',
  'Goa to Kerala': 'गोवा से केरल तक',
  'coastal Karnataka to Kerala': 'तटीय कर्नाटक से केरल तक',
  'over Jammu and Kashmir': 'जम्मू और कश्मीर पर',
  'over Himachal Pradesh': 'हिमाचल प्रदेश पर',
  'over Uttarakhand, moving away': 'उत्तराखंड पर, दूर जाता हुआ',
};
const PHASES_HI = { active: 'सक्रिय', normal: 'सामान्य', break: 'ब्रेक' };

const STATES = [...new Set(Object.values(data.forecast).map(({ state }) => state))];
// Longest names first, so "North Goa" wins over a shorter name inside it.
const DISTRICTS = Object.entries(data.forecast)
  .map(([id, { name }]) => ({ id, key: normalize(name) }))
  .sort((a, b) => b.key.length - a.key.length);

const DEVANAGARI = /\p{Script=Devanagari}/u;
const escapeRegExp =(text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, name) => new RegExp(`(^|[^a-z])${escapeRegExp(name)}([^a-z]|$)`).test(text);

const regimeOf = (row) => row.mainRegime.replace(/ \(.*\)$/, '');
const firstSentence = (text) => text.slice(0, text.indexOf('.') + 1);
const leadLabel = (lead) => data.meta.leads[lead - 1].period;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
/** A count that opens a sentence: "Three", or digits above ten. */
const countWord = (n) => NUMBER_WORDS[n] ?? String(n);

function askedLead(q, lead) {
  if (/tomorrow|\bkal\b|कल/.test(q)) return 1;
  const day = /day\s*([1-5])/.exec(q);
  return day ? Number(day[1]) : lead;
}

function hindiSummary(lead, execute) {
  const summary = execute('get_national_summary', { lead });
  const warnings = summary.districtsByWarning;
  const exposure = summary.inRedAndOrangeDistricts;
  const info = data.meta.leads[lead - 1];
  const [, month, day] = info.date.split('-').map(Number);
  const { systems } = data.meta.days[lead - 1];
  const wettest = summary.wettestDistricts.slice(0, 3);
  const people = exposure.people.split(' (')[0].replace('crore', 'करोड़').replace('lakh', 'लाख');

  return [
    `**अखिल भारतीय पूर्वानुमान, दिन ${lead}** (${day} ${MONTHS_HI[month - 1]} सुबह 8:30 बजे तक के 24 घंटे):`,
    `- ${warnings.red} ज़िलों में रेड अलर्ट, ${warnings.orange} ज़िलों में ऑरेंज अलर्ट और ${warnings.yellow} ज़िलों में येलो अलर्ट का अनुमान है।`,
    `- सबसे अधिक वर्षा: ${wettest.map((row) => `${hindiName(row.id, row.district)} (${row.varshaMm} मिमी)`).join(', ')}।`,
    `- रेड और ऑरेंज ज़िलों में लगभग ${people} लोग, ${exposure.landslideProneDistricts} भूस्खलन-संभावित ज़िले और ${exposure.largeDams} बड़े बांध हैं।`,
    `- मानसून ${PHASES_HI[summary.monsoonPhase.likeliest]} है; ${systems.map(({ type, location }) => `${SYSTEMS_HI[type]} ${PLACES_HI[location] ?? location}`).join('; ')}।`,
    'चेतावनियाँ ड्यूटी पूर्वानुमानकर्ता की मंज़ूरी के बाद ही जारी होती हैं।',
  ].join('\n');
}

function alertsAnswer(q, lead, execute) {
  const state = STATES.find((name) => mentions(q, normalize(name)));
  const red = /\bred\b/.test(q);
  const orange = /\borange\b/.test(q);
  const warning = red && !orange ? 'red' : orange && !red ? 'orange' : 'orange_or_above';
  const result = execute('list_districts', { state, warning, lead, limit: 12 });
  const where = state ? `${state} ` : '';
  const level = { red: 'red', orange: 'orange', orange_or_above: 'red or orange' }[warning];
  const rows = result.districts;

  if (!rows.length) return `No ${where}district reaches a ${level} warning on Day ${lead} (${leadLabel(lead)}).`;

  const count = result.matchingDistricts;
  const lines = [`${countWord(count)} ${where}${count === 1 ? 'district reaches' : 'districts reach'} a ${level} warning on Day ${lead} (${leadLabel(lead)}).`];
  const regimes = [...new Set(rows.map(regimeOf))];
  const raised = rows.map((row) => row.correctionMm).filter((mm) => mm > 0);
  const regimeText =
    regimes.length === 1
      ? `${rows.length === 1 ? 'It is' : `All ${rows.length} are`} in the ${lowerFirst(regimes[0])} regime`
      : `Most are in the ${lowerFirst(regimeOf(rows[0]))} regime`;
  const raisedText = raised.length
    ? `; Varsha raised the raw GFS totals by ${Math.min(...raised) === Math.max(...raised) ? raised[0] : `${Math.min(...raised)}–${Math.max(...raised)}`} mm`
    : '';
  lines.push(`**Why:** ${regimeText}${raisedText}. For ${rows[0].district}: ${lowerFirst(firstSentence(rows[0].why))}`);
  return lines.join('\n\n');
}

function districtAnswer(id, q, lead, execute) {
  if (/regime|mix|expert|blend/.test(q)) {
    const mix = execute('get_regime_mix', { nameOrId: id, lead });
    const top = mix.regimeMix.filter((entry) => entry.share !== '0%');
    return `${mix.district}, Day ${lead}: the regime engine gives ${top.map(({ regime, share, expertMm }) => `${lowerFirst(regime)} ${share} (expert ${expertMm} mm)`).join(', ')}. Blended, that is ${mix.blendedVarshaMm} mm against raw GFS ${mix.rawGfsMm} mm.`;
  }
  const result = execute('get_district', { nameOrId: id, lead });
  const day = result.days[lead - 1];
  const threshold = LEVEL_THRESHOLDS[day.warning].mm;
  return [
    `**${result.district}, Day ${lead}** (${leadLabel(lead)}): Varsha ${day.varshaMm} mm (likely ${day.likelyRangeMm.replace('-', '–')} mm), raw GFS ${day.rawGfsMm} mm. Chance of ≥ ${threshold} mm: ${day.chance[`>=${threshold}mm`]}, so the warning is ${day.warning}.`,
    `**Why:** ${result.whyForSelectedLead}`,
  ].join('\n\n');
}

function summaryAnswer(lead, execute) {
  const s = execute('get_national_summary', { lead });
  execute('list_districts', { warning: 'orange_or_above', lead, limit: 10 });
  const { red, orange, yellow } = s.districtsByWarning;
  const exposure = s.inRedAndOrangeDistricts;
  const systems = s.weatherSystems.map(({ system, location }) => `${lowerFirst(system)} (${location})`);
  return [
    `Day ${lead} (${leadLabel(lead)}): ${plural(red, 'red district', 'red districts')}, ${orange} orange and ${yellow} yellow.`,
    `About ${exposure.people.split(' (')[0]} people, ${exposure.landslideProneDistricts} landslide-prone districts and ${exposure.largeDams} large dams are in red and orange districts. Wettest: ${s.wettestDistricts
      .slice(0, 3)
      .map(({ district, varshaMm }) => `${district} ${varshaMm} mm`)
      .join(', ')}.`,
    `The monsoon is ${s.monsoonPhase.likeliest} (${s.monsoonPhase[s.monsoonPhase.likeliest]}); systems: ${systems.join(', ')}.`,
  ].join(' ');
}

function changedAnswer(execute) {
  const r = execute('compare_leads', { fromLead: 1, toLead: 2 });
  const [system] = data.meta.days[1].systems;
  const [from, to] = [r.from.districtsByWarning, r.to.districtsByWarning];
  const names = (rows) => rows.slice(0, 4).map(({ district }) => district).join(', ');
  return [
    `Only the ${data.meta.run.longLabel} run is loaded, so here is how its Day 2 differs from Day 1: red districts ${from.red} → ${to.red}, orange ${from.orange} → ${to.orange}.`,
    r.warningLowered.length && `Lowered: ${names(r.warningLowered)}${r.warningLowered.length > 4 ? ' and others' : ''}.`,
    r.warningRaised.length && `Raised: ${names(r.warningRaised)}${r.warningRaised.length > 4 ? ' and others' : ''}, under the ${lowerFirst(system.label)} (${system.location}).`,
  ]
    .filter(Boolean)
    .join(' ');
}

function verificationAnswer(lead, execute) {
  const r = execute('get_verification', { lead });
  const byName = Object.fromEntries(r.byRegime.map((entry) => [entry.regime, entry]));
  const worstEts = byName[r.rankings.rawGfsWorstFirstByEts64[0]];
  const worstRmse = byName[r.rankings.rawGfsWorstFirstByRmse[0]];
  const gain = byName[r.rankings.largestVarshaGainFirstByEts64[0]];
  return [
    `On Day ${lead} (${r.region}, ${r.season}), raw GFS has the least heavy-rain skill in the ${lowerFirst(worstEts.regime)} regime (ETS ${worstEts.ets64.rawGfs.toFixed(2)}; Varsha ${worstEts.ets64.varsha.toFixed(2)})`,
    `and its largest errors in the ${lowerFirst(worstRmse.regime)} regime (RMSE ${worstRmse.rmse.rawGfs} mm/day; Varsha ${worstRmse.rmse.varsha}).`,
    `Varsha gains most in the ${lowerFirst(gain.regime)} regime: ETS ${gain.ets64.rawGfs.toFixed(2)} → ${gain.ets64.varsha.toFixed(2)}.`,
  ].join(' ');
}

function caseAnswer(q, execute) {
  const id = /himachal|delhi|2023/.test(q) ? 'himachal' : 'wayanad';
  const r = execute('get_case', { id });
  const peak = r.days.reduce((best, day) => (day.focus.observedMm > best.focus.observedMm ? day : best));
  const caught = peak.regionAtOrAbove115_6mm;
  return `${r.title} (${r.region}, ${r.dates}), ${lowerFirst(r.mainRegime)} regime. On the wettest day (${peak.rainDay}) ${r.focusDistrict} got ${peak.focus.observedMm} mm: raw GFS forecast ${peak.focus.rawGfsMm} mm and Varsha ${peak.focus.varshaMm} mm. Of ${caught.observedDistricts} districts with ≥ 115.6 mm, Varsha caught ${caught.caughtByVarsha} and raw GFS ${caught.caughtByRawGfs}.`;
}

const SCOPE =
  'I can only answer from Varsha’s forecast data: district rainfall and warnings, regimes and why a forecast was corrected, the national outlook, verification scores and the case studies. Try “Which Kerala districts need a red alert tomorrow, and why?”';

/** A deterministic answer to the common questions, calling the tools through `execute`. */
export function fallbackAnswer(question, { lead, lang, execute }) {
  const q = normalize(question);
  const day = askedLead(q, lead);

  if (/hindi|हिन्दी|हिंदी/.test(q) || lang === 'hi' || DEVANAGARI.test(question)) return hindiSummary(day, execute);
  if (/changed|change since|yesterday|previous run|last run/.test(q)) return changedAnswer(execute);
  if (/\b(verif\w*|skill|scores?|rmse|ets|worst|accura\w*)\b/.test(q)) return verificationAnswer(day, execute);
  if (/\bcases?\b|replay|2023/.test(q)) return caseAnswer(q, execute);
  const district = DISTRICTS.find(({ key }) => mentions(q, key));
  if (district) return districtAnswer(district.id, q, day, execute);
  if (/\bred\b|orange|alert|warning|warn|heavy/.test(q)) return alertsAnswer(q, day, execute);
  if (/summar|outlook|overview|india|national|today/.test(q)) return summaryAnswer(day, execute);
  return SCOPE;
}
