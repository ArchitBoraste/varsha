import { useId, useMemo } from 'react';
import { ramp } from '../../lib/color.js';
import { MARKER_COLORS } from '../../lib/layers.js';
import { SALIENCY_STOPS } from '../../lib/scales.js';
import { useDataset } from '../../state/useDataset.js';
import { cellRect, useMap, vectorEnds } from '../IndiaMap';

// Cells fainter than this are not drawn.
const MIN_SALIENCY = 0.04;
// Arrow length along the ground, degrees per m/s, and the slowest wind drawn.
const ARROW_SCALE = 0.08;
const MIN_SPEED = 2;

/** Saliency heatmap (blurred grid cells) and forecast 850 hPa wind arrows for a lead day. */
export default function SaliencyOverlay({ lead }) {
  const { data } = useDataset('saliency.json');
  const { projection } = useMap();
  const id = useId().replace(/:/g, '');

  const cells = useMemo(() => {
    if (!data) return [];
    const { lon0, lat0, step } = data.grid;
    return data.days[lead - 1].saliency.flatMap((row, j) =>
      row.flatMap((value, i) => {
        if (value < MIN_SALIENCY) return [];
        const lon = lon0 + i * step;
        const lat = lat0 + j * step;
        return [{ key: `${lon},${lat}`, value, ...cellRect(projection, lon, lat, step) }];
      }),
    );
  }, [data, lead, projection]);

  const arrows = useMemo(() => {
    if (!data) return [];
    return data.days[lead - 1].wind
      .filter(([, , u, v]) => Math.hypot(u, v) >= MIN_SPEED)
      .map(([lon, lat, u, v]) => ({ key: `${lon},${lat}`, ends: vectorEnds(projection, [lon, lat], [u, v], ARROW_SCALE) }));
  }, [data, lead, projection]);

  return (
    <>
      <defs>
        <filter id={`${id}-blur`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <marker id={`${id}-head`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L6 3L0 6z" fill={MARKER_COLORS.wind} />
        </marker>
      </defs>
      <g filter={`url(#${id}-blur)`}>
        {cells.map(({ key, value, x, y, width, height }) => (
          <rect key={key} x={x} y={y} width={width} height={height} fill={ramp(SALIENCY_STOPS, value)} opacity={value} />
        ))}
      </g>
      <g stroke={MARKER_COLORS.wind} strokeWidth="1.2" strokeLinecap="round" opacity="0.75">
        {arrows.map(({ key, ends: [[x1, y1], [x2, y2]] }) => (
          <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={`url(#${id}-head)`} />
        ))}
      </g>
    </>
  );
}
