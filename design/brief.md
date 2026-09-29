Varsha

Regime-aware AI post-processing of monsoon rainfall forecasts

Smart India Hackathon 2026 · Problem statement **26080** · Ministry of Earth Sciences (MoES), National Centre for Medium Range Weather Forecasting (NCMRWF)

Theme: Smart Automation · Category: Software · Team: \[TEAM NAME\]

Project brief for the PPT and demo video · 29 September 2026

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Varsha in one paragraph</strong></p>
<p>Varsha is a web platform that runs after every NCMRWF model run. It works out which weather regime each part of India is in, corrects the raw rainfall forecast with a model trained for that regime, and turns the result into heavy-rain probabilities, district warnings and ready-to-send alerts. Every forecast is scored the next morning against IMD observations, so forecasters can see exactly where the correction helps. A built-in assistant, Ask Varsha, answers questions about the forecast in plain language and drafts bulletins, and a forecaster approves anything that goes out.</p></td>
</tr>
</tbody>
</table>

The problem in three lines

- Rainfall forecast errors over India change with the weather regime: active and break monsoon, monsoon lows and depressions, orographic and coastal rain, and western disturbances.

- A single bias correction applied everywhere cannot fix all of these at once. Over Kerala, operational models over-predict rainfall on average \[18\], yet the Wayanad extreme of 30 July 2024 was badly under-forecast \[17\].

- The PS asks for five outputs: a weather regime classifier, a bias-corrected forecast, heavy-rainfall probability, a district-level product, and a verification report (RMSE, ETS, CSI, POD, FAR, FSS).

How to use this document: sections follow the SIH PPT template (proposed solution, technical approach, feasibility and viability, impact and benefits, research and references). Numbers in square brackets point to Section 5. The appendix maps each section to a slide.

1\. Varsha: the site and its features

Varsha is a post-processing layer. It never runs the weather model itself; it reads the model output NCMRWF already produces and makes it more accurate, more local and easier to act on.

1.1 What Varsha does after every model run

1.  **Reads** the latest raw rainfall forecast and the matching weather fields.

2.  **Classifies the regime** for every grid cell: a probability for each of six regimes, plus a saliency map of what the classifier looked at.

3.  **Corrects the rainfall** with six regime-specific models, blended by those probabilities.

4.  **Publishes** corrected rainfall, chances of heavy rain, district warnings and draft alerts.

5.  **Scores** yesterday's forecasts against IMD observations and retrains when skill drifts.

<img src="media/c4f02057a39edc67e039e9297f5a2c3e265a6107.png" title="How Varsha works" style="width:6.66667in;height:4.75in" alt="Pipeline from NWP forecast to corrected, verified district forecast" />

Figure 1. The Varsha pipeline. Use this as the main diagram on the solution slide.

1.2 Features

Thirteen features, grouped by the PS outcome they deliver. The last four are additions that take Varsha from a corrected forecast to action.

| **Feature**                 | **What it does**                                                                                                                                                                                 | **Main user**                                 | **PS outcome**                        |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|---------------------------------------|
| **Forecast console**        | India map for any model run and lead day (Day 1–5). Layers for rainfall, regime, heavy-rain chance, exposure and saliency. A drag slider compares raw and corrected rainfall.                    | IMD and NCMRWF forecasters                    | Bias-corrected forecast               |
| **Regime monitor**          | Monsoon phase (active, normal, break), detected weather systems, regime map and a season timeline.                                                                                               | Forecasters, researchers                      | Regime classifier                     |
| **Regime mix per district** | Share of each of the six regimes in a district, for example 78% orographic and 17% coastal. These shares are the blend weights of the correction.                                                | Forecasters                                   | Regime classifier                     |
| **Saliency view**           | Heatmap of what the regime classifier looked at (for example a Bay of Bengal low), with forecast 850 hPa wind arrows.                                                                            | Forecasters, reviewers                        | Regime classifier (explainability)    |
| **Forecaster override**     | Pick a district, choose a different regime, see the before and after rainfall, heavy-rain chance and warning, then apply. Every override is logged.                                              | Forecasters                                   | Regime classifier (human in the loop) |
| **Heavy-rain outlook**      | Chance of rain at or above 64.5, 115.6 and 204.5 mm (IMD heavy, very heavy, extremely heavy) for every district and lead day.                                                                    | Forecasters, SDMAs                            | Heavy-rainfall probability            |
| **District product**        | Table of every district: corrected rainfall, IMD category, three probabilities, warning colour. Export as CSV or GeoJSON, or download a PDF bulletin.                                            | SDMAs, district officials, agromet units, CWC | District-level product                |
| **District page**           | Five-day raw vs corrected chart with the likely range, heavy-rain chance by day, why the correction was made, and the last 30 days of performance.                                               | District officials                            | District-level product                |
| **Verification lab**        | RMSE, ETS, CSI, POD, FAR and FSS, plus Brier skill and reliability, split by regime, lead day, threshold and region. Compares four correction methods. One-click PDF report.                     | NCMRWF scientists                             | Verification report                   |
| **Case studies**            | Replays past events with raw, corrected and observed maps side by side.                                                                                                                          | Everyone; the demo video                      | Evidence for all five                 |
| **Exposure layer**          | People (Census 2011), landslide-prone districts and large dams inside red and orange districts.                                                                                                  | SDMAs, NDMA                                   | Added value                           |
| **Alerts**                  | Draft warnings from the forecast. A forecaster approves; Varsha sends a CAP 1.2 alert to NDMA's SACHET system, SMS to officials and email to the SDMA, in English, Hindi and regional languages. | Forecasters, SDMAs                            | Added value                           |
| **Ask Varsha**              | Chat assistant on every screen. Answers from Varsha's own data, shows its sources and drafts bulletins. It never issues a warning on its own.                                                    | Forecasters, district officials               | Added value                           |

