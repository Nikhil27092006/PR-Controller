import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Must match the host:port the backend redirects to after the
    // GitHub OAuth round-trip (see backend/app/config/settings.py
    // FRONTEND_URL, e.g. http://localhost:3001/github-callback).
    // If these drift, the post-callback redirect lands on a port
    // where nothing is listening and the browser shows
    // "localhost refused to connect".
    port: 3001,
    open: true
  }
})
