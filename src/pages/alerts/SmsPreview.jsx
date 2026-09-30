import Card from '../../components/Card/Card.jsx';
import { istClock } from '../../lib/clock.js';
import { WARNINGS } from '../../lib/scales.js';
import styles from './SmsPreview.module.css';

// A leading "RED ALERT Wayanad:" style label is shown in bold, as on a phone's alert.
const HEAD_MAX = 48;

function splitHead(text) {
  const colon = text.indexOf(':');
  return colon > 0 && colon <= HEAD_MAX ? [text.slice(0, colon + 1), text.slice(colon + 1)] : ['', text];
}

/** The SMS as a district official's phone shows it, in the language being edited. */
export default function SmsPreview({ level, text, lang, time }) {
  const [head, body] = splitHead(text);
  return (
    <Card aria-labelledby="sms-preview-title" className={styles.card}>
      <h2 id="sms-preview-title" className={styles.title}>
        SMS preview
      </h2>
      <div className={styles.phone}>
        <div className={styles.bar}>
          <span className={styles.sender}>District alert</span>
          <span className={styles.from}>Varsha</span>
        </div>
        <div className={styles.thread}>
          <p className={styles.bubble} lang={lang}>
            {head && <strong style={{ color: level === 'red' ? WARNINGS.red.color : '#A15C12' }}>{head}</strong>}
            {body}
          </p>
          <span className={styles.time}>{istClock(time)}</span>
        </div>
      </div>
    </Card>
  );
}
