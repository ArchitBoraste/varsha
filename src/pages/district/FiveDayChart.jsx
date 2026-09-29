import { useState } from 'react';
import Card from '../../components/Card/Card.jsx';
import Tooltip from '../../components/Tooltip/Tooltip.jsx';
import { formatMm } from '../../lib/format.js';
import { THRESHOLDS } from '../../lib/risk.js';
import useElementSize from '../../lib/useElementSize.js';
import { useAppState } from '../../state/AppState.jsx';
import styles from './FiveDayChart.module.css';

const MARGIN = { top: 8, right: 100, bottom: 30, left: 40 };
const PLOT_HEIGHT = 232;
const HEIGHT = MARGIN.top + PLOT_HEIGHT + MARGIN.bottom;
const BAR_WIDTH = 26;
const BAR_GAP = 4;
const CAP_WIDTH = 12;
// The axis always reaches past the heavy-rain line so small amounts read in context.
const MIN_AXIS_MM = 80;

const THRESHOLD_LINES = {
  p64: { label: 'Heavy', color: '#B86A1E' },
  p115: { label: 'V. heavy', color: '#B03A2E' },
  p204: { label: 'Ext. heavy', color: '#8C1E3C' },
};

/** A round axis maximum with at most five ticks. */
function yAxis(maxValue) {
  const step = [10, 20, 25, 50, 100, 200].find((candidate) => maxValue / candidate <= 4) ?? 250;
  const max = Math.ceil(maxValue / step) * step;
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) };
}

/** Bar with rounded top corners standing on `bottom`. */
function barPath(x, top, width, bottom) {
  const r = Math.min(4, width / 2, bottom - top);
  return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${bottom}Z`;
}

/** Raw vs Varsha rainfall for the five lead days, with the likely range and IMD thresholds. */
export default function FiveDayChart({ district, leads }) {
  const { lead, setLead } = useAppState();
  const [boxRef, size] = useElementSize();
  const [hovered, setHovered] = useState(null);

  const { days } = district;
  const { max, ticks } = yAxis(Math.max(MIN_AXIS_MM, ...days.flatMap((day) => [day.range[1], day.raw])));
  const plotWidth = Math.max(0, size.width - MARGIN.left - MARGIN.right);
  const groupWidth = plotWidth / days.length;
  const barWidth = Math.max(4, Math.min(BAR_WIDTH, groupWidth / 2 - 8));
  const y = (mm) => MARGIN.top + PLOT_HEIGHT * (1 - mm / max);
  const centre = (index) => MARGIN.left + groupWidth * (index + 0.5);
  const baseline = y(0);

  return (
    <Card aria-labelledby="five-day-title" className={styles.card}>
      <div className={styles.head}>
        <h2 id="five-day-title" className={styles.title}>
          Next 5 days · rainfall, mm/day
        </h2>
        <div className={styles.legend} aria-hidden="true">
          <span>
            <span className={styles.swatch} style={{ background: '#B8C3CB' }} />
            Raw GFS
          </span>
          <span>
            <span className={styles.swatch} style={{ background: 'var(--accent)' }} />
            Varsha, with likely range
          </span>
        </div>
      </div>

      <div ref={boxRef} className={styles.chart} style={{ height: HEIGHT }}>
        {size.width > 0 && (
          <svg width={size.width} height={HEIGHT} aria-hidden="true" className={styles.svg}>
            <rect
              className={styles.current}
              x={MARGIN.left + groupWidth * (lead - 1) + 4}
              y={MARGIN.top}
              width={Math.max(0, groupWidth - 8)}
              height={PLOT_HEIGHT}
              rx="8"
            />

            {ticks.map((tick) => (
              <g key={tick}>
                <line className={styles.grid} x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(tick)} y2={y(tick)} />
                <text className={styles.tick} x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}

            {THRESHOLDS.filter(({ mm }) => mm <= max).map(({ key, mm }) => (
              <g key={key} stroke={THRESHOLD_LINES[key].color} fill={THRESHOLD_LINES[key].color}>
                <line x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={y(mm)} y2={y(mm)} strokeDasharray="4 3" />
                <text className={styles.thresholdLabel} x={MARGIN.left + plotWidth + 8} y={y(mm) + 4} stroke="none">
                  {THRESHOLD_LINES[key].label} {mm}
                </text>
              </g>
            ))}

            {days.map((day, index) => {
              const x = centre(index);
              const whiskerX = x + BAR_GAP / 2 + barWidth / 2;
              return (
                <g key={day.lead}>
                  <path className={styles.rawBar} d={barPath(x - BAR_GAP / 2 - barWidth, y(day.raw), barWidth, baseline)} />
                  <path className={styles.varshaBar} d={barPath(x + BAR_GAP / 2, y(day.corrected), barWidth, baseline)} />
                  <g className={styles.whisker}>
                    <line x1={whiskerX} x2={whiskerX} y1={y(day.range[1])} y2={y(day.range[0])} />
                    <line x1={whiskerX - CAP_WIDTH / 2} x2={whiskerX + CAP_WIDTH / 2} y1={y(day.range[1])} y2={y(day.range[1])} />
                    <line x1={whiskerX - CAP_WIDTH / 2} x2={whiskerX + CAP_WIDTH / 2} y1={y(day.range[0])} y2={y(day.range[0])} />
                  </g>
                  <text className={styles.dayLabel} x={x} y={baseline + 20} textAnchor="middle">
                    <tspan className={day.lead === lead ? styles.dayCurrent : styles.dayName}>Day {day.lead}</tspan>
                    <tspan className={styles.dayDate}> · {leads[index].label}</tspan>
                  </text>
                </g>
              );
            })}

            <line className={styles.axis} x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={baseline} y2={baseline} />
          </svg>
        )}

        {size.width > 0 &&
          days.map((day, index) => (
            <button
              key={day.lead}
              type="button"
              className={styles.dayButton}
              style={{ left: MARGIN.left + groupWidth * index, width: groupWidth }}
              aria-pressed={day.lead === lead}
              aria-label={`Day ${day.lead}, ${leads[index].label}: Varsha ${formatMm(day.corrected)}, likely ${day.range[0]} to ${formatMm(day.range[1])}; raw GFS ${formatMm(day.raw)}`}
              onClick={() => setLead(day.lead)}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
            />
          ))}

        {hovered !== null && (
          <Tooltip x={centre(hovered)} y={y(days[hovered].range[1])} bounds={{ width: size.width, height: HEIGHT }}>
            <strong>
              Day {days[hovered].lead} · {leads[hovered].label}
            </strong>
            <div>
              Varsha {formatMm(days[hovered].corrected)} (likely {days[hovered].range[0]}–{days[hovered].range[1]})
            </div>
            <div>Raw GFS {formatMm(days[hovered].raw)}</div>
          </Tooltip>
        )}
      </div>
    </Card>
  );
}
