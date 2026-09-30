import { useState } from 'react';
import Tooltip from '../../components/Tooltip/Tooltip.jsx';
import { barPath } from '../../lib/chart.js';
import { cx } from '../../lib/cx.js';
import { REGIMES } from '../../lib/scales.js';
import useElementSize from '../../lib/useElementSize.js';
import ChartCard from './ChartCard.jsx';
import { METHOD_COLORS } from './palette.js';
import styles from './LadderChart.module.css';

const MARGIN = { top: 8, left: 32, bottom: 28 };
const PLOT_HEIGHT = 220;
const HEIGHT = MARGIN.top + PLOT_HEIGHT + MARGIN.bottom;
const BAR_WIDTH = 16;
const BAR_STEP = 20;
const CAP = 6;
const TICK_STEP = 0.1;

/** Grouped bars of ETS at ≥ 64.5 mm for each method in each regime, for one region and lead day. */
export default function LadderChart({ report, lead, region, regime, regionLabel, axisMax }) {
  const [boxRef, size] = useElementSize();
  const [active, setActive] = useState(null);
  const { methods } = report;

  const groups = REGIMES.map(({ id, short }) => ({ id, label: short, ets: report.scores[region][id]?.leads[lead - 1].ets64 }));
  const groupWidth = (size.width - MARGIN.left) / groups.length;
  const barsWidth = BAR_STEP * (methods.length - 1) + BAR_WIDTH;
  const y = (value) => MARGIN.top + PLOT_HEIGHT * (1 - value / axisMax);
  const baseline = y(0);
  const left = (index) => MARGIN.left + groupWidth * index;
  const ticks = Array.from({ length: Math.round(axisMax / TICK_STEP) + 1 }, (_, i) => i * TICK_STEP);
  const highlight = regime === 'all' ? null : regime;
  const activeGroup = groups.find(({ id }) => id === active);

  return (
    <ChartCard id="ladder-title" title="Baseline ladder · ETS at ≥ 64.5 mm, by regime" note="Higher is better">
      <ul className={styles.legend} aria-hidden="true">
        {methods.map(({ id, label }) => (
          <li key={id}>
            <span className={styles.swatch} style={{ background: METHOD_COLORS[id] }} />
            {label}
          </li>
        ))}
      </ul>

      <div ref={boxRef} className={styles.chart} style={{ height: HEIGHT }}>
        {size.width > 0 && (
          <svg width={size.width} height={HEIGHT} aria-hidden="true" className={styles.svg}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line className={styles.grid} x1={MARGIN.left} x2={size.width} y1={y(tick)} y2={y(tick)} />
                <text className={styles.tick} x={MARGIN.left - 6} y={y(tick) + 4} textAnchor="end">
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}

            {groups.map(({ id, label, ets }, index) => (
              <g key={id} className={cx(highlight && highlight !== id && styles.faded)}>
                {(highlight === id || active === id) && (
                  <rect className={styles.band} x={left(index) + 4} y={MARGIN.top} width={groupWidth - 8} height={PLOT_HEIGHT} rx="8" />
                )}
                {ets ? (
                  methods.map((method, m) => {
                    const x = left(index) + (groupWidth - barsWidth) / 2 + m * BAR_STEP;
                    const value = ets[method.id];
                    const centre = x + BAR_WIDTH / 2;
                    return (
                      <g key={method.id}>
                        <path d={barPath(x, y(value), BAR_WIDTH, baseline, 3)} fill={METHOD_COLORS[method.id]} />
                        <g className={styles.whisker}>
                          <line x1={centre} x2={centre} y1={y(value + ets.ci)} y2={y(Math.max(0, value - ets.ci))} />
                          <line x1={centre - CAP / 2} x2={centre + CAP / 2} y1={y(value + ets.ci)} y2={y(value + ets.ci)} />
                        </g>
                      </g>
                    );
                  })
                ) : (
                  <text className={styles.none} x={left(index) + groupWidth / 2} y={baseline - 12} textAnchor="middle">
                    Not seen here
                  </text>
                )}
                <text
                  className={cx(styles.groupLabel, highlight === id && styles.groupCurrent)}
                  x={left(index) + groupWidth / 2}
                  y={baseline + 20}
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            ))}

            <line className={styles.axis} x1={MARGIN.left} x2={size.width} y1={baseline} y2={baseline} />
          </svg>
        )}

        {size.width > 0 &&
          groups.map(({ id, label, ets }, index) => (
            <button
              key={id}
              type="button"
              className={styles.hit}
              style={{ left: left(index), width: groupWidth, top: MARGIN.top, height: PLOT_HEIGHT }}
              aria-label={
                ets
                  ? `${label}: ${methods.map(({ id: m, label: name }) => `${name} ${ets[m].toFixed(2)}`).join(', ')}`
                  : `${label}: not seen in ${regionLabel}`
              }
              onPointerEnter={() => setActive(id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(id)}
              onBlur={() => setActive(null)}
            />
          ))}

        {activeGroup && (
          <Tooltip
            x={left(groups.indexOf(activeGroup)) + groupWidth / 2}
            y={activeGroup.ets ? y(activeGroup.ets.varsha + activeGroup.ets.ci) : baseline - 40}
            bounds={{ width: size.width, height: HEIGHT }}
          >
            <strong>
              {activeGroup.label} · Day {lead}
            </strong>
            {activeGroup.ets ? (
              <>
                {methods.map(({ id, label }) => (
                  <div key={id}>
                    {label} {activeGroup.ets[id].toFixed(2)}
                  </div>
                ))}
                <div>±{activeGroup.ets.ci.toFixed(2)} (95%)</div>
              </>
            ) : (
              <div>Not seen in {regionLabel}</div>
            )}
          </Tooltip>
        )}
      </div>
    </ChartCard>
  );
}