1.3 What makes Varsha different

- **Regimes per grid cell, not one label for India.** Three layers (monsoon phase, weather systems, local mechanism) combine into six regimes for each cell. The Western Ghats can be orographic while Bihar sits under a depression on the same day.

- **Soft blending of six regime experts.** On transition days two regimes share the weight, so the correction changes smoothly. Forecasters can see the mix and override it.

- **Proof built in.** Every report compares raw, one global correction, regime-wise quantile mapping and Varsha, regime by regime: the PS's own claim, tested.

- **From forecast to action.** Calibrated probabilities at IMD thresholds, CAP alerts to SACHET, regional-language bulletins and a grounded assistant.

1.4 UI walkthrough

The screenshots shared with the team are numbered 1 to 8 in the same order as below.

Design principles

- **Map first.** Every main screen is built around a district-level map of India drawn with India's official boundary.

- **One layout everywhere.** A dark sidebar on the left with six sections; a top bar with the model run, the lead day (Day 1–5) and the Ask Varsha button; content in white cards on a light background.

- **IMD's own language.** IMD rainfall categories and the green, yellow, orange and red warning colours, so forecasters read it without training.

- **Every number has a reason.** Panels show which regime drove a correction and why.

- **Look.** Light grey background, white cards, dark navy sidebar, one blue accent. IBM Plex Sans for text and data, Instrument Serif for page titles.

Navigation

Sidebar: Forecast · Regimes · Districts · Alerts (with a count of drafts waiting) · Verification · Case studies. The district page opens by clicking any district on a map or in a table. Ask Varsha opens as a drawer from the top bar on every screen.

Screen 1 · Forecast console (home)

- India map at district level. A drag slider splits the map: the left side shows Varsha's corrected rainfall and the right side the raw model.

- Five layer buttons: Rainfall, Regime, Heavy rain, Exposure, Saliency. The legend changes with the layer (IMD rainfall categories, regime colours, probability scale, warning colours, saliency scale).

- Status chips: today's monsoon phase, detected weather systems, and the number of red and orange districts.

- Right panel for the selected district: warning badge, corrected vs raw rainfall and the difference, the regime-mix bar, three heavy-rain chances, "why this correction", exposure, and a button to the district page.

Why it matters: in one glance a forecaster sees where the correction changes the picture, and why.

Screen 2 · Regime monitor

- Top row: monsoon phase with active, normal and break probabilities; weather systems detected with their confidence; districts by main regime.

- Map with a toggle: "Regime by district" or "What the engine looked at" (the saliency heatmap with forecast wind arrows).

- Season timeline: the monsoon phase for every day since 1 June, with the forecast days marked.

- Selected-district card: the regime mix and the override flow. The forecaster chooses a regime from a dropdown, sees the rainfall, heavy-rain chance and warning before and after, and applies it. The override is logged with name and reason.

Screen 3 · District outlook

