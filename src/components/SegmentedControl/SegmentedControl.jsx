import styles from './SegmentedControl.module.css';

/** A group of toggle buttons of which exactly one is pressed. `options` are { id, label }. */
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={styles.option}
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
