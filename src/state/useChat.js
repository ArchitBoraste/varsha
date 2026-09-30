import { useCallback, useMemo, useRef, useState } from 'react';
import { postJson } from '../lib/api.js';

// The server keeps the last six turns as context.
const HISTORY_TURNS = 6;

let nextId = 1;

/**
 * The Ask Varsha conversation. Messages are `{ id, role: 'user' | 'assistant', text, table?, sources?,
 * actions?, failed? }`. It lives in app state, so it survives navigation while a reply is pending.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  // Replies to a conversation that "New chat" has since cleared are dropped.
  const conversation = useRef(0);

  const ask = useCallback(
    async (question, { lead, overrides }) => {
      const current = conversation.current;
      // A question whose answer failed is left out along with the failure.
      const history = messages
        .filter((message, index) => !message.failed && !messages[index + 1]?.failed)
        .slice(-HISTORY_TURNS)
        .map(({ role, text }) => ({ role, text }));
      setMessages((list) => [...list, { id: nextId++, role: 'user', text: question }]);
      setPending(true);

      let reply;
      try {
        reply = await postJson('/api/ask', { question, history, lead, overrides });
      } catch (error) {
        reply = { text: error.message, failed: true };
      }
      if (conversation.current !== current) return;
      setMessages((list) => [...list, { id: nextId++, role: 'assistant', ...reply }]);
      setPending(false);
    },
    [messages],
  );

  const resetChat = useCallback(() => {
    conversation.current += 1;
    setMessages([]);
    setPending(false);
  }, []);

  return useMemo(() => ({ messages, pending, ask, resetChat }), [messages, pending, ask, resetChat]);
}
