import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs'
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/auth': 'http://127.0.0.1:8000',
      '/foods': 'http://127.0.0.1:8000',
      '/agent': 'http://127.0.0.1:8000',
      '/static': 'http://127.0.0.1:8000',
    }
  }
})
