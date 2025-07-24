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
      '/api': process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
      '/auth': process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
      '/foods': process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
      '/agent': process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
      '/static': process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
    }
  },
  // Production build optimizations
  build: {
    // Generate source maps for debugging in production
    sourcemap: false,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'chart-vendor': ['recharts']
        },
        // Use content-based hashing for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    // Optimize CSS
    cssMinify: true,
    // Report compressed bundle sizes
    reportCompressedSize: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'recharts']
  }
})
