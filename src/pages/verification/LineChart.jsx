import { useState } from 'react';
import Tooltip from '../../components/Tooltip/Tooltip.jsx';
import { linearScale, points } from '../../lib/chart.js';
import useElementSize from '../../lib/useElementSize.js';
import { LINE_COLORS } from './palette.js';
import styles from './LineChart.module.css';

const MARGIN = { top: 12, right: 76, bottom: 38, left: 44 };
// Minimum distance between labels in the right-hand gutter, px.
const LABEL_GAP = 14;

/** Gutter labels at their lines' heights, each pushed down just enough to clear the one above. */
function spreadLabels(labels) {
  const placed = [...labels].sort((a, b) => a.y - b.y);
  placed.forEach((label, i) => {
    if (i > 0) label.y = Math.max(label.y, placed[i - 1].y + LABEL_GAP);
  });
  return placed;
}

/**
 * Raw against Varsha on a 0–1 score axis, with a reference line (`diagonal` or a horizontal
 * `level`), direct labels, and a hover or focus readout for each x value.
 *
 * @param {number[]} xs        x value of each point, in `xDomain`
 * @param {object[]} series    [{ id, label, values }], raw first
 * @param {object[]} xTicks    [{ value, label }]
 * @param {Function} describe  index => { title, lines } for the readout
 */
export default function LineChart({ height, xs, xDomain, xTicks, xTitle, yTitle, series, reference, maxPlotWidth, describe, label }) {
  const [boxRef, size] = useElementSize();
  const [active, setActive] = useState(null);

  const plotHeight = height - MARGIN.top - MARGIN.bottom;
  const plotWidth = Math.max(0, Math.min(size.width - MARGIN.left - MARGIN.right, maxPlotWidth ?? Infinity));
  const x = linearScale(xDomain, [MARGIN.left, MARGIN.left + plotWidth]);
  const y = linearScale([0, 1], [MARGIN.top + plotHeight, MARGIN.top]);
  const right = MARGIN.left + plotWidth;
  const bottom = MARGIN.top + plotHeight;
  const labels = spreadLabels([
    ...series.map(({ id, label: text, values }) => ({
      key: id,
      text,
      y: y(values.at(-1)),
      className: id === 'varsha' ? styles.labelStrong : styles.label,
    })),
    ...(reference.type === 'level' ? [{ key: 'level', text: reference.label, y: y(reference.value), className: styles.levelLabel }] : []),
  ]);
  // Each readout column reaches halfway to the neighbouring x values.
  const columns = xs.map((value, i) => {
    const from = i === 0 ? MARGIN.left : (x(xs[i - 1]) + x(value)) / 2;
    const to = i === xs.length - 1 ? right : (x(value) + x(xs[i + 1])) / 2;
    return { from, to };
  });

  return (
    <div ref={boxRef} className={styles.chart} style={{ height }}>
      {size.width > 0 && (
        <svg width={size.width} height={height} aria-hidden="true" className={styles.svg}>
          {[0, 0.5, 1].map((tick) => (
            <g key={tick}>
              {tick > 0 && <line className={styles.grid} x1={MARGIN.left} x2={right} y1={y(tick)} y2={y(tick)} />}
              <text className={styles.tick} x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
            <text key={tick.value} className={styles.tick} x={x(tick.value)} y={bottom + 16} textAnchor="middle">
              {tick.label}
            </text>
          ))}
          <text className={styles.axisTitle} x={MARGIN.left + plotWidth / 2} y={height - 4} textAnchor="middle">
            {xTitle}
          </text>
          <text
            className={styles.axisTitle}
            x={14}
            y={MARGIN.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${MARGIN.top + plotHeight / 2})`}
          >
            {yTitle}
          </text>
          <line className={styles.axis} x1={MARGIN.left} x2={right} y1={bottom} y2={bottom} />
          <line className={styles.axis} x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={bottom} />

          {reference.type === 'diagonal' ? (
            <line className={styles.reference} x1={x(xDomain[0])} y1={y(0)} x2={x(xDomain[1])} y2={y(1)} />
          ) : (
            <line
              className={styles.level}
              stroke={LINE_COLORS.useful}
              x1={MARGIN.left}
              x2={right}
              y1={y(reference.value)}
              y2={y(reference.value)}
            />
          )}

          {active !== null && <line className={styles.guide} x1={x(xs[active])} x2={x(xs[active])} y1={MARGIN.top} y2={bottom} />}

          {series.map(({ id, values }) => (
            <g key={id}>
              <polyline
                className={styles.line}
                stroke={LINE_COLORS[id]}
                strokeWidth={id === 'varsha' ? 2.2 : 2}
                points={points(values.map((value, i) => [x(xs[i]), y(value)]))}
              />
              {values.map((value, i) => (
                <circle
                  key={xs[i]}
                  className={styles.point}
                  cx={x(xs[i])}
                  cy={y(value)}
                  r={i === active ? 5 : 3.5}
                  fill={LINE_COLORS[id]}
                />
              ))}
            </g>
          ))}

          {labels.map(({ key, text, y: labelY, className }) => (
            <text key={key} className={className} x={right + 10} y={labelY + 4}>
              {text}
            </text>
          ))}
        </svg>
      )}

      {size.width > 0 &&
        columns.map(({ from, to }, i) => (
          <button
            key={xs[i]}
            type="button"
            className={styles.hit}
            style={{ left: from, width: to - from, top: MARGIN.top, height: plotHeight }}
            aria-label={`${label}, ${describe(i).title}: ${describe(i).lines.join(', ')}`}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          />
        ))}

      {active !== null && (
        <Tooltip
          x={x(xs[active])}
          y={Math.min(...series.map(({ values }) => y(values[active])))}
          bounds={{ width: size.width, height }}
        >
          <strong>{describe(active).title}</strong>
          {describe(active).lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </Tooltip>
      )}
    </div>
  );
}
