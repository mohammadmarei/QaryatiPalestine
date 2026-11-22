import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
  // The app calls the API on its own origin (src/api/client.ts); in development Vite forwards /api to the
  // backend. VITE_API_PROXY points it at another backend, e.g. http://localhost:3001.
  server: {
    proxy: {
      '/api': { target: process.env.VITE_API_PROXY ?? 'http://localhost:3000', changeOrigin: true },
    },
  },
})
