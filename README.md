# Varsha

Regime-aware post-processing of monsoon rainfall forecasts for India: a demo web app for Smart India
Hackathon 2026, problem statement 26080 (MoES / NCMRWF). The product brief and hi-fi mockups are in
[`design/`](design/README.md).

## Setup

Requires Node.js 20.19 or later.

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts two processes: the Vite app on http://localhost:5180 and the Ask Varsha API
server on http://localhost:8787 (Vite proxies `/api` to it). Open the app at http://localhost:5180.

The generated files in `public/data` are committed, so the app runs without the data step; `npm run data`
regenerates them.

### Ask Varsha key

Put one key in `.env` (never committed; `.env.example` lists every setting):

- **Gemini** (default, free): create a key in [Google AI Studio](https://aistudio.google.com/apikey) and
  set `GEMINI_API_KEY`. `GEMINI_MODEL` defaults to `gemini-flash-latest`.
- **Claude**: set `LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` (from the Claude Console).
  `ANTHROPIC_MODEL` defaults to `claude-opus-5-5`, called at low effort with the API's refusal fallback on.

Without a key, or when the model call fails or takes over 30 s, the assistant still answers the common
questions (red and orange districts by state, a district's forecast and why it was corrected, the national
summary, a Hindi summary, what changed between Day 1 and Day 2, where the raw model is worst, the case
studies) with rule-based replies built from the same tools. Malayalam alert drafts need a key; without
one the Malayalam tab shows the English text.

| Script               | What it does                                                                      |
| -------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`        | App and API server together (`concurrently`)                                    |
| `npm run dev:web`    | Vite dev server only, port 5180                                                   |
| `npm run dev:server` | API server only, port 8787 (`API_PORT`), restarts when its files change           |
| `npm run build`      | Production build in `dist/`                                                       |
| `npm run preview`    | Serves the production build (also proxies `/api`)                                 |
| `npm run data`       | `scripts/prepare-geo.js`, then `scripts/generate-data.js` (writes `public/data`) |

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
  "last 30 days" chart. On these ordinary rain days the raw model catches more of the orographic rain
  (70% of the Ghats rain, 50% over Wayanad), rain over Wayanad comes in bursts, and what falls strays up
  to ±25% from the learnable signal. The generator checks that Wayanad's record stays believable: raw
  catches 25–40% of the heavy-rain days, Varsha 70–85%, and Varsha's mean absolute error is 30–45% lower.
- **Exposure:** Census 2011 population for the districts in the scenario, elsewhere estimated from area
  and state density; landslide-prone hill districts; 25 large dams.
- **Verification scores** are the design's target values for all India and all regimes, not computed
  from the fields. Every lead day × regime × region combination is derived from them deterministically,
  and the generator checks that Varsha beats raw everywhere, skill falls with lead day, the orographic
  and depression experts add the most, and the north-east has the widest error bars. A region's
  regimes that never occur there (no western disturbances on the west coast) are `null`.

Result: 724 districts; on Day 1 there are 4 red and 30 orange districts, so 34 draft alerts. Wayanad on
Day 1 gets raw 122 mm, Varsha 280 mm, observed 343 mm. In the 30 days before, Wayanad had 11 heavy-rain
days: Varsha caught 8 and raw 3, with a mean absolute error of 9 against 16 mm/day.

| File                | Contents                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `districts.geojson` | District polygons, properties `{ id, district, state }`                                        |
| `states.geojson`    | State outlines, properties `{ state }`                                                         |
| `meta.json`         | Run, lead days, thresholds, regimes and a national summary per lead day                        |
| `forecast.json`     | Per district: centroid, exposure and five days of raw, corrected, regimes, experts, risk, drivers |
| `timeline.json`     | Monsoon 2024 phase per day, with the forecast days and today flagged                           |
| `saliency.json`     | Regime-engine saliency on a 0.5° grid and 850 hPa winds on a 2° grid, per lead day             |
| `verification.json` | Per region × regime × lead day: RMSE, ETS, POD, FAR (with 95% intervals), baseline ladder, reliability and FSS; regime-classifier skill per region |
| `cases.json`        | Wayanad (29–31 Jul 2024) and Himachal–Delhi (8–10 Jul 2023) replays: raw, corrected, observed   |
| `alerts.json`       | Static export of the Day 1 drafts (English and Hindi messages and SMS, CAP 1.2); the Alerts screen derives its drafts live |
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
├── server/            Express API: Ask Varsha (tools, LLM providers, fallback), translations, alert sending and CAP feed
└── src/
    ├── components/    app shell, top bar controls, IndiaMap and its overlays, shared UI
    ├── lib/           scales, regimes, blend, risk, override, summary, alerts, alertText and cap
    │                  (shared with scripts and the server),
    │                  map layers, chart geometry, formatting, explanations, search, CSV, data loading
    ├── pages/         one component per route, with its parts in forecast/, regimes/, districts/,
    │                  district/, alerts/, verification/, cases/ and print/ (A4 reports)
    ├── state/         global app state, forecaster overrides and data hooks
    └── styles/        design tokens and global CSS
```

## IndiaMap

`src/components/IndiaMap` draws the district polygons as SVG with d3-geo, fitted to its box (or to
`fitTo`: GeoJSON such as one state, or a `[[west, south], [east, north]]` box). It takes `features`,
`borders`, `getFill`, `getTooltip`, `selectedId`, `onSelect`, `width`, `height`, `fitTo`, an
optional `compare = { leftFill, rightFill, leftLabel, rightLabel }` for the draggable
raw-versus-corrected split, and `highlightId` / `onHover` to link the hover between several maps.
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

`cellRect` and `vectorEnds` project grid cells and wind vectors for heatmap and arrow overlays;
`SaliencyOverlay` uses them for the regime engine's saliency and 850 hPa winds.

## Forecaster overrides

A duty forecaster can set a district-day's regime on the Regimes screen, with a reason. Overrides are
kept in the app state as `{ [districtId]: { [lead]: { regime, reason, by, at } } }` and in
`localStorage` when the browser allows it. Every screen reads the forecast through `useForecast()`
([`src/state/useForecast.js`](src/state/useForecast.js)), which applies them: the weights become one-hot
on the chosen regime, the amount is re-blended with `blend.js` and the range, chances and warning are
recomputed with `risk.js`. National counts (warnings, exposure, regimes) are recounted with
[`src/lib/summary.js`](src/lib/summary.js), which the generator uses too. The data files are never changed.

The layout targets a 1440×900 screen and holds from 1280 to 1920 px wide; there is no mobile layout.

Search districts from any screen with Ctrl+K (Cmd+K on macOS).

## Alerts

`/alerts` drafts one alert per red and orange district for the selected lead day, straight from the
effective forecast, so an override that changes a warning adds or removes a draft (and the sidebar
badge counts the drafts still awaiting a decision). The composer shows the facts, the message in English,
Hindi (templates in [`src/lib/alertText.js`](src/lib/alertText.js)) and Malayalam (drafted by the
language model through `POST /api/translate`, cached in `server/cache/`), an SMS with a GSM/Unicode
segment counter, the channels, and a live SMS and CAP 1.2 preview ([`src/lib/cap.js`](src/lib/cap.js)).
Decisions and edits are kept in `localStorage`.

**Approve and send** posts the texts to `POST /api/alerts/:id/send`. The server re-derives the alert from
the forecast and the client's overrides, writes the CAP document to `server/outbox/<identifier>.xml`
(identifier `VRS-<yyyymmdd>-<district code>`) and returns a receipt for the delivery timeline. The SMS,
email and webhook channels are simulated. Sent alerts are listed in an Atom feed at `GET /api/cap/feed`,
the shape CAP aggregators such as SACHET poll. Timestamps are on the scenario's day (29 Jul 2024) at the
current time of day, so they fall inside the forecast's validity.

## Ask Varsha

The drawer (top bar, every screen) posts the question, the last six turns, the lead day and the
forecaster's overrides to `POST /api/ask`. The server runs the model with up to five rounds of read-only
tools over the same data and shared modules as the UI ([`server/tools.js`](server/tools.js)):
`list_districts`, `get_district`, `get_national_summary`, `get_regime_mix`, `get_verification`,
`get_case` and `compare_leads` (Day 1 against Day 2; the demo holds a single run). The answer's table,
source chips and actions ("Draft red alerts for these N", "Show on map") are built from the tool calls,
not from the model's text. The conversation stays in app state while you move between screens.

## Printable reports

Each report opens in a new tab without the app shell, lays out on A4 and opens the print dialog once the
data and fonts are in (choose "Save as PDF"):

- `/print/bulletin?lead=N` — all-India bulletin: warning map, counts, exposure, red and orange districts
  (District outlook → "Download bulletin (PDF)").
- `/print/district/:id?lead=N` — one-page district bulletin (District page → "District bulletin").
- `/print/verification?lead=N&regime=…&region=…` — verification report for the current filters
  (Verification → "Verification report (PDF)").

## Demo tips

- Alt+Shift+R resets the demo (overrides, alert decisions and edits, chat, map highlights); there is no
  visible control. See [`DEMO.md`](DEMO.md) for a three-minute recording script.
