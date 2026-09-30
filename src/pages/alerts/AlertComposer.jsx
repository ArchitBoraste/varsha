import { useId, useRef, useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import OverrideChip from '../../components/OverrideChip/OverrideChip.jsx';
import WarningBadge from '../../components/WarningBadge/WarningBadge.jsx';
import { smsSegments } from '../../lib/alertText.js';
import { postJson } from '../../lib/api.js';
import { istClock, scenarioNow } from '../../lib/clock.js';
import { cx } from '../../lib/cx.js';
import { formatPeople, formatPercent } from '../../lib/format.js';
import { WARNINGS } from '../../lib/scales.js';
import { useAppState } from '../../state/AppState.jsx';
import DeliveryTimeline from './DeliveryTimeline.jsx';
import styles from './AlertComposer.module.css';

const LANGUAGES = [
  { id: 'en', label: 'English', lang: 'en' },
  { id: 'hi', label: 'हिन्दी', lang: 'hi' },
  { id: 'ml', label: 'മലയാളം', lang: 'ml' },
];

const CHANNELS = [
  { id: 'sachet', label: () => 'SACHET feed (CAP 1.2)', checked: true },
  { id: 'sms', label: () => 'SMS to district officials', checked: true },
  { id: 'email', label: (alert) => `Email to ${alert.state} SDMA`, checked: true },
  { id: 'webhook', label: () => 'Webhook for partner apps', checked: false },
];

const STATUS_PILLS = {
  draft: { label: 'Draft · needs approval', className: styles.pillDraft },
  sent: { label: 'Approved & sent', className: styles.pillSent },
  rejected: { label: 'Rejected', className: styles.pillRejected },
};

function Fields({ alert }) {
  const fields = [
    ['Event', alert.event],
    ['Valid', `24 h ending 08:30 IST, ${alert.validity.label}`],
    [`Chance ≥ ${alert.chance.threshold} mm`, formatPercent(alert.chance.p)],
    ['Varsha rainfall', `${alert.rainfall.mm} mm (${alert.rainfall.range[0]}–${alert.rainfall.range[1]})`],
    ['Regime', `${alert.regime.label} · ${formatPercent(alert.regime.share)}`],
    ['Exposure', `${formatPeople(alert.exposure.population)} people`],
  ];
  return (
    <dl className={styles.fields}>
      {fields.map(([label, value]) => (
        <div key={label} className={styles.field}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function translationNote(lang, translation) {
  if (lang !== 'ml') return 'Translations drafted by Varsha Assist';
  if (translation.status === 'loading') return 'Varsha Assist is drafting the Malayalam…';
  if (translation.status === 'unavailable') return 'Malayalam draft unavailable · English shown';
  return 'Translations drafted by Varsha Assist';
}

function SmsCounter({ text }) {
  const { encoding, length, single, segments } = smsSegments(text);
  return (
    <span className={cx(styles.counter, segments > 1 && styles.counterMulti)} aria-live="polite">
      {segments > 1 ? `${length} characters` : `${length} / ${single}`} · {encoding} · {segments === 1 ? '1 SMS' : `${segments} SMS`}
    </span>
  );
}

/** The selected alert: its facts, the message in three languages, the channels and the decision. */
export default function AlertComposer({ alert, runInit, lang, onLang, texts, translation, hasMalayalam }) {
  const { overrides, editText, markSent, markRejected, restoreDraft, showToast } = useAppState();
  const [editing, setEditing] = useState(false);
  const [channels, setChannels] = useState(() => CHANNELS.filter(({ checked }) => checked).map(({ id }) => id));
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const messageRef = useRef(null);
  const ids = useId();

  const { status, record } = alert;
  const isDraft = status === 'draft';
  const text = texts[lang];
  const loadingMalayalam = lang === 'ml' && translation.status === 'loading';
  const canSend = isDraft && channels.length > 0 && !sending && texts.en.message.trim() !== '';

  const toggleChannel = (id) =>
    setChannels((current) => (current.includes(id) ? current.filter((c) => c !== id) : CHANNELS.map((c) => c.id).filter((c) => c === id || current.includes(c))));

  const toggleEditing = () => {
    setEditing((value) => !value);
    if (!editing) requestAnimationFrame(() => messageRef.current?.focus());
  };

  const approve = async () => {
    if (!canSend) return;
    setSending(true);
    setSendError('');
    try {
      const receipt = await postJson(`/api/alerts/${alert.id}/send`, {
        lead: alert.lead,
        channels,
        overrides,
        texts: { en: texts.en, hi: texts.hi, ...(hasMalayalam && { ml: texts.ml }) },
      });
      markSent(alert.id, receipt);
      setEditing(false);
      showToast(`${WARNINGS[alert.level].label} alert for ${alert.name} approved and sent`);
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  };

  const reject = () => {
    markRejected(alert.id, scenarioNow(runInit));
    setEditing(false);
    showToast(`Alert for ${alert.name} rejected`);
  };

  const pill = STATUS_PILLS[status];

  return (
    <section aria-labelledby={`${ids}-title`} className={styles.composer}>
      <div className={styles.body}>
        <div className={styles.head}>
          <WarningBadge level={alert.level} showAction />
          <h2 id={`${ids}-title`} className={styles.name}>
            {alert.name}, {alert.state}
          </h2>
          {alert.override && <OverrideChip override={alert.override} size="sm" />}
          <span className={cx(styles.pill, pill.className)}>{pill.label}</span>
        </div>

        <Fields alert={alert} />

        <div className={styles.tabs}>
          <div role="group" aria-label="Message language" className={styles.tabList}>
            {LANGUAGES.map((language) => (
              <button
                key={language.id}
                type="button"
                lang={language.lang}
                className={styles.tab}
                aria-pressed={language.id === lang}
                onClick={() => onLang(language.id)}
              >
                {language.label}
              </button>
            ))}
          </div>
          <span className={styles.tabNote}>{translationNote(lang, translation)}</span>
        </div>

        <label className={styles.message}>
          <span className={styles.label}>Message</span>
          <textarea
            ref={messageRef}
            rows={4}
            lang={lang}
            className={cx(styles.textarea, loadingMalayalam && styles.shimmer)}
            value={loadingMalayalam ? '' : text.message}
            readOnly={!editing || !isDraft}
            aria-busy={loadingMalayalam}
            onChange={(event) => editText(alert.id, lang, 'message', event.target.value)}
          />
        </label>

        {/* Once sent, the phone preview shows the SMS and the delivery takes its place. */}
        {status === 'sent' ? (
          <DeliveryTimeline alert={alert} receipt={record.receipt} />
        ) : (
          <>
            <label className={styles.message}>
              <span className={styles.labelRow}>
                <span className={styles.label}>SMS text</span>
                <SmsCounter text={text.sms} />
              </span>
              <textarea
                rows={3}
                lang={lang}
                className={cx(styles.textarea, styles.smsText, loadingMalayalam && styles.shimmer)}
                value={loadingMalayalam ? '' : text.sms}
                readOnly={!editing || !isDraft}
                aria-busy={loadingMalayalam}
                onChange={(event) => editText(alert.id, lang, 'sms', event.target.value)}
              />
            </label>

            <fieldset className={styles.channels} disabled={!isDraft}>
              <legend className={styles.label}>Send to</legend>
              <div className={styles.channelGrid}>
                {CHANNELS.map((channel) => (
                  <label key={channel.id} className={styles.channel}>
                    <input type="checkbox" checked={channels.includes(channel.id)} onChange={() => toggleChannel(channel.id)} />
                    {channel.label(alert)}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {sendError && (
          <p role="alert" className={styles.error}>
            Not sent: {sendError}
          </p>
        )}
      </div>

      {isDraft && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            className={styles.approve}
            aria-disabled={!canSend}
            title={channels.length ? undefined : 'Choose at least one channel'}
            onClick={approve}
          >
            {sending ? 'Sending…' : 'Approve and send'}
          </Button>
          <Button className={styles.secondary} aria-pressed={editing} onClick={toggleEditing}>
            {editing ? 'Done editing' : 'Edit'}
          </Button>
          <Button className={cx(styles.secondary, styles.reject)} onClick={reject}>
            Reject
          </Button>
          <span className={styles.footNote}>Every sent alert is logged with the approver</span>
        </div>
      )}
      {status === 'rejected' && (
        <div className={styles.actions}>
          <Button className={styles.secondary} onClick={() => restoreDraft(alert.id)}>
            Restore draft
          </Button>
          <span className={styles.footNote}>
            Rejected by {record.by} · {istClock(record.at)} IST
          </span>
        </div>
      )}
    </section>
  );
}
