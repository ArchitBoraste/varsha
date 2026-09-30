// Generates the deterministic demo data set in public/data from the district boundaries written
// by prepare-geo.js. Scenario: the 00 UTC 29 Jul 2024 GFS run ahead of the Wayanad landslides.

import assert from 'node:assert/strict';
import { blend } from '../src/lib/blend.js';
import { withRegime } from '../src/lib/override.js';
import { THRESHOLDS, exceedanceProbs, likelyRange, warningLevel } from '../src/lib/risk.js';
import { REGIMES } from '../src/lib/scales.js';
import { historyScores } from '../src/lib/scores.js';
import { buildAlerts } from './lib/alerts.js';
import { buildCases } from './lib/cases.js';
import { forecastDay } from './lib/forecast.js';
import { buildHistory } from './lib/history.js';
import { kb, readData, writeData } from './lib/io.js';
import { sum } from './lib/math.js';
import { loadPlaces } from './lib/places.js';
import { buildSaliency } from './lib/saliency.js';
import { GFS_BIAS, LEADS, OBSERVED_LEADS, RUN, wayanadSystems } from './lib/scenario.js';
import { nationalSummary } from './lib/summary.js';
import { seasonTimeline } from './lib/timeline.js';
import { buildVerification } from './lib/verification.js';

const FOCUS_DISTRICT = 'wayanad-kerala';

function buildForecast(places) {
  return Object.fromEntries(
    places.map(({ id, name, state, centroid, exposure, ...place }) => [
      id,
      {
        name,
        state,
        centroid,
        exposure,
        days: LEADS.map(({ lead }) => {
          const day = forecastDay({ centroid, ...place }, wayanadSystems(lead - 1), GFS_BIAS, lead, lead - 1);
          if (lead > OBSERVED_LEADS) delete day.observed;
          return day;
        }),
      },
    ]),
  );
}

function checkConsistency({ forecast, meta, alerts, cases, history, verification }) {
  for (const [id, district] of Object.entries(forecast)) {
    for (const day of district.days) {
      const where = `${id}, Day ${day.lead}`;
      assert.equal(day.corrected, blend(day.p, day.experts), `${where}: corrected must equal the blend`);
      assert.equal(Math.round(sum(REGIMES.map((r) => day.p[r.id] * 100))), 100, `${where}: weights must sum to 1`);
      assert.equal(sum(day.drivers.map((d) => d.mm)), day.corrected - day.raw, `${where}: drivers must sum to the correction`);
      assert.ok(day.probs.p64 >= day.probs.p115 && day.probs.p115 >= day.probs.p204, `${where}: probabilities out of order`);
      // The browser recomputes these for a forecaster override, so they must follow from the amount.
      assert.deepEqual(day.range, likelyRange(day.corrected, day.lead), `${where}: range must follow from the amount`);
      assert.deepEqual(day.probs, exceedanceProbs(day.corrected, day.lead), `${where}: chances must follow from the amount`);
      assert.equal(day.warning, warningLevel(day.probs), `${where}: warning must follow from the chances`);
      for (const { id: regime } of REGIMES) {
        const overridden = withRegime(day, regime);
        assert.equal(sum(overridden.drivers.map((d) => d.mm)), overridden.corrected - overridden.raw, `${where}: drivers after a ${regime} override`);
      }
    }
  }

  const day1 = meta.days[0];
  assert.equal(alerts.length, day1.warnings.red + day1.warnings.orange, 'one alert per red and orange district');
  assert.equal(sum(alerts.map((a) => a.exposure.population)), day1.exposure.population, 'exposure totals');
  assert.equal(alerts.filter((a) => a.exposure.landslideProne).length, day1.exposure.landslideProne, 'landslide totals');
  assert.equal(sum(alerts.map((a) => a.exposure.dams.length)), day1.exposure.dams, 'dam totals');

  assert.deepEqual([history.dates[0], history.dates.at(-1)], ['2024-06-29', '2024-07-28'], 'history covers 29 Jun–28 Jul');
  for (const [id, series] of Object.entries(history.districts)) {
    for (const values of Object.values(series)) assert.equal(values.length, history.dates.length, `${id}: history length`);
  }

  // The focus district's last 30 days must look like a believable forecast record.
  const focus = historyScores(history.districts[FOCUS_DISTRICT]);
  const within = (value, [low, high], what) => assert.ok(value >= low && value <= high, `history, ${FOCUS_DISTRICT}: ${what} ${value.toFixed(2)}`);
  within(focus.caught.raw / focus.heavyDays, [0.25, 0.4], 'share of heavy days raw caught');
  within(focus.caught.varsha / focus.heavyDays, [0.7, 0.85], 'share of heavy days Varsha caught');
  within(1 - focus.mae.varsha / focus.mae.raw, [0.3, 0.45], 'MAE reduction');

  const replayedDay1 = cases.cases[0].days.find((day) => day.date === LEADS[0].date).values;
  for (const [id, values] of Object.entries(replayedDay1)) {
    const { raw, corrected, observed } = forecast[id].days[0];
    assert.deepEqual(values, { raw, corrected, observed }, `${id}: case replay must match the Day 1 forecast`);
  }

  checkVerification(verification);
}