- Three maps side by side: chance of heavy (64.5 mm or more), very heavy (115.6 mm or more) and extremely heavy (204.5 mm or more) rain.

- District table sorted by risk, with search, state filter and warning filter. Columns: corrected and raw rainfall, regime, three chances, warning. CSV export and PDF bulletin download.

Screen 4 · District page

- Header: district and state, warning, regime, a locator map and the headline numbers.

- Next five days: raw vs corrected rainfall per day, the likely range, and IMD threshold lines.

- "Why Varsha raised Day 1": the contribution of each factor in mm (for example upslope moisture flux, the orographic expert, climatology).

- Heavy-rain chance grid by day, and the last 30 days of forecasts vs observations for that district.

Screen 5 · Verification lab

- Filters: season, lead day, regime, region.

- Headline scores vs raw: RMSE, ETS, POD and FAR.

- Baseline ladder by regime: raw → one global correction → regime-wise quantile mapping → Varsha.

- Reliability diagram for the probabilities, FSS by neighbourhood size, scores by lead day, and a one-click PDF report.

Screen 6 · Case studies

- List of past events, for example the Wayanad landslide rains (29–31 July 2024) and the north-west India downpour (8–10 July 2023).

- Raw, corrected and observed maps side by side with a playback bar; district numbers, heavy-rain districts caught, and the warning colour each forecast would have produced.

Screen 7 · Alerts

- Queue of draft warnings generated from the forecast for red and orange districts.

- Composer: event, validity, chance, rainfall range, regime and exposure; the message in English, Hindi and Malayalam tabs; channels (SACHET CAP feed, SMS to district officials, SDMA email, webhook); Approve and send, Edit, Reject.

- Previews: the SMS on a phone, and the CAP 1.2 file that goes to SACHET.

Screen 8 · Ask Varsha drawer (opens on any screen)

- Chat panel. Example: "Which Kerala districts need a red alert tomorrow, and why?" The answer lists the districts with their rainfall and chances, explains the regime behind it, shows its sources, and offers one-click actions: "Draft red alerts" and "Show on map".

- Suggested questions (for example "Summarise today's outlook in Hindi"), and a standing note that it reads forecast data only and forecasters approve every warning.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<tbody>
<tr class="odd">
<td><p><strong>Note for the team</strong></p>
<p>All maps and numbers in the UI screenshots are sample values for layout. In the PPT, present verification figures as targets (Section 4.3) unless they come from a scored season.</p></td>
</tr>
</tbody>
</table>

2\. Technical approach

Everything is trained and scored on IMD's 0.25° grid for the June–September monsoon, for lead days 1 to 5, with each season held out in turn.

2.1 Data

| **Role**                          | **Dataset**                                                                                                                                                 | **Access**                      |
|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| **Raw forecast to correct**       | NCUM-G deterministic (~12 km), NEPS-G ensemble, NCUM-R regional (4.4 km) \[2\]\[3\]                                                                         | NCMRWF                          |
| **Development stand-in**          | GFS 0.25° forecast archive                                                                                                                                  | Public (NOAA)                   |
| **Truth**                         | IMD daily gridded rainfall, 0.25° (Pai et al.), via the imdlib Python package \[6\]                                                                         | Public (IMD Pune)               |
| **Truth where gauges are sparse** | NCMRWF–IMD merged satellite-gauge rainfall; GPM IMERG                                                                                                       | NCMRWF / NASA                   |
| **Regime labels and features**    | IMDAA regional reanalysis (NCMRWF) \[7\], ERA5, IMD low and depression tracks, BSISO/MJO index                                                              | Free with registration / public |
| **Static layers**                 | SRTM terrain, coastline, district boundaries (Survey of India)                                                                                              | Public                          |
| **Exposure**                      | Census 2011 district population \[10\]; GSI landslide susceptibility maps \[8\]; CWC National Register of Large Dams (6,281 large dams, 2023 edition) \[9\] | Public                          |

Setup choices that matter

- **One grid.** Forecasts are regridded to IMD's 0.25° grid with conservative remapping, which keeps rainfall totals intact.

- **The right rain day.** IMD's rain day is the 24 hours ending 08:30 IST (03 UTC) \[6\]. For a 00 UTC run, Day 1 is forecast hours 03–27. Getting this window wrong creates fake bias on its own.

- **Honest splits.** Leave-one-monsoon-out cross-validation; the latest season is untouched until the final report. Random-day splits leak because rain on consecutive days is correlated.

