import { useEffect } from 'react';

/**
 * While `active`, calls `onDismiss(reason)` on Escape ('escape') or on a pointer press outside
 * the element in `ref` ('outside').
 */
export default function useDismiss(ref, active, onDismiss) {
  useEffect(() => {
    if (!active) return undefined;
    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) onDismiss('outside');
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss('escape');
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, active, onDismiss]);
}
