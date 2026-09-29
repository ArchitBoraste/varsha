// Downloads India's district boundaries (official boundary, including all of Jammu and Kashmir
// and Ladakh), simplifies them and writes public/data/districts.geojson and states.geojson.

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { geoArea } from 'd3-geo';
import mapshaper from 'mapshaper';
import { CACHE_DIR, kb, writeData } from './lib/io.js';

const SOURCE_URL = 'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson';

// Share of removable vertices mapshaper keeps. The source is already light (median 24 vertices per
// district): 6% turns districts into octagons, while 30% keeps their shape and still shrinks the
// output to about 6% of the source file size.
const SIMPLIFY = '30%';

// gj2008 writes clockwise outer rings, the winding d3-geo expects.
const OUTPUT_OPTIONS = 'format=geojson gj2008 precision=0.001';

const slugify = (text) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function loadSource() {
  const cached = path.join(CACHE_DIR, 'india.geojson');
  if (!existsSync(cached)) {
    console.log(`Downloading ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cached, await response.text());
  }
  return JSON.parse(await readFile(cached, 'utf8'));
}

function toDistricts(source) {
  const byId = new Map();
  for (const { properties, geometry } of source.features) {
    // Features without a district are whole-state outlines that would paint over the districts.
    if (!properties.district) continue;
    const id = slugify(`${properties.district} ${properties.st_nm}`);
    // The source repeats a few union territories (Chandigarh, Lakshadweep) verbatim.
    if (byId.has(id)) continue;
    byId.set(id, {
      type: 'Feature',
      properties: { id, district: properties.district, state: properties.st_nm },
      geometry,
    });
  }
  return [...byId.values()];
}

function assertD3Winding(collection, name) {
  // An inverted ring covers the rest of the globe, which d3-geo would paint as the whole map.
  const inverted = collection.features.filter((feature) => geoArea(feature) > 2 * Math.PI);
  if (inverted.length) throw new Error(`${name}: ${inverted.length} features have inverted rings`);
}

async function main() {
  const source = await loadSource();
  const districts = toDistricts(source);
  const output = await mapshaper.applyCommands(
    `-i districts.json snap -simplify ${SIMPLIFY} keep-shapes ` +
      `-o districts.geojson ${OUTPUT_OPTIONS} ` +
      `-dissolve state -o states.geojson ${OUTPUT_OPTIONS} -quiet`,
    { 'districts.json': { type: 'FeatureCollection', features: districts } },
  );

  for (const file of ['districts.geojson', 'states.geojson']) {
    const text = output[file].toString();
    const collection = JSON.parse(text);
    assertD3Winding(collection, file);
    const bytes = await writeData(file, text);
    console.log(`${file}: ${collection.features.length} features, ${kb(bytes)}`);
  }
  console.log(`(source: ${source.features.length} features, ${districts.length} unique districts)`);
}

await main();
