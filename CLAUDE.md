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
- Shared logic lives in `src/lib/` (scales, blend, risk, explain, format, …). The data scripts import the
  same `blend.js` / `risk.js`, so UI recomputation (e.g. overrides) reproduces stored values exactly. Keep it that way.
- Senior-engineer quality: small focused components, consistent naming, no dead code, brief comments only
  where logic is not obvious, semantic HTML, visible focus states, aria labels on icon buttons, buttons ≥ 44 px.
- Target screen 1440×900 (demo recording); nothing may break between 1280 and 1920 px wide. No mobile layout.
- India's official boundary is mandatory: district shapes come from udit-001/india-maps-data (see
  `scripts/prepare-geo.js`). Never swap in Natural Earth / world-atlas data.

## Commands
- `npm install`
- `npm run data` — prepares geometry and regenerates everything in `public/data/` (deterministic, seeded; it
  self-checks invariants such as corrected = blend of experts, drivers sum to the correction, ordered probabilities).
- `npm run dev` — dev server. Port 5173 is often taken by Docker; the app has been run on 5180.
- `npm run build` — must stay clean before every commit.

## Data (public/data)
districts.geojson (724 districts), states.geojson, meta.json (run info, lead dates, per-lead national
summary), forecast.json (per district: raw, corrected, range, observed for Days 1–3, regime weights `p`,
per-regime `experts`, probs p64/p115/p204, warning, drivers, exposure), history.json (30 days before the run),
timeline.json, saliency.json (0.5° grid + 850 hPa wind vectors), verification.json, cases.json, alerts.json.
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
`/alerts` Alerts · `/verification` Verification lab · `/cases` Case studies. The "Ask Varsha" drawer opens
from the top bar on every screen; the search palette opens on Ctrl/Cmd+K.

## Status
- Step 1 (done): scaffold, design system, app shell, data pipeline, IndiaMap.
- Step 2 (done): Forecast console (5 layers, compare, panel, search), District outlook, District page, history.json.
- Step 3: forecaster override (app-wide), Regime monitor, Verification lab, Case studies.
- Step 4 (next): Alerts screen, Ask Varsha assistant (small Express server + LLM), printable bulletins/reports, polish.

## Working rules
- Commit at the end of each step with a conventional message (`feat: …`, `fix: …`, `chore: …`).
  Never commit `.claude/`.
- If you run without a browser (headless), verify with `npm run build` and small throwaway Node checks
  instead of screenshots, and say which visual checks you could not do.
- At the end of each step, update the Status section above and anything in this file that changed.