- **Features per cell and lead day:** raw rainfall and its neighbourhood mean and max (absorbs small position errors), precipitable water, 850 hPa wind and vorticity, pressure anomaly, terrain height and slope, distance to coast, date climatology, lead day, and ensemble mean, spread and member fractions from NEPS.

- **Two physics features:** upslope moisture flux, F_oro = q850 × max(0, V850 · ∇h), which is large when moist winds run up the Western Ghats or the Meghalaya plateau; and moisture-flux convergence, C = −∇·(qV).

2.2 Regime engine

The classifier reads the forecast's own fields at the valid time (training labels come from observations). At run time only the forecast exists, and the model's error depends on the weather it is simulating. At Day 4–5 its confidence drops, so the blend automatically leans toward a general correction.

| **Layer**                              | **Classes**                                                        | **Training labels (observed)**                                                                                                                                           | **Detected in the forecast by**                                                                          |
|----------------------------------------|--------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **L1 Monsoon phase (one per day)**     | Active, normal, break                                              | Rajeevan et al. (2010): core monsoon zone (18–28°N, 65–88°E) rainfall anomaly above +1.0 or below −1.0 standard deviation for 3+ days \[11\]; extended to June–September | LightGBM on leading EOFs of forecast 850 hPa wind, pressure and precipitable water; v2: a small CNN      |
| **L2 Weather systems (with position)** | Low or depression, western disturbance, west-coast offshore vortex | IMD low and depression tracks; WD and vortex catalogues from IMDAA                                                                                                       | Objective tracker: 850 hPa vorticity maximum plus pressure minimum for lows; 500/200 hPa troughs for WDs |
| **L3 Local mechanism (per cell)**      | Orographic, coastal-onshore, inland                                | Computed from physics                                                                                                                                                    | Upslope moisture flux over slopes; onshore flow near the coast; else inland                              |

The layers combine into **six regimes**, each with its own correction expert: depression-embedded (sector-aware, as the heaviest rain usually sits south-west of the centre), orographic, coastal, western-disturbance interaction, active or normal inland, and break. Every cell gets a probability for all six.

2.3 Correction engine

- **Tier A, regime-wise quantile mapping.** Per regime, region cluster and lead day, the forecast rainfall distribution is mapped onto the observed one, with extrapolated tails so extremes are never capped. The robust safety net.

- **Tier B, gradient-boosted experts (main model).** One LightGBM expert per regime with a Tweedie objective (many dry days, heavy tail). Blend: ŷ = Σ p_k × f_k(x), where p_k is the regime probability and f_k the regime's expert.

- **Tier C, regime-conditioned U-Net (v2).** Corrects whole maps at once, so rain placed on the wrong side of a ridge moves back to the windward slope. Regime probabilities enter through FiLM conditioning; it predicts a full rainfall distribution per cell (censored shifted gamma \[13\]) trained on CRPS.

- **Fast adaptation.** Between retrains, a decaying-average bias update per regime, the method used operationally in NCEP's NAEFS since 2006 \[12\], adapts within days to a model upgrade.

2.4 Heavy-rain probability

- Separate classifiers give P(≥64.5), P(≥115.6) and P(≥204.5 mm) per cell, using expert outputs and NEPS member fractions as inputs.

- Isotonic calibration per regime, so a 60% forecast verifies about 60% of the time. The three probabilities are kept in order.

- Rare events: class weights and pooled heavy-rain cases across similar cells; for ≥204.5 mm the U-Net's distribution tail stands in when cases are too few.

- Two numbers, two jobs: the corrected amount is tuned for RMSE and maps; warnings come from the probability, because any amount tuned for average error shaves peaks.

2.5 District product and alerts

- Each 0.25° cell's overlap with every district polygon is computed once (area-weighted), so even districts smaller than a cell get a value.

- Per district and lead day: area-mean rainfall, the wettest cell, the percentage of area over each threshold, and the chance of heavy rain anywhere in the district.

- Warning colour from a probability × intensity matrix in the style of IMD's impact-based warnings; cut-offs are set with forecasters.

- Alerts: drafts are generated automatically; a forecaster approves; Varsha publishes CAP 1.2, the standard behind NDMA's SACHET system \[5\], plus SMS, email and webhooks. Bulletins are drafted in English, Hindi and regional languages.

2.6 Explainability and forecaster control

