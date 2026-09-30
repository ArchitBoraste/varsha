import { geoPath } from 'd3-geo';
import { memo, useId, useMemo, useState } from 'react';
import { cx } from '../../lib/cx.js';
import useElementSize from '../../lib/useElementSize.js';
import Tooltip from '../Tooltip/Tooltip.jsx';
import CompareDivider from './CompareDivider.jsx';
import { MapContext } from './mapContext.js';
import { fitProjection } from './projection.js';
import styles from './IndiaMap.module.css';

const NO_BORDERS = [];
const noDataFill = () => '#E4E9E3';
// Room kept to the right of a district for its name label before it flips to the left, px.
const LABEL_ROOM = 130;

// Geometry and fills are memoised separately, so hovering or recolouring never rebuilds paths.
const DistrictLayer = memo(function DistrictLayer({ shapes, fills }) {
  return shapes.map(({ id, d }, index) => <path key={id} d={d} fill={fills[index]} data-id={id} />);
});

const districtIdAt = (event) => event.target.getAttribute('data-id');

function labelStyle(path, feature, width) {
  const [[x0, y0], [x1, y1]] = path.bounds(feature);
  const top = (y0 + y1) / 2;
  return x1 + LABEL_ROOM > width ? { right: width - x0 + 8, top } : { left: x1 + 8, top };
}

/**
 * District map of India, drawn as SVG with d3-geo and fitted to its box.
 *
 * @param {object[]} features   District GeoJSON features with { id, district, state } properties.
 * @param {object[]} [borders]  State outline features, drawn above the districts.
 * @param {Function} [getFill]  feature => colour. Memoise it: fills are recomputed when it changes.
 * @param {Function} [getTooltip] feature => tooltip content shown on hover.
 * @param {string}   [selectedId] District outlined as selected.
 * @param {Function} [onSelect] id => void, called when a district is clicked.
 * @param {string}   [highlightId] District outlined as if hovered, e.g. from a linked map.
 * @param {Function} [onHover]  id|null => void, called when the hovered district changes.
 * @param {number|string} [width] Size of the map box (px or any CSS length); fills its parent by default.
 * @param {number|string} [height]
 * @param {object}   [compare]  { leftFill, rightFill, leftLabel, rightLabel }: two colourings
 *                              split by a draggable divider. Replaces getFill.
 * @param {object|number[][]} [fitTo] What to fit the projection to: GeoJSON (e.g. one state) or a
 *                              [[west, south], [east, north]] box; defaults to `features`. Districts
 *                              outside it are still drawn, so clip the map's container.
 * @param {string}   [label]    Accessible name of the map.
 * @param {React.ReactNode} [children] Overlays drawn in the projected SVG space; use useMap().
 */
export default function IndiaMap({
  features,
  borders = NO_BORDERS,
  getFill,
  getTooltip,
  selectedId,
  onSelect,
  highlightId,
  onHover,
  width = '100%',
  height = '100%',
  compare,
  fitTo,
  label = 'Map of India by district',
  children,
}) {
  const [boxRef, size] = useElementSize();
  const [hover, setHover] = useState(null);
  const [split, setSplit] = useState(0.5);
  const clipId = useId().replace(/:/g, '');

  const projection = useMemo(
    () =>
      size.width && size.height
        ? fitProjection(fitTo ?? { type: 'FeatureCollection', features }, size.width, size.height)
        : null,
    [fitTo, features, size.width, size.height],
  );
  const path = useMemo(() => projection && geoPath(projection), [projection]);
  const shapes = useMemo(
    () => (path ? features.map((feature) => ({ id: feature.properties.id, d: path(feature), feature })) : []),
    [features, path],
  );
  const shapeById = useMemo(() => new Map(shapes.map((shape) => [shape.id, shape])), [shapes]);
  const borderShapes = useMemo(
    () => (path ? borders.map((border) => ({ key: border.properties.state, d: path(border) })) : []),
    [borders, path],
  );

  const leftFill = compare?.leftFill ?? getFill ?? noDataFill;
  const rightFill = compare?.rightFill;
  const fills = useMemo(() => shapes.map((shape) => leftFill(shape.feature)), [shapes, leftFill]);
  const rightFills = useMemo(() => rightFill && shapes.map((shape) => rightFill(shape.feature)), [shapes, rightFill]);

  const map = useMemo(
    () => projection && { projection, path, width: size.width, height: size.height },
    [projection, path, size.width, size.height],
  );

  const hovered = hover && shapeById.get(hover.id);
  const outlined = hovered ?? (highlightId && shapeById.get(highlightId));
  const selected = selectedId && shapeById.get(selectedId);

  const updateHover = (next) => {
    if ((next?.id ?? null) !== (hover?.id ?? null)) onHover?.(next?.id ?? null);
    setHover(next);
  };

  const handlePointerMove = (event) => {
    const id = districtIdAt(event);
    if (!id) {
      updateHover(null);
      return;
    }
    const box = boxRef.current.getBoundingClientRect();
    updateHover({ id, x: event.clientX - box.left, y: event.clientY - box.top });
  };

  const handleClick = (event) => {
    const id = districtIdAt(event);
    if (id) onSelect(id);
  };

  const splitX = split * size.width;

  return (
    <div ref={boxRef} className={styles.map} style={{ width, height }}>
      {map && (
        <svg className={styles.svg} width={size.width} height={size.height} role="img" aria-label={label}>
          {compare && (
            <defs>
              <clipPath id={`${clipId}-left`}>
                <rect width={splitX} height={size.height} />
              </clipPath>
              <clipPath id={`${clipId}-right`}>
                <rect x={splitX} width={size.width - splitX} height={size.height} />
              </clipPath>
            </defs>
          )}

          {/* Mouse-only shortcut: districts are also reachable from search and the district table. */}
          <g
            className={cx(styles.districts, onSelect && styles.selectable)}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => updateHover(null)}
            onClick={onSelect && handleClick}
          >
            {compare ? (
              <>
                <g clipPath={`url(#${clipId}-left)`}>
                  <DistrictLayer shapes={shapes} fills={fills} />
                </g>
                <g clipPath={`url(#${clipId}-right)`}>
                  <DistrictLayer shapes={shapes} fills={rightFills} />
                </g>
              </>
            ) : (
              <DistrictLayer shapes={shapes} fills={fills} />
            )}
          </g>

          <g className={styles.overlays}>
            <MapContext.Provider value={map}>{children}</MapContext.Provider>
          </g>

          <g className={styles.borders}>
            {borderShapes.map(({ key, d }) => (
              <path key={key} d={d} />
            ))}
          </g>

          {outlined && <path className={styles.hover} d={outlined.d} />}

          {selected && (
            <g className={styles.selection}>
              <path className={styles.glow} d={selected.d} />
              <path className={styles.outline} d={selected.d} />
            </g>
          )}
        </svg>
      )}

      {map && selected && (
        <span className={styles.selectedLabel} style={labelStyle(path, selected.feature, size.width)} aria-hidden="true">
          {selected.feature.properties.district}
        </span>
      )}

      {map && compare && (
        <CompareDivider value={split} onChange={setSplit} leftLabel={compare.leftLabel} rightLabel={compare.rightLabel} />
      )}

      {hovered && getTooltip && (
        <Tooltip x={hover.x} y={hover.y} bounds={size}>
          {getTooltip(hovered.feature)}
        </Tooltip>
      )}
    </div>
  );
}
