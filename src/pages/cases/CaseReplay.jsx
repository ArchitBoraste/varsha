import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/Card/Card.jsx';
import Icon from '../../components/Icon/Icon.jsx';
import { regimeTint } from '../../lib/regimes.js';
import { RAIN_CATEGORIES, REGIME_BY_ID } from '../../lib/scales.js';
import CaseMap from './CaseMap.jsx';
import CaseStats from './CaseStats.jsx';
import DayScrubber from './DayScrubber.jsx';
import styles from './CaseReplay.module.css';

const STEP_MS = 1500;

const MAPS = [
  { field: 'raw', title: 'Raw GFS' },
  { field: 'corrected', title: 'Varsha corrected', featured: true },
  { field: 'observed', title: 'Observed · IMD' },
];

/** Opens on the day the most rain fell on the focus district. */
const peakDay = (days, focusId) =>
  days.reduce((best, day, i) => (day.values[focusId].observed > days[best].values[focusId].observed ? i : best), 0);

/** One past event: raw, corrected and observed maps for each day, played back or scrubbed. */
export default function CaseReplay({ caseStudy, districts, states, places }) {
  const { days, focusDistrict, focusStates } = caseStudy;
  const [index, setIndex] = useState(() => peakDay(days, focusDistrict));
  const [playing, setPlaying] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const day = days[index];
  const regime = REGIME_BY_ID[caseStudy.regime];

  const regionIds = useMemo(
    () => Object.keys(day.values).filter((id) => focusStates.includes(places[id].state)),
    [day, focusStates, places],
  );

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % days.length), STEP_MS);
    return () => clearInterval(timer);
  }, [playing, days.length]);

  // Scrubbing by hand takes over from playback.
  const scrub = (next) => {
    setPlaying(false);
    setIndex(next);
  };

  return (
    <div className={styles.main}>
      <Card aria-labelledby="case-title" className={styles.card}>
        <div className={styles.head}>
          <h2 id="case-title" className={styles.title}>
            {caseStudy.title}
          </h2>
          <span className={styles.regime} style={{ background: regimeTint(regime) }}>
            {regime.label} regime
          </span>
          <span className={styles.run}>
            Run {day.run} · Day {day.lead}
          </span>
        </div>

        <div className={styles.maps}>
          {MAPS.map(({ field, title, featured }) => (
            <CaseMap
              key={field}
              title={title}
              field={field}
              featured={featured}
              day={day}
              districts={districts}
              states={states}
              bounds={caseStudy.bounds}
              hoverId={hoverId}
              onHover={setHoverId}
            />
          ))}
        </div>

        <div className={styles.playback}>
          <button
            type="button"
            className={styles.play}
            aria-label={playing ? 'Pause replay' : 'Play replay'}
            onClick={() => setPlaying(!playing)}
          >
            <Icon name={playing ? 'pause' : 'playSolid'} size={18} strokeWidth={3} />
          </button>
          <DayScrubber days={days} index={index} onChange={scrub} />
          <div className={styles.legend} role="img" aria-label="Rainfall colours from light to extremely heavy">
            {RAIN_CATEGORIES.slice(1).map(({ id, color, label }) => (
              <span key={id} className={styles.swatch} style={{ background: color }} title={label} />
            ))}
            <span className={styles.legendText} aria-hidden="true">
              light → extremely heavy
            </span>
          </div>
        </div>
      </Card>

      <CaseStats caseStudy={caseStudy} day={day} focusName={places[focusDistrict].district} regionIds={regionIds} />
    </div>
  );
}
