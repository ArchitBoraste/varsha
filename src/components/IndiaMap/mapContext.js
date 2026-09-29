import { createContext, useContext } from 'react';

export const MapContext = createContext(null);

/**
 * For overlays rendered as IndiaMap children: `{ projection, path, width, height }`, where
 * `projection([lon, lat])` gives SVG coordinates and `path` is the matching d3 geoPath.
 */
export function useMap() {
  const map = useContext(MapContext);
  if (!map) throw new Error('useMap must be used inside an IndiaMap');
  return map;
}
