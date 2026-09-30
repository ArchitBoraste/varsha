import { useEffect, useId, useRef, useState } from 'react';
import { cx } from '../../lib/cx.js';
import { useAppState } from '../../state/AppState.jsx';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';
import ChatMessage from './ChatMessage.jsx';
import styles from './AssistantDrawer.module.css';

export const ASSISTANT_ID = 'ask-varsha';

const SUGGESTIONS = [
  'Which Kerala districts need a red alert tomorrow, and why?',
  'Summarise today’s outlook in Hindi',
  'What changed since yesterday’s run?',
  'In which regime is the raw model worst?',
];
// After the first answer, fewer suggestions leave room for the conversation.
const LATER_SUGGESTIONS = 2;
const MAX_INPUT_HEIGHT = 120;
const MAX_QUESTION = 1000;

function Composer({ inputRef, pending, onSend }) {
  const [draft, setDraft] = useState('');
  const labelId = useId();
  const empty = !draft.trim();

  // Grows with the text up to a few lines, then scrolls.
  useEffect(() => {
    const input = inputRef.current;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [draft, inputRef]);

  const submit = () => {
    if (empty || pending) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label id={labelId} className="visually-hidden" htmlFor={`${labelId}-input`}>
        Ask a question
      </label>
      <textarea
        ref={inputRef}
        id={`${labelId}-input`}
        className={styles.input}
        rows={1}
        maxLength={MAX_QUESTION}
        value={draft}
        placeholder="Ask about any district, regime or score"
        aria-describedby={`${labelId}-hint`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <span id={`${labelId}-hint`} className="visually-hidden">
        Enter sends, Shift+Enter adds a new line
      </span>
      <button type="submit" className={styles.send} aria-label="Send" aria-disabled={empty || pending}>
        <Icon name="arrowRight" size={16} strokeWidth={1.8} />
      </button>
    </form>
  );
}

function Typing() {
  return (
    <div className={styles.typing} role="status">
      <span className="visually-hidden">Varsha Assist is answering</span>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}

/** Ask Varsha: a right-hand drawer over the page content. Closes with its X button or Escape. */
export default function AssistantDrawer() {
  const { assistantOpen, closeAssistant, chat, lead, overrides } = useAppState();
  const { messages, pending, ask, resetChat } = chat;
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (!assistantOpen) return undefined;
    const opener = document.activeElement;
    inputRef.current.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeAssistant();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Give focus back to whatever opened the drawer, if it is still on the page.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [assistantOpen, closeAssistant]);

  // Keep the newest turn in view.
  useEffect(() => {
    const log = logRef.current;
    log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  const send = (question) => ask(question, { lead, overrides });
  const asked = new Set(messages.filter(({ role }) => role === 'user').map(({ text }) => text));
  const suggestions = SUGGESTIONS.filter((text) => !asked.has(text)).slice(0, messages.length ? LATER_SUGGESTIONS : undefined);
  const lastQuestion = messages.findLast(({ role }) => role === 'user')?.text;

  return (
    <aside id={ASSISTANT_ID} aria-label="Ask Varsha" className={cx(styles.drawer, assistantOpen && styles.open)}>
      <header className={styles.header}>
        <span className={styles.avatar}>
          <Icon name="sparkle" />
        </span>
        <div className={styles.heading}>
          <h2 className={styles.title}>Ask Varsha</h2>
          <p className={styles.subtitle}>Answers from today&apos;s forecast data</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            square
            aria-label="New chat"
            title="New chat"
            onClick={() => {
              resetChat();
              inputRef.current.focus();
            }}
          >
            <Icon name="plus" size={18} strokeWidth={1.8} />
          </Button>
        )}
        <Button variant="ghost" square aria-label="Close assistant" onClick={closeAssistant}>
          <Icon name="close" size={16} strokeWidth={1.8} />
        </Button>
      </header>

      <div ref={logRef} className={styles.body}>
        <div className={styles.log} role="log" aria-live="polite" aria-label="Conversation">
          {messages.length === 0 && (
            <p className={styles.intro}>
              Ask about any district, regime or score. I answer from Varsha&apos;s forecast data and show my sources;
              a forecaster approves every warning.
            </p>
          )}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              onRetry={message.failed && index === messages.length - 1 && lastQuestion ? () => send(lastQuestion) : undefined}
            />
          ))}
          {pending && <Typing />}
        </div>

        {!pending && suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>Try asking</p>
            {suggestions.map((text) => (
              <button key={text} type="button" className={styles.suggestion} onClick={() => send(text)}>
                {text}
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <Composer inputRef={inputRef} pending={pending} onSend={send} />
        <p className={styles.note}>Varsha Assist reads forecast data only. Forecasters approve every warning.</p>
      </footer>
    </aside>
  );
}