- **Why this correction:** SHAP values \[16\] from the LightGBM experts give each district a factor-by-factor explanation in mm.

- **Saliency:** Integrated Gradients \[15\] on the CNN regime classifier shows where in the weather fields it looked.

- **Regime mix and override:** each regime expert's output is stored per district, so when a forecaster overrides a regime the site re-blends instantly. Overrides are logged and become training labels.

2.7 Ask Varsha assistant

- **Read-only and grounded.** A language model with tool calls over Varsha's own APIs (district table, regimes, verification scores). It explains and drafts; it never computes or issues a forecast.

- **Shows its sources** for every figure, and refuses questions its data cannot answer.

- **Drafts bulletins and translations** for forecasters to approve.

- **Deployment.** A hosted model in the prototype; in production an open-weight model self-hosted on NCMRWF servers or government cloud, so forecast data stays in India. Indian ministries have advised staff against external AI tools for official data \[23\]. One GPU serves a few hundred users.

2.8 Verification

- **Truth:** next-day IMD gridded rainfall; merged satellite-gauge data where gauges are sparse.

- **Scores:** RMSE and bias; POD, FAR, CSI, ETS and frequency bias at 64.5, 115.6 and 204.5 mm; FSS over windows 1 to 9 cells wide (about 25 to 250 km) \[14\]; Brier skill score, reliability diagram and ROC area for probabilities.

- **Regime classifier:** confusion matrix and per-class F1 against observed labels at each lead day, compared with persistence (tomorrow's regime = today's); low and depression detection scored by hits and false alarms.

- **Slicing:** every score split by regime, lead day, threshold, region and season, for all four rungs of the baseline ladder, with bootstrap confidence intervals.

2.9 Tech stack

| **Layer**          | **Tools**                                                          | **Why**                                                                           |
|--------------------|--------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| **Data and grids** | Python, xarray, cfgrib, Dask, xESMF, Zarr/NetCDF                   | Reads NCMRWF's GRIB2/NetCDF; conservative regridding                              |
| **Models**         | LightGBM, scikit-learn, PyTorch (U-Net, CNN), SHAP, Captum         | v1 trains on CPU; GPU only for v2                                                 |
| **Verification**   | scores (Bureau of Meteorology), xskillscore, pysteps               | Tested implementations of every PS metric                                         |
| **Pipeline**       | Prefect in Docker; MLflow model registry                           | Runs after each model run; every model version traceable                          |
| **Storage**        | PostgreSQL + PostGIS; object storage for grids and map tiles       | Spatial queries for districts; cheap map tiles                                    |
| **API**            | FastAPI                                                            | Same language as the models; auto-generated API docs for SDMA and CWC integrators |
| **Frontend**       | React, MapLibre GL, ECharts                                        | Smooth district-level maps and charts                                             |
| **Assistant**      | LLM with tool calling; open-weight model self-hosted in production | Grounded answers; data stays in India                                             |
| **Alerts**         | CAP 1.2 (XML/JSON), SMS gateway, email, webhooks                   | Plugs into NDMA's SACHET                                                          |
| **Operations**     | Docker Compose → Kubernetes, GitHub Actions, Prometheus + Grafana  | Same containers from a laptop to NCMRWF servers                                   |

3\. Feasibility and viability

Every component is proven on its own. What is new is conditioning them on regime and running them as one daily loop, which is engineering a student team can deliver.

3.1 Feasibility

- **Technical.** Quantile mapping, gradient-boosted model output statistics, U-Net post-processing and low-pressure tracking are established methods. The active/break rule is objective. Every PS metric has an open-source implementation.

- **Data.** Everything except the NCUM archive is public today. The pipeline is model-agnostic (one adapter per model), so it is built on GFS and retrained on NCUM as soon as NCMRWF shares past seasons.

- **Compute.** LightGBM on about 16 million rows trains in a few hours at most on a laptop CPU; the U-Net trains in hours on one free GPU. Daily inference for all of India at five lead days takes minutes on one CPU server, negligible next to the weather model itself.

Training-set size (rough estimate, to be measured):

| **Quantity**                                        | **Estimate**     |
|-----------------------------------------------------|------------------|
| Land cells over India at 0.25°                      | ~4,500           |
| Forecast-days (6 monsoons × 122 days × 5 lead days) | ~3,700           |
| Training samples (cells × forecast-days)            | ~16 million      |
| Samples at or above 64.5 mm (if 1–2% of cell-days)  | ~150,000–300,000 |

