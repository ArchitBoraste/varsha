import styles from './DistrictTooltip.module.css';

/** Map tooltip content: the district and its state, a few lines, and the forecaster's override if any. */
export default function DistrictTooltip({ name, state, lines, override }) {
  return (
    <>
      <strong>{name}</strong>, {state}
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      {override && <div className={styles.override}>Overridden: {override.reason}</div>}
    </>
  );
}
