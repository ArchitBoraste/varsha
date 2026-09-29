import Card from '../Card/Card.jsx';
import styles from './Placeholder.module.css';

/** Stand-in content for a screen that is built in a later step. */
export default function Placeholder({ heading, children }) {
  return (
    <Card className={styles.placeholder}>
      <p className={styles.eyebrow}>Coming in a later build step</p>
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.text}>{children}</p>
    </Card>
  );
}
