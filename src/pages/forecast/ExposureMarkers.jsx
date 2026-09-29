import { useMemo } from 'react';
import { useMap } from '../../components/IndiaMap';
import { MARKER_COLORS } from './layers.jsx';

// Half the gap between a district's triangle and square when it has both, px.
const PAIR_OFFSET = 4.5;

/** Triangles for landslide-prone districts and squares for districts with large dams. */
export default function ExposureMarkers({ forecast }) {
  const { projection } = useMap();

  const markers = useMemo(
    () =>
      Object.entries(forecast)
        .filter(([, { exposure }]) => exposure.landslideProne || exposure.dams.length > 0)
        .map(([id, { centroid, exposure }]) => {
          const [x, y] = projection(centroid);
          return { id, x, y, landslide: exposure.landslideProne, dam: exposure.dams.length > 0 };
        }),
    [forecast, projection],
  );

  return markers.map(({ id, x, y, landslide, dam }) => {
    const offset = landslide && dam ? PAIR_OFFSET : 0;
    return (
      <g key={id} stroke="#FFFFFF" strokeWidth="0.8">
        {landslide && (
          <path d={`M${x - offset} ${y - 4.5}l4 7h-8z`} fill={MARKER_COLORS.landslide} strokeLinejoin="round" />
        )}
        {dam && <rect x={x + offset - 3} y={y - 3} width="6" height="6" fill={MARKER_COLORS.dam} />}
      </g>
    );
  });
}
