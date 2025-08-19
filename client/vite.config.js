import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxies API requests
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // NEW: Proxies requests for uploaded files
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})