const METRICS = { rmse: 'lower', ets64: 'higher', pod115: 'higher', far115: 'lower' };
const beats = (better, varsha, raw) => (better === 'lower' ? varsha < raw : varsha > raw);

function checkVerification({ scores }) {
  for (const [region, byRegime] of Object.entries(scores)) {
    for (const [regime, entry] of Object.entries(byRegime)) {
      if (!entry) continue;
      entry.leads.forEach((day, index) => {
        const where = `verification ${region}/${regime}, Day ${day.lead}`;
        for (const [metric, better] of Object.entries(METRICS)) {
          assert.ok(beats(better, day[metric].varsha, day[metric].raw), `${where}: Varsha must beat raw on ${metric}`);
          if (index === 0) continue;
          const previous = entry.leads[index - 1][metric];
          for (const side of ['raw', 'varsha']) {
            assert.ok(beats(better, previous[side], day[metric][side]) || previous[side] === day[metric][side], `${where}: ${metric} must not improve with lead`);
          }
        }
        day.fss.varsha.forEach((fss, i) => assert.ok(fss > day.fss.raw[i], `${where}: FSS`));
      });
    }
    // The orographic and depression experts add the most skill wherever those regimes occur.
    const gain = (regime) => byRegime[regime] && byRegime[regime].leads[0].ets64.varsha - byRegime[regime].leads[0].ets64.raw;
    const others = REGIMES.map(({ id }) => id).filter((id) => id !== 'orographic' && id !== 'depression');
    for (const leader of ['orographic', 'depression']) {
      for (const other of others) {
        if (gain(leader) !== null && gain(other) !== null) assert.ok(gain(leader) > gain(other), `verification ${region}: ${leader} gain`);
      }
    }
  }
  // The north-east's hill rain gives the widest error bars.
  for (const index of LEADS.keys()) {
    const ci = (region) => scores[region].all.leads[index].ets64.ci;
    for (const region of Object.keys(scores)) assert.ok(ci('north-east') >= ci(region), `verification: north-east error bars, Day ${index + 1}`);
  }
}

function printSummary({ forecast, meta, alerts, history }, sizes) {
  console.log(`Districts: ${Object.keys(forecast).length}`);
  for (const { lead, warnings } of meta.days) {
    console.log(`  Day ${lead} (${LEADS[lead - 1].label}): red ${warnings.red}, orange ${warnings.orange}`);
  }
  const { raw, corrected, observed } = forecast[FOCUS_DISTRICT].days[0];
  console.log(`Wayanad Day 1: raw ${raw} mm, corrected ${corrected} mm, observed ${observed} mm`);
  const { heavyDays, caught, mae } = historyScores(history.districts[FOCUS_DISTRICT]);
  console.log(
    `Wayanad, last 30 days: ${heavyDays} heavy-rain days, Varsha caught ${caught.varsha}, raw ${caught.raw}; MAE ${mae.varsha.toFixed(1)} vs raw ${mae.raw.toFixed(1)} mm/day`,
  );
  console.log(`Draft alerts: ${alerts.length}`);
  console.log(`Files: ${Object.entries(sizes).map(([file, bytes]) => `${file} ${kb(bytes)}`).join(', ')}`);
}

async function main() {
  const places = await loadPlaces(await readData('districts.geojson'), await readData('states.geojson'));
  const forecast = buildForecast(places);
  const meta = {
    run: RUN,
    runs: [RUN],
    rainDay: '24 h ending 08:30 IST (03 UTC)',
    leads: LEADS,
    thresholds: THRESHOLDS,
    regimes: REGIMES,
    districtCount: places.length,
    days: LEADS.map(({ lead }) => nationalSummary(forecast, lead)),
  };
  const products = {
    forecast,
    meta,
    alerts: buildAlerts(forecast, LEADS[0]),
    cases: buildCases(places),
    history: buildHistory(places),
    verification: buildVerification(),
  };
  checkConsistency(products);

  const files = {
    'meta.json': meta,
    'forecast.json': forecast,
    'timeline.json': seasonTimeline(meta.days),
    'saliency.json': buildSaliency(LEADS.map(({ lead }) => wayanadSystems(lead - 1))),
    'verification.json': products.verification,
    'cases.json': products.cases,
    'alerts.json': products.alerts,
    'history.json': products.history,
  };
  const sizes = {};
  for (const [file, content] of Object.entries(files)) sizes[file] = await writeData(file, content);
  printSummary(products, sizes);
}

await main();