3.2 How Varsha differs from current practice

IMD already issues Day 1–5 district rainfall forecasts from a multi-model ensemble (MME) of five models: IMD's GFS and GEFS, NCEP's GFS, NCMRWF's Unified Model and JMA's GSM. In the 2021 monsoon the MME's Day-1 correlation was 0.58, against 0.43–0.49 for single models, and its RMSE 12.7 mm/day against 14.1–16.6 \[4\]. Its published description does not condition the correction on the weather regime.

Varsha is a layer on top, not a replacement: it can correct each model before the MME blends them, or correct the MME output itself. It adds a regime-dependent correction per cell, calibrated probabilities at IMD thresholds, explanations, daily regime-wise verification and a path from forecast to alert.

3.3 Risks and mitigations

| **Risk**                                       | **Effect**                           | **Mitigation**                                                                                            |
|------------------------------------------------|--------------------------------------|-----------------------------------------------------------------------------------------------------------|
| **NCUM archive not shared in time**            | Cannot train on the target model     | Model-agnostic adapters; build on GFS; decaying-average update adapts within weeks of the first NCUM data |
| **Regime flips on transition days**            | Wrong expert applied                 | Soft probabilities and blending; confidence falls with lead day                                           |
| **Heavy rain is rare in training data**        | The model shaves peaks               | Tweedie objective, class weights, pooled cells, tail extrapolation, separate probability heads            |
| **Model upgrades change the bias**             | Corrections go stale                 | Version-aware training, drift alarms from daily verification, decaying-average update                     |
| **Few gauges in the north-east and hills**     | Weak truth where regimes matter most | Merged satellite-gauge truth; pooling across similar terrain                                              |
| **Train/test leakage**                         | Inflated scores                      | Leave-one-monsoon-out cross-validation; final season untouched                                            |
| **CSI and FAR punish near misses twice**       | Unfair verdict on spatial forecasts  | FSS at several scales; neighbourhood features                                                             |
| **Small districts on a 0.25° grid**            | Missing or smeared values            | Area-weighted overlap; "anywhere in district" probability                                                 |
| **Assistant gives a wrong answer**             | Misleading guidance                  | Read-only tool calls, sources shown, refusal outside its data, forecaster approval for anything sent      |
| **Official data sent to external AI services** | Policy and security concerns         | Self-hosted open-weight model inside NCMRWF or government cloud                                           |
| **Forecasters distrust an AI product**         | Low uptake                           | Explanations, regime override, sign-off before alerts, one shadow season before going live                |

3.4 Viability

- **Cost.** Open-source stack; one server or an existing NCMRWF or NIC MeghRaj virtual machine; one GPU for the assistant; no new sensors or supercomputing.

- **Integration.** Reads the GRIB2/NetCDF files NCMRWF already writes; writes standard NetCDF on the same grid, district CSVs, a CAP feed and a REST API.

- **Sustainability.** Automatic retraining every pre-monsoon, drift alarms, and a model registry that keeps every version reproducible.

- **Reach.** One pipeline serves forecasters, SDMAs, CWC, agromet units and city bodies. The north-east monsoon over Tamil Nadu and coastal Andhra Pradesh is a natural second season.

Rollout

| **Phase**             | **When**                | **What happens**                                                                           | **Gate to move on**                                        |
|-----------------------|-------------------------|--------------------------------------------------------------------------------------------|------------------------------------------------------------|
| **1 · Hindcast**      | Before the next monsoon | Train on past seasons; publish the regime-wise verification report                         | Beats raw and one global correction on the held-out season |
| **2 · Shadow season** | One monsoon             | Runs daily beside forecasters, not public; overrides logged                                | Forecaster sign-off; real-time skill holds                 |
| **3 · Operational**   | Following monsoon       | District products and CAP alerts after forecaster approval; API for SDMAs, CWC and agromet | One stable season, no drift alarms                         |
| **4 · Expand**        | After that              | North-east monsoon, NEPS probabilities, other models, temperature and wind                 | —                                                          |

4\. Impact and benefits

The payoff is fewer missed extreme-rain days at district level, delivered as probabilities officials can act on up to five days ahead.

4.1 Why it matters

- **Wayanad, 30 July 2024.** IMD forecast up to about 200 mm of very heavy rain; more than 572 mm fell. The red warning came only in the early hours of the landslide day, by the IMD chief's own account \[17\]. An under-forecast orographic extreme is exactly what Varsha's orographic expert and its extremely-heavy probability target.

