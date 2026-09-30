# Varsha — project guide for Claude Code

Varsha is a demo web app for Smart India Hackathon 2026, problem statement 26080 (MoES / NCMRWF):
regime-aware AI post-processing of monsoon rainfall forecasts. It works out which weather regime each
district is in, corrects the raw model rainfall with regime-specific experts, and turns the result into
heavy-rain probabilities, district warnings, alerts and verification. The app is used to record a demo
video, so the UI must look finished and match the mockups. The data is a generated, deterministic demo
scenario (not live model data).

## Read first in every new session
1. This file, then `README.md`.
2. `git log --oneline` and a quick skim of `src/` and `scripts/` before changing anything.
3. `design/README.md` and the mockup for the screen you are working on (`design/*.dc.html`). The mockups
   use a custom template syntax (`{{holes}}`, `<sc-for>`, `<sc-if>`, `<x-dc>`, `<dc-import>`); ignore it and
   treat them as the exact visual spec (layout, sizes, spacing, colours, fonts, copy).
   `design/brief.md` is the product brief. `design/screens.pdf` shows one rendered screen.

## Stack and conventions (fixed)
- React 18 + Vite, plain JavaScript (never TypeScript), ES modules, React Router.
- Plain CSS: `src/styles/tokens.css` (CSS variables) + CSS Modules per component. No Tailwind, no UI kit.
- Maps: d3-geo SVG via the shared `IndiaMap` component (`src/components/IndiaMap/`). No tile basemap, no API keys.
- Charts: hand-built SVG/CSS.
- Shared logic lives in `src/lib/` (scales, blend, risk, override, summary, alerts, alertText, cap, clock, layers,
  explain, format, …). The data scripts and the API server import the same modules (`blend.js`, `risk.js`,
  `summary.js`, `override.js`, `alerts.js`, `alertText.js`, `cap.js`), so UI recomputation (e.g. overrides), the
  assistant's numbers and sent CAP files all agree, and `generate-data.js` checks the stored values. Keep it that way.
