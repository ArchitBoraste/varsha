import { useRef } from 'react';
import { cx } from '../../lib/cx.js';
import Icon from '../Icon/Icon.jsx';
import styles from './CompareDivider.module.css';

const MIN = 0.02;
const MAX = 0.98;
// Hide a side's label when the divider leaves it too little room.
const LABEL_ROOM = 0.22;

const clamp = (value) => Math.min(MAX, Math.max(MIN, value));

/** Draggable vertical divider for IndiaMap's compare mode; `value` is its position from 0 to 1. */
export default function CompareDivider({ value, onChange, leftLabel, rightLabel }) {
  const overlayRef = useRef(null);

  const moveTo = (clientX) => {
    const box = overlayRef.current.getBoundingClientRect();
    onChange(clamp((clientX - box.left) / box.width));
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };

  const handlePointerMove = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) moveTo(event.clientX);
  };

  const handleKeyDown = (event) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    const next = { ArrowLeft: value - step, ArrowRight: value + step, Home: MIN, End: MAX }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange(clamp(next));
  };

  const percent = Math.round(value * 100);

  return (
    <div ref={overlayRef} className={styles.overlay}>
      {value > LABEL_ROOM && (
        <span className={cx(styles.chip, styles.leftChip)} style={{ right: `calc(${100 - value * 100}% + 12px)` }}>
          {leftLabel}
        </span>
      )}
      {value < 1 - LABEL_ROOM && (
        <span className={cx(styles.chip, styles.rightChip)} style={{ left: `calc(${value * 100}% + 12px)` }}>
          {rightLabel}
        </span>
      )}
      <div
        className={styles.divider}
        style={{ left: `${value * 100}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${leftLabel} on the left, ${rightLabel} on the right`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}% ${leftLabel}`}
          className={styles.handle}
          onKeyDown={handleKeyDown}
        >
          <Icon name="swap" size={18} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
