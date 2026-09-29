# Design reference

- `brief.md` — full product brief (features, regimes, thresholds, UI walkthrough).
- `*.dc.html` — hi-fi mockups of every screen. They use a custom template syntax
  (`{{holes}}`, `<sc-for>`, `<sc-if>`, `<x-dc>`, `<dc-import>`). Ignore the syntax and read them
  as the visual spec: layout, sizes, spacing, colours, fonts and copy.
  Map images in the mockups (`/_blob/...`) are placeholders; the app renders real maps.

| File | Screen |
|---|---|
| Main.dc.html | Forecast console (route `/`) |
| Regimes.dc.html | Regime monitor (`/regimes`) |
| Districts.dc.html | District outlook (`/districts`) |
| District.dc.html | District page (`/districts/:id`) |
| Verification.dc.html | Verification lab (`/verification`) |
| CaseReplay.dc.html | Case studies (`/cases`) |
| Alerts.dc.html | Alerts (`/alerts`) |
| AskVarsha.dc.html | Ask Varsha drawer (opens from the top bar on every screen) |