- **Averages hide extremes.** A six-model study over Kerala (NCMRWF, NCEP, ECMWF, UKMO, JMA, CMA) found every model over-predicted rainfall on average \[18\]. A single global correction would scale rain down everywhere and make extreme-day misses worse; a regime-aware one can cut routine over-forecasting and raise orographic peaks at the same time.

- **Scale.** India saw extreme weather on 93% of days from January to September 2024, with 3,238 deaths \[19\]. Monsoon floods and landslides in 2024 killed more than 1,800 people \[20\]. Widespread extreme rain events over central India tripled between 1950 and 2015 \[21\].

4.2 Who gains what

| **Who**                                        | **Decision they make**                              | **What Varsha gives them**                                                                                  |
|------------------------------------------------|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **IMD and NCMRWF forecasters**                 | Daily district warnings                             | An objective first guess with regime context and explanations; draft alerts and bulletins in seconds        |
| **SDMAs, DDMAs, NDRF**                         | Pre-positioning teams, school closures, evacuations | District probability of very heavy and extremely heavy rain up to 5 days ahead; exposure counts; CAP alerts |
| **District officials**                         | Local action                                        | Plain-language answers and bulletins in Hindi and regional languages through Ask Varsha                     |
| **CWC flood forecasting, reservoir operators** | Flood forecasts, dam releases                       | Bias-corrected rainfall grids by API; dams inside warned districts flagged                                  |
| **Agromet units and farmers**                  | Sowing, spraying, irrigation, harvest               | Calibrated rain/no-rain and amounts by district                                                             |
| **City bodies (Mumbai, Chennai, Bengaluru)**   | Pumping, traffic, closures                          | Heavy-rain probability at city scale                                                                        |
| **NCMRWF model developers**                    | Where to improve the model                          | Regime-wise error maps showing which regimes the model gets wrong                                           |

4.3 Measurable targets

Stated as targets to be measured on a held-out season, not as results:

- Corrected forecast beats raw NWP on RMSE and on ETS at 64.5 mm, at every lead day.

- Regime-aware correction beats a single global correction in the regimes where raw bias differs most (orographic, depression-embedded).

- POD at 115.6 mm rises without FAR rising.

- Brier skill score above zero against climatology, with reliability close to the diagonal.

- Regime classifier beats persistence at every lead day.

4.4 Beyond the monsoon

The same pipeline extends to the north-east monsoon, to other models (IMD GFS, ECMWF), to other variables (temperature, wind), and, through the Ask Varsha and Alerts modules, to faster and more local warning dissemination.

5\. Research and references

Problem and operational context

