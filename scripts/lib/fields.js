// Smooth, physically motivated rainfall fields evaluated at district centroids.

import { bump, clamp, gauss, interpolate, smoothstep } from './math.js';

// Western Ghats crest as [latitude, longitude] knots.
const GHATS_CREST = [[8, 77.3], [10, 76.9], [12, 75.7], [15, 74.3], [18, 73.6], [21, 73.5]];
const crestLon = (lat) => interpolate(GHATS_CREST, lat);

/** 0–1 taper confining the Ghats to 8–21°N. */
const ghatsExtent = (lat) => smoothstep(8, 8.8, lat) * (1 - smoothstep(20.2, 21, lat));

/** Windward rain band 0.35° west of the crest: broad towards the coast, sharp leeward drop-off. */
function ghatsBand(lon, lat) {
  const dx = lon - (crestLon(lat) - 0.35);
  const intensity = 0.75 + 0.25 * gauss(lat - 12, 2.5); // heaviest over north Kerala and coastal Karnataka
  return ghatsExtent(lat) * intensity * gauss(dx, dx < 0 ? 0.75 : 0.45);
}

/** 0–1 closeness to the Ghats crest, where moist westerlies are lifted. */
export const ghatsZone = (lon, lat) => ghatsExtent(lat) * gauss(lon - crestLon(lat), 0.9);

/** 0–1 hilliness of the north-east: Meghalaya plateau, eastern Himalayan foothills, Naga–Mizo hills. */
export const northEastHills = (lon, lat) =>
  Math.max(
    bump(lon, lat, 91.4, 25.45, 1.2, 0.45),
    bump(lon, lat, 94.6, 27.9, 2.2, 0.8),
    bump(lon, lat, 93.6, 24.2, 0.7, 1.4),
  );

/** 0–1 dryness of the north-west: the Thar desert and Kutch. */
export const dryness = (lon, lat) => bump(lon, lat, 71.3, 25.6, 2.2, 2.8);

const rainShadow = (lon, lat) => bump(lon, lat, 78.6, 10.8, 1.3, 1.8); // interior Tamil Nadu

// Monsoon trough axis, from Ganganagar to the head of the Bay of Bengal.
const troughLat = (lon) => 27.8 - 0.4 * (lon - 72);

/** Mild multiplicative texture (products of sines) so no system looks like a perfect ellipse. */
const texture = (lon, lat, t) =>
  1 +
  0.1 * Math.sin(1.9 * lon + 0.7 * lat + 0.8 * t) * Math.cos(1.3 * lat - 0.5 * lon - 0.6 * t) +
  0.06 * Math.sin(3.7 * lon - 2.9 * lat + 1.3 * t);

/**
 * Rain no post-processing can anticipate: observations differ from the learnable signal by up to
 * ±20%, plus scattered convective showers of up to 8 mm.
 */
function surprise(predictable, lon, lat, t) {
  const scale = 1 + 0.2 * Math.sin(2.7 * lon - 1.9 * lat + 1.1 * t) * Math.cos(2.2 * lat + 0.8 * lon - 0.7 * t);
  const showers = 8 * Math.max(0, Math.sin(4.3 * lon + 3.1 * lat - 2 * t) * Math.sin(3.9 * lat - 1.3 * lon + t));
  return predictable * scale + showers;
}

/** Widespread monsoon rain, 4–13 mm, reduced over the dry north-west and the Tamil Nadu rain shadow. */
function background(lon, lat, t) {
  const moisture =
    0.25 +
    0.55 * gauss(lat - (troughLat(lon) - 1.5), 3.5) +
    0.2 * Math.sin(0.9 * lon + 0.4 * t) * Math.sin(1.1 * lat - 0.3 * t);
  return (4 + 9 * clamp(moisture, 0, 1)) * (1 - 0.8 * dryness(lon, lat)) * (1 - 0.45 * rainShadow(lon, lat));
}

// Unit vector pointing west-north-west, the depression's direction of travel.
const WNW = [-Math.cos(Math.PI / 8), Math.sin(Math.PI / 8)];

/** Depression rain: elongated WNW–ESE and heaviest in the south-west sector of the centre. */
function depressionRain(lon, lat, { lon: centreLon, lat: centreLat, amp }, shiftEast = 0) {
  const dx = lon - (centreLon + shiftEast - 0.7);
  const dy = lat - (centreLat - 0.8);
  const along = dx * WNW[0] + dy * WNW[1];
  const across = dy * WNW[0] - dx * WNW[1];
  return amp * Math.exp(-0.5 * ((along / 2.4) ** 2 + (across / 1.3) ** 2));
}

/** Climatological daily normal for late July, mm. */
export function climatology(lon, lat) {
  const monsoon = 5 + 17 * ghatsBand(lon, lat) + 10 * northEastHills(lon, lat) + 5 * gauss(lat - troughLat(lon), 3);
  return monsoon * (1 - 0.8 * dryness(lon, lat));
}

/**
 * Observed and raw-model rainfall at a point for valid day `t`, plus the predictable rain the model misses
 * in each regime family (orographic, depression, western-disturbance interaction).
 */
export function rainfall(lon, lat, systems, bias, t) {
  const { ghats, wayanad, depression, northEast, foothills, wd } = systems;
  const observedTexture = texture(lon, lat, t);
  const modelTexture = observedTexture * (1 + 0.05 * Math.sin(2.3 * lon + 1.7 * lat + t));

  const ghatsRain = ghats.amp * ghatsBand(lon, lat);
  const wayanadRain = wayanad.amp * bump(lon, lat, wayanad.lon, wayanad.lat, 0.45, 0.45);
  const northEastRain = northEast.amp * bump(lon, lat, northEast.lon, northEast.lat, 1.3, 0.7);
  const foothillRain = foothills.amp * bump(lon, lat, foothills.lon, foothills.lat, 1.1, 0.7);
  const wdRain = wd.amp * bump(lon, lat, wd.lon, wd.lat, 1.6, 1.0);
  const base = background(lon, lat, t);

  const signal = {
    oro: observedTexture * (ghatsRain + wayanadRain + northEastRain),
    dep: observedTexture * depressionRain(lon, lat, depression),
    wd: observedTexture * (foothillRain + wdRain),
  };
  const model = {
    oro: modelTexture * (bias.ghats * ghatsRain + bias.wayanad * wayanadRain + bias.northEast * northEastRain),
    dep: modelTexture * bias.depressionAmp * depressionRain(lon, lat, depression, bias.depressionShift),
    wd: modelTexture * bias.wd * (foothillRain + wdRain),
  };
  const modelRain = model.oro + model.dep + model.wd + base;

  return {
    observed: surprise(signal.oro + signal.dep + signal.wd + base, lon, lat, t),
    raw: bias.drizzle + modelRain,
    modelRain,
    deficit: { oro: signal.oro - model.oro, dep: signal.dep - model.dep, wd: signal.wd - model.wd },
  };
}
