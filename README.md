# Varsha

Regime-aware post-processing of monsoon rainfall forecasts for India: a demo web app for Smart India
Hackathon 2026, problem statement 26080 (MoES / NCMRWF). The product brief and hi-fi mockups are in
[`design/`](design/README.md).

## Setup

Requires Node.js 20.19 or later.

```bash
npm install
npm run data
npm run dev
```

The generated files in `public/data` are committed, so `npm run dev` also works without the data step.

| Script            | What it does                                                                      |
| ----------------- | --------------------------------------------------------------------------------- |
| `npm run dev`     | Vite dev server                                                                   |
| `npm run build`   | Production build in `dist/`                                                       |
| `npm run preview` | Serves the production build                                                       |
| `npm run data`    | `scripts/prepare-geo.js`, then `scripts/generate-data.js` (writes `public/data`) |

## District boundaries

`scripts/prepare-geo.js` downloads
[`india.geojson`](https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson)
(district polygons with India's official boundary, including all of Jammu and Kashmir and Ladakh) and
caches it in `.cache/` (delete the folder to download again). It drops the whole-state features, merges
the duplicated Chandigarh and Lakshadweep features, simplifies with mapshaper (`keep-shapes`), rounds
coordinates to 3 decimals and dissolves the districts into states. Each district gets a stable id, the
slug of district and state (`wayanad-kerala`).

The source is already light (median 24 vertices per district), so the script keeps 30% of the
removable vertices: 6% turned districts into octagons. The output is about 6% of the source file size.

## Demo data scenario

`scripts/generate-data.js` is deterministic. It evaluates smooth rainfall fields at each district
centroid for the **00 UTC 29 Jul 2024 GFS run**, the run before the Wayanad landslides. Lead days 1–5
are the IMD rain days (24 h ending 08:30 IST) of 30 Jul to 3 Aug 2024.

- **Weather:** an active monsoon; extreme orographic rain on the Western Ghats peaking over
  Wayanad and Kozhikode on Day 1; a depression over south Odisha moving west-north-west; heavy rain on
  the Meghalaya plateau and the Himalayan foothills; a western disturbance over Jammu and Kashmir; a dry
  north-west.
- **Raw GFS errors:** 6 mm of drizzle everywhere, 55% of the Ghats rain, 30% of the Wayanad extreme,
  70% of the north-east hill rain, 75% of the western-disturbance rain, and a depression 1° too far east
  and 20% too weak.
- **Correction:** regime probabilities come from physics-style scores through a softmax, so transition
  districts get mixed weights. Six regime experts each correct the raw forecast differently and
  `corrected = blend(p, experts)` ([`src/lib/blend.js`](src/lib/blend.js)). The heavy-rain chances,
  likely range and warning level come from [`src/lib/risk.js`](src/lib/risk.js). Both modules are shared
  with the UI, so a regime override recomputes stored values exactly.
- **What no correction can fix:** the raw model also has a day-to-day error of up to ±25%, and the
  observations (Days 1–3) differ from the predictable signal by up to ±20% plus scattered showers.
- **History:** the 30 days before the run (29 Jun–28 Jul 2024) follow the observed active, normal and
  break spells and two monsoon lows, through the same raw model and experts, for the district page's
  "last 30 days" chart.
- **Exposure:** Census 2011 population for the districts in the scenario, elsewhere estimated from area
  and state density; landslide-prone hill districts; 25 large dams.
- **Verification scores** are the design's target values, not computed from the fields.

Result: 724 districts; on Day 1 there are 4 red and 30 orange districts, so 34 draft alerts. Wayanad on
Day 1 gets raw 122 mm, Varsha 280 mm, observed 343 mm.

| File                | Contents                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `districts.geojson` | District polygons, properties `{ id, district, state }`                                        |
| `states.geojson`    | State outlines, properties `{ state }`                                                         |
| `meta.json`         | Run, lead days, thresholds, regimes and a national summary per lead day                        |
| `forecast.json`     | Per district: centroid, exposure and five days of raw, corrected, regimes, experts, risk, drivers |
| `timeline.json`     | Monsoon 2024 phase per day, with the forecast days and today flagged                           |
| `saliency.json`     | Regime-engine saliency on a 0.5° grid and 850 hPa winds on a 2° grid, per lead day             |
| `verification.json` | Headline scores, baseline ladder, reliability, FSS, scores by lead day, classifier skill        |
| `cases.json`        | Wayanad (29–31 Jul 2024) and Himachal–Delhi (8–10 Jul 2023) replays: raw, corrected, observed   |
| `alerts.json`       | Draft alerts for red and orange districts: English, Hindi, SMS and CAP 1.2                      |
| `history.json`      | Per district, 30 days of observed rainfall and Day 1 forecasts from Varsha and raw GFS          |

## Folder structure

```
varsha/
├── design/            brief, mockups and screenshots (the visual spec)
├── public/data/       generated data
├── scripts/
│   ├── prepare-geo.js     boundaries
│   ├── generate-data.js   scenario data, with consistency checks
│   └── lib/               scenario, fields, regimes, experts and one module per output file
├── server/            Express server for Ask Varsha (later step)
└── src/
    ├── components/    app shell, top bar controls, IndiaMap, shared UI
    ├── lib/           scales, regimes, blend and risk (shared with scripts), formatting,
    │                  explanations, search, CSV and data loading
    ├── pages/         one component per route, with its parts in forecast/, districts/, district/
    ├── state/         global app state and data hooks
    └── styles/        design tokens and global CSS
```

## IndiaMap

`src/components/IndiaMap` draws the district polygons as SVG with d3-geo, fitted to its box (or to
`fitTo`, e.g. one state). It takes `features`, `borders`, `getFill`, `getTooltip`, `selectedId`,
`onSelect`, `width`, `height`, `fitTo` and an optional
`compare = { leftFill, rightFill, leftLabel, rightLabel }` for the draggable raw-versus-corrected split.
Children are overlays drawn in the same projected space:

```jsx
import IndiaMap, { useMap } from '../components/IndiaMap';

function Marker({ lon, lat }) {
  const { projection } = useMap();
  const [x, y] = projection([lon, lat]);
  return <circle cx={x} cy={y} r={4} />;
}

<IndiaMap features={districts} borders={states} getFill={fill}>
  <Marker lon={76.1} lat={11.65} />
</IndiaMap>;
```

`cellRect` and `vectorEnds` project grid cells and wind vectors for heatmap and arrow overlays.

The layout targets a 1440×900 screen and holds from 1280 to 1920 px wide; there is no mobile layout.

Search districts from any screen with Ctrl+K (Cmd+K on macOS).
