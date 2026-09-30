// Calls to the Varsha API server (server/index.js), proxied under /api by Vite.

const UNREACHABLE = 'The Varsha server is not reachable. Start it with "npm run dev" and try again.';

/** POSTs JSON and returns the JSON reply; failures throw an Error with a message for the user. */
export async function postJson(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(UNREACHABLE);
  }
  const reply = await response.json().catch(() => null);
  if (!response.ok || !reply) throw new Error(reply?.error ?? UNREACHABLE);
  return reply;
}
