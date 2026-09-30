# Demo recording script (3 minutes)

The story: the 00 UTC 29 Jul 2024 GFS run, the night before the Wayanad landslides. Raw GFS gave Wayanad
122 mm; Varsha's orographic expert raised it to 280 mm and a red warning; 343 mm fell.

## Before recording

1. `npm run dev`, with a Gemini or Claude key in `.env` (see the README). Check that the API line in the
   terminal names the model rather than "rule-based answers".
2. Open http://localhost:5180 in a 1440 × 900 window at 100% zoom.
3. Press **Alt+Shift+R** to reset overrides, alert decisions, chat and highlights (a toast confirms).
4. Warm the caches once so nothing waits on camera: open Alerts → Wayanad → **മലയാളം**, then reset
   again with Alt+Shift+R (the Malayalam draft stays cached on the server).

## Click path

| Time | Screen | Do | Say |
| ---- | ------ | -- | --- |
| 0:00 | **Forecast** | Drag the raw/Varsha divider across Kerala. | "Raw GFS on the right, Varsha on the left: the model misses most of the Western Ghats rain." |
| 0:12 | Forecast | Wayanad is selected: point at 122 → 280 mm, the red badge and the regime mix. | "Varsha puts Wayanad in the orographic regime, 95%, and raises it to 280 mm. The panel says why: upslope moisture flux." |
| 0:25 | **Regimes** | Show the regime map, then toggle **What the engine looked at** (saliency and 850 hPa winds). | "The regime engine looked at the westerlies hitting the Ghats and the depression over Odisha." |
| 0:38 | Regimes | Override card: pick **Active or normal inland**, type a reason; read Now vs After (280 → 166 mm, red → orange). **Apply override**: the Overridden chip and the log entry appear. Then **Undo**. | "A forecaster can overrule the engine; every screen and the alert drafts follow, and it is logged. Here we keep the engine's call." |
| 0:55 | **Districts** | Table sorted by chance of ≥ 115.6 mm; Kerala on top. Click **Download bulletin (PDF)** and show the A4 page for two seconds, then close the tab. | "Every district, every threshold, and a bulletin ready to print." |
| 1:08 | **District page** (click Wayanad) | Five-day chart, chance grid, "Why Varsha raised Day 1 by 158 mm", last 30 days. | "In the last 30 days Varsha caught 8 of 11 heavy-rain days here; raw caught 3." |
| 1:22 | **Alerts** | Select **Wayanad, Kerala**. Show the fields, click **हिन्दी** and **മലയാളം**, point at the phone and the CAP 1.2 preview. | "Drafts come straight from the forecast, in English, Hindi and Malayalam, as SMS and as CAP for NDMA's SACHET." |
| 1:40 | Alerts | Back to **English**, **Approve and send**. The delivery timeline and toast appear; the badge drops. | "Nothing goes out until a forecaster approves: CAP published, SMS to 46 district officials, email to the Kerala SDMA." |
| 1:55 | **Ask Varsha** (top bar) | Click the suggestion **Which Kerala districts need a red alert tomorrow, and why?** | "Ask Varsha answers from Varsha's own data, with its sources." |
| 2:10 | Ask Varsha | Point at the table and source chips, then click **Draft red alerts for these 3**. The Alerts list is filtered to them. | "It drafts; it never issues. The forecaster picks up from here." |
| 2:22 | **Verification** | Set Regime **Orographic**, Region **West coast**: the ladder highlights orographic; KPI tiles update. | "Held-out Monsoon 2024: Varsha beats raw everywhere, most in orographic and depression rain." |
| 2:38 | **Case studies** | Wayanad case, press play: raw, Varsha and observed maps step through 29–31 Jul. | "On the day, raw GFS caught 3 of 13 very heavy districts; Varsha caught 12." |
| 2:55 | Case studies | Stop on 30 Jul. | "Varsha: regime-aware rainfall forecasts, from model run to warning." |

## If something goes wrong

- The assistant answers without a key too (rule-based replies), and nothing on screen says so.
- Alt+Shift+R restores the starting state at any point.
- The reports print from any browser tab; choose "Save as PDF" in the print dialog.