- Forecaster overrides are app-wide: read the forecast only through `useForecast()`, `useDistrictDay(id, lead)`,
  `useNationalSummary(lead)` (`src/state/useForecast.js`) or `useAlerts(lead)` / `useDraftCount(lead)`
  (`src/state/useAlerts.js`), never `useDataset('forecast.json')` directly, except where the regime engine's own
  values are wanted (the override card's "from" regime). Show `OverrideChip` wherever an overridden district-day
  appears. Case replays show the untouched model output. Requests to the API carry the client's `lead` and
  `overrides`; the server applies them with the same `override.js`.
- Global state (`src/state/AppState.jsx`): lead, selected district, `highlightIds` (Forecast map outlines, cleared
  on the next map click), overrides and alert decisions/edits (localStorage, try/catch), the Ask Varsha chat, the
  toast, and `resetDemo` (hidden Alt+Shift+R).
- Scenario time: anything "issued now" (CAP `sent`, receipts, bulletins) uses `scenarioNow()` from `src/lib/clock.js`
  (the run's day at the current IST time of day), never the real date.
- Senior-engineer quality: small focused components, consistent naming, no dead code, brief comments only
  where logic is not obvious, semantic HTML, visible focus states, aria labels on icon buttons, buttons ≥ 44 px.
- Target screen 1440×900 (demo recording); nothing may break between 1280 and 1920 px wide. No mobile layout.
- India's official boundary is mandatory: district shapes come from udit-001/india-maps-data (see
  `scripts/prepare-geo.js`). Never swap in Natural Earth / world-atlas data.

## Commands
- `npm install`
- `npm run data` — prepares geometry and regenerates everything in `public/data/` (deterministic, seeded; it
  self-checks invariants such as corrected = blend of experts, drivers sum to the correction, ordered probabilities).
- `npm run dev` — Vite on 5180 (fixed in vite.config.js; 5173 is often taken by Docker) plus the API server on 8787,
  via `concurrently`. `npm run dev:web` / `npm run dev:server` run them alone. The server port is `API_PORT`, not
  `PORT` (preview tools set `PORT` to the web port).
- `npm run build` — must stay clean before every commit.

## API server and environment
- `server/` (Express, Node ESM; see `server/README.md`): `POST /api/ask`, `POST /api/translate`,
  `POST /api/alerts/:id/send`, `GET /api/cap/feed`, `GET /api/cap/alerts/:id.xml`. It loads `public/data` once.
- `.env` (gitignored; `.env.example` is committed): `LLM_PROVIDER` (gemini | anthropic, default gemini),
  `GEMINI_API_KEY`, `GEMINI_MODEL` (default gemini-flash-latest), `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default
  claude-opus-5-5), `API_PORT`. Keys stay in the server process; never log them or send them to the browser.
- Ask Varsha: tool calling (≤ 5 rounds, 30 s per model call) over `server/tools.js`; the reply's table, sources and
  actions are built from the tool calls. Without a key or on failure, `server/fallback.js` answers from the same
  tools and logs `[assistant] fallback used` (server only; the UI shows nothing).
- Runtime output, never committed: `server/outbox/` (sent CAP files + index), `server/cache/` (translations).

## Data (public/data)
districts.geojson (724 districts), states.geojson, meta.json (run info, lead dates, per-lead national
summary), forecast.json (per district: raw, corrected, range, observed for Days 1–3, regime weights `p`,
per-regime `experts`, probs p64/p115/p204, warning, drivers, exposure), history.json (30 days before the run),
timeline.json, saliency.json (0.5° grid + 850 hPa wind vectors), verification.json, cases.json, alerts.json
(a static export of the Day 1 drafts; the Alerts screen derives drafts live and does not read it).
Scenario: 00 UTC run of 29 Jul 2024 (Wayanad landslide event), lead days 1–5 valid 30 Jul–3 Aug; IMD rain
day = 24 h ending 08:30 IST (Day 1 = 24 h ending 08:30 IST, 30 Jul).

## Domain constants
- IMD thresholds: heavy ≥ 64.5 mm, very heavy ≥ 115.6 mm, extremely heavy ≥ 204.5 mm (24 h).
- Six regimes: depression-embedded, orographic, coastal, wd (western-disturbance interaction), inland (active
  or normal inland), break. Each district has soft weights over all six; corrected = Σ weight × expert.
- Warnings: red if p204 ≥ 0.6, else orange if p115 ≥ 0.5, else yellow if p64 ≥ 0.5, else green.
- Source model shown in the UI: "GFS 0.25° · 00 UTC run"; verified against IMD gridded rainfall.

## Routes
`/` Forecast console · `/regimes` Regime monitor · `/districts` District outlook · `/districts/:id` District page ·
`/alerts` Alerts (`?ids=` filters to districts, from Ask Varsha) · `/verification` Verification lab · `/cases` Case
studies. Print routes, outside the app shell, open in a new tab and call `window.print()` once data and fonts are
ready: `/print/bulletin?lead=N`, `/print/district/:id?lead=N`, `/print/verification?lead&regime&region`. The
"Ask Varsha" drawer opens from the top bar on every screen; the search palette opens on Ctrl/Cmd+K; Alt+Shift+R
resets the demo state.

## Status
- Step 1 (done): scaffold, design system, app shell, data pipeline, IndiaMap.
- Step 2 (done): Forecast console (5 layers, compare, panel, search), District outlook, District page, history.json.
- Step 3 (done): forecaster override (app-wide, localStorage), Regime monitor, Verification lab (verification.json
  now per lead × regime × region), Case studies, believable history.json catch rates.
- Step 4 (done): Alerts screen (live override-aware drafts, EN/HI templates + LLM Malayalam, SMS counter, CAP 1.2
  preview, approve/send with receipt and Atom feed; sidebar badge from `useDraftCount`), Ask Varsha (Express server,
  Gemini/Claude tool calling, rule-based fallback, drawer with tables/sources/actions), A4 print routes, loading
  skeletons, error boundary, demo reset, DEMO.md.
- Next: nothing planned; keep changes demo-safe (run `npm run data`, `npm run build`, and check 1440×900).

## Working rules
- Commit at the end of each step with a conventional message (`feat: …`, `fix: …`, `chore: …`).
  Never commit `.claude/`.
- If you run without a browser (headless), verify with `npm run build` and small throwaway Node checks
  instead of screenshots, and say which visual checks you could not do. Headless Edge
  (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe --headless=new --screenshot` or
  `--print-to-pdf`) works on this machine when the in-app browser pane does not render.
- Never commit `.env`, `server/outbox/` or `server/cache/`.
- At the end of each step, update the Status section above and anything in this file that changed.