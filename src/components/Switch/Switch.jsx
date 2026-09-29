import styles from './Switch.module.css';

/** On/off switch whose children are its label. */
export default function Switch({ checked, onChange, children }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.switch} onClick={() => onChange(!checked)}>
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      {children}
    </button>
  );
}
