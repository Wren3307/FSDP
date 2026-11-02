import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The browser only ever talks to Vite. Anything under /api is forwarded to the
  // Express server, so the client never hard-codes a host or port.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
