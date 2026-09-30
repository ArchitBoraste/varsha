// The demo data from public/data, loaded once at start. Every request sees the forecast with the
// client's forecaster overrides applied, through the same shared modules the UI uses.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { districtCodes } from '../src/lib/alerts.js';
import { applyOverrides, sanitizeOverrides } from '../src/lib/override.js';
import { config } from './config.js';

const read = (file) => JSON.parse(readFileSync(path.join(config.paths.data, file), 'utf8'));

const forecast = read('forecast.json');

export const data = {
  forecast,
  meta: read('meta.json'),
  verification: read('verification.json'),
  cases: read('cases.json').cases,
  codes: districtCodes(forecast),
};

/** The forecast as the client sees it: the stored model output with its (untrusted) overrides applied. */
export const effectiveForecast = (overrides) => applyOverrides(data.forecast, sanitizeOverrides(overrides));
