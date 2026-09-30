import { useRef } from 'react';
import { cx } from '../../lib/cx.js';
import styles from './DayScrubber.module.css';

// Dots are inset by half their width so the first and last sit inside the track.
const INSET = 8;

/** Slider over the case days: drag, click or use the arrow keys (Home and End jump to the ends). */
export default function DayScrubber({ days, index, onChange }) {
  const trackRef = useRef(null);
  const last = days.length - 1;
  const at = (i) => `calc(${INSET}px + (100% - ${2 * INSET}px) * ${last ? i / last : 0})`;

  const pick = (clientX) => {
    const box = trackRef.current.getBoundingClientRect();
    const share = (clientX - box.left - INSET) / (box.width - 2 * INSET);
    onChange(Math.min(last, Math.max(0, Math.round(share * last))));
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pick(event.clientX);
  };

  const handlePointerMove = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event.clientX);
  };

  const handleKeyDown = (event) => {
    const next = { ArrowLeft: index - 1, ArrowDown: index - 1, ArrowRight: index + 1, ArrowUp: index + 1, Home: 0, End: last }[
      event.key
    ];
    if (next === undefined) return;
    event.preventDefault();
    onChange(Math.min(last, Math.max(0, next)));
  };

  return (
    <div
      ref={trackRef}
      className={styles.scrubber}
      role="slider"
      tabIndex={0}
      aria-label="Case day"
      aria-valuemin={1}
      aria-valuemax={days.length}
      aria-valuenow={index + 1}
      aria-valuetext={`${days[index].label}, day ${index + 1} of ${days.length}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.track} />
      <span className={styles.fill} style={{ width: `calc(${at(index)} - ${INSET}px)` }} />
      {days.map((day, i) => (
        <span key={day.date}>
          <span
            className={cx(styles.dot, i < index && styles.past, i === index && styles.current)}
            style={{ left: at(i) }}
          />
          <span
            className={cx(styles.label, i === index && styles.currentLabel)}
            style={{ left: at(i), transform: `translateX(${i === 0 ? '-8px' : i === last ? 'calc(-100% + 8px)' : '-50%'})` }}
          >
            {day.label}
          </span>
        </span>
      ))}
    </div>
  );
}
