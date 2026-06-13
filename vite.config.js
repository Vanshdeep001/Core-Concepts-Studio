import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Interview backend (backend/src/server.js)
      '/api': 'http://localhost:3001',
    },
  },
})