\[1\] SIH 2026 problem statement 26080, MoES / NCMRWF. [sih.gov.in](https://sih.gov.in/sih2026PS)

\[2\] IMD Met Monograph, Chapter 8: Numerical Weather Prediction guidance (NCUM-G v6, ~12 km). [mausam.imd.gov.in](https://mausam.imd.gov.in/responsive/pdf_viewer_css/met1/Chapter-8%20page%20174-190/Chapter-8%20page%20174-190.pdf)

\[3\] NCMRWF regional unified model NCUM-R, 4.4 km (IITM SRF). [srf.tropmet.res.in](https://srf.tropmet.res.in/srf/ts_prediction_system/ncum-r.php)

\[4\] A multi-model ensemble tool for predicting district-level monsoon rainfall and extreme rainfall events over India, MAUSAM. [mausamjournal.imd.gov.in](https://mausamjournal.imd.gov.in/index.php/MAUSAM/article/view/6118)

\[5\] C-DOT and NDMA workshop on the CAP-based Integrated Alert System, SACHET (PIB). [pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1855808)

Data

\[6\] Development of a high resolution daily gridded rainfall data for the Indian region (Pai et al., IMD); 24 h ending 08:30 IST. [PDF](https://civil.colorado.edu/~balajir/monsoon/daily-data/ref_paper.pdf)

\[7\] NCMRWF data web portal: IMDAA regional reanalysis. [ncmrwf.gov.in/data](https://www.ncmrwf.gov.in/data/)

\[8\] Geological Survey of India, Bhusanket: landslide hazard and National Landslide Susceptibility Mapping. [bhusanket.gsi.gov.in](https://bhusanket.gsi.gov.in/LS_hazard.html)

\[9\] National Register of Large Dams, 2023 edition: 6,281 large dams (Business Standard, citing the Government). [business-standard.com](https://www.business-standard.com/pti-stories/national/1-065-large-dams-50-100-years-old-224-are-over-a-century-old-govt-124121600799_1.html)

\[10\] Census 2011 district population (e.g. Wayanad: 817,420). [census2011.co.in](https://www.census2011.co.in/census/district/273-wayanad.html)

Methods

\[11\] Active and break spell criteria, Rajeevan et al. (2010), as used by IITM ERPAS. [tropmet.res.in](https://www.tropmet.res.in/erpas/files/active_break_selection.php)

\[12\] Cui, Toth, Zhu and Hou (2012), Bias correction for global ensemble forecast, Weather and Forecasting 27: decaying-average bias correction, operational at NCEP since 2006. [PDF](https://emc.ncep.noaa.gov/gmb/yzhu/gif/pub/manuscript_WAF-D-11-00011.pdf)

\[13\] Scheuerer and Hamill (2015), Statistical post-processing of ensemble precipitation forecasts by fitting censored, shifted gamma distributions, Monthly Weather Review 143.

\[14\] Roberts and Lean (2008), Scale-selective verification of rainfall accumulations from high-resolution forecasts of convective events (Fractions Skill Score), Monthly Weather Review 136.

\[15\] Sundararajan, Taly and Yan (2017), Axiomatic attribution for deep networks (Integrated Gradients), ICML 2017.

\[16\] Lundberg and Lee (2017), A unified approach to interpreting model predictions (SHAP), NeurIPS 2017.

Impact evidence

\[17\] Regular rainfall warnings issued for Kerala, says IMD chief (Onmanorama, 1 August 2024). [onmanorama.com](https://onmanorama.com/news/kerala/2024/08/01/regular-rainfall-warnings-issued-kerala-imd-wayanad-landslides.html)

\[18\] Performance evaluation of NWP models in forecasting rainfall events in Kerala, India (Atmosphere, 2025). [mdpi.com](https://www.mdpi.com/2073-4433/16/4/372)

\[19\] Climate India 2024: An assessment of extreme weather events (Centre for Science and Environment). [cseindia.org](https://www.cseindia.org/climate-india-2024-an-assessment-of-extreme-weather-events-12460)

\[20\] 2024 India floods (Wikipedia). [en.wikipedia.org](https://en.wikipedia.org/wiki/2024_India_floods)

\[21\] Roxy et al. (2017), A threefold rise in widespread extreme rain events over central India, Nature Communications. [PubMed](https://pubmed.ncbi.nlm.nih.gov/28974680)

\[22\] Evaluation of NCUM regional forecasts for extreme rainfall over Mumbai (Natural Hazards, 2024). [link.springer.com](https://link.springer.com/article/10.1007/s11069-024-06628-8)

\[23\] India's finance ministry asks employees to avoid AI tools like ChatGPT, DeepSeek (Reuters via Kathmandu Post, February 2025). [kathmandupost.com](https://kathmandupost.com/world/2025/02/05/india-s-finance-ministry-asks-employees-to-avoid-ai-tools-like-chatgpt-deepseek)

Appendix: slide map for the PPT

| **Slide**                         | **Take from**    | **Key content**                                                                                               |
|-----------------------------------|------------------|---------------------------------------------------------------------------------------------------------------|
| **1 · Title**                     | Title block      | Varsha, PS 26080, MoES/NCMRWF, team name                                                                      |
| **2 · Proposed solution**         | Sections 1.1–1.3 | The problem in three lines, Varsha in one paragraph, Figure 1, feature list, what makes it different          |
| **3 · Technical approach**        | Section 2        | Data table, three-layer regime engine, correction tiers, probabilities, explainability, assistant, tech stack |
| **4 · Feasibility and viability** | Section 3        | Feasibility bullets, current practice vs Varsha, top risks, cost and rollout phases                           |
| **5 · Impact and benefits**       | Section 4        | Wayanad story, who gains what, measurable targets                                                             |
| **6 · Research and references**   | Section 5        | Pick 8–10 references: \[2\], \[4\], \[6\], \[11\], \[12\], \[14\], \[17\], \[18\], \[19\], \[21\]             |
| **Demo video**                    | Section 1.4      | Walk the screens in order 1 → 8; show the Wayanad case, the override and Ask Varsha                           |
