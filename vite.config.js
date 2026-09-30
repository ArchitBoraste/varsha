import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Only API_PORT is read here, to find the Ask Varsha API server (server/index.js); no key reaches the client.
  const { API_PORT = '8787' } = loadEnv(mode, process.cwd(), '');
  const api = { '/api': `http://localhost:${API_PORT}` };

  return {
    plugins: [react()],
    // 5173 is often taken by Docker on the demo machine.
    server: { port: 5180, strictPort: true, proxy: api },
    preview: { proxy: api },
  };
});
