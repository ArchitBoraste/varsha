// Generates the deterministic demo data set in public/data from the district boundaries written
// by prepare-geo.js. Scenario: the 00 UTC 29 Jul 2024 GFS run ahead of the Wayanad landslides.

import assert from 'node:assert/strict';
import { blend } from '../src/lib/blend.js';
import { THRESHOLDS } from '../src/lib/risk.js';
import { REGIMES } from '../src/lib/scales.js';
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
import { VERIFICATION } from './lib/verification.js';

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

function checkConsistency({ forecast, meta, alerts, cases, history }) {
  for (const [id, district] of Object.entries(forecast)) {
    for (const day of district.days) {
      const where = `${id}, Day ${day.lead}`;
      assert.equal(day.corrected, blend(day.p, day.experts), `${where}: corrected must equal the blend`);
      assert.equal(Math.round(sum(REGIMES.map((r) => day.p[r.id] * 100))), 100, `${where}: weights must sum to 1`);
      assert.equal(sum(day.drivers.map((d) => d.mm)), day.corrected - day.raw, `${where}: drivers must sum to the correction`);
      assert.ok(day.probs.p64 >= day.probs.p115 && day.probs.p115 >= day.probs.p204, `${where}: probabilities out of order`);
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

  const replayedDay1 = cases.cases[0].days.find((day) => day.date === LEADS[0].date).values;
  for (const [id, values] of Object.entries(replayedDay1)) {
    const { raw, corrected, observed } = forecast[id].days[0];
    assert.deepEqual(values, { raw, corrected, observed }, `${id}: case replay must match the Day 1 forecast`);
  }
}

function printSummary({ forecast, meta, alerts }, sizes) {
  console.log(`Districts: ${Object.keys(forecast).length}`);
  for (const { lead, warnings } of meta.days) {
    console.log(`  Day ${lead} (${LEADS[lead - 1].label}): red ${warnings.red}, orange ${warnings.orange}`);
  }
  const { raw, corrected, observed } = forecast[FOCUS_DISTRICT].days[0];
  console.log(`Wayanad Day 1: raw ${raw} mm, corrected ${corrected} mm, observed ${observed} mm`);
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
  };
  checkConsistency(products);

  const files = {
    'meta.json': meta,
    'forecast.json': forecast,
    'timeline.json': seasonTimeline(meta.days),
    'saliency.json': buildSaliency(LEADS.map(({ lead }) => wayanadSystems(lead - 1))),
    'verification.json': VERIFICATION,
    'cases.json': products.cases,
    'alerts.json': products.alerts,
    'history.json': products.history,
  };
  const sizes = {};
  for (const [file, content] of Object.entries(files)) sizes[file] = await writeData(file, content);
  printSummary(products, sizes);
}

await main();
