#!/bin/bash
# Development SSL Setup - Self-signed certificates for local testing
# Use this for testing HTTPS locally before production deployment

set -e

echo "🔒 Setting up development SSL certificates for local testing"

# Create SSL directory
SSL_DIR="./ssl"
mkdir -p "$SSL_DIR"

# Generate private key
echo "🔑 Generating private key..."
openssl genrsa -out "$SSL_DIR/localhost.key" 2048

# Create certificate signing request config
echo "📝 Creating certificate configuration..."
cat > "$SSL_DIR/localhost.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Campus Nutrition
OU=Development
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = campus-nutrition.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate self-signed certificate
echo "📜 Generating self-signed certificate..."
openssl req -new -x509 -key "$SSL_DIR/localhost.key" -out "$SSL_DIR/localhost.crt" -days 365 -config "$SSL_DIR/localhost.conf" -extensions v3_req

# Create development server configuration for HTTPS
cat > "https_dev_server.py" << 'EOF'
#!/usr/bin/env python3
"""
Development HTTPS server for testing SSL locally
"""

import os
import ssl
import uvicorn
from main import app

def main():
    # SSL configuration for development
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain('./ssl/localhost.crt', './ssl/localhost.key')
    
    print("🔒 Starting HTTPS development server...")
    print("📍 https://localhost:8000")
    print("⚠️  You'll see a security warning - click 'Advanced' → 'Proceed to localhost'")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        ssl_context=ssl_context,
        reload=True,
        log_level="debug"
    )

if __name__ == "__main__":
    main()
EOF

chmod +x https_dev_server.py

# Update Vite config for HTTPS development
echo "⚙️ Creating HTTPS Vite configuration..."
cat > "frontend/vite.config.https.js" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs'
  },
  server: {
    https: {
      key: fs.readFileSync('../ssl/localhost.key'),
      cert: fs.readFileSync('../ssl/localhost.crt'),
    },
    host: true,
    port: 5173,
    proxy: {
      '/api': 'https://localhost:8000',
      '/auth': 'https://localhost:8000',
      '/foods': 'https://localhost:8000',
      '/agent': 'https://localhost:8000',
      '/static': 'https://localhost:8000',
    }
  },
  // Production build optimizations (same as before)
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'chart-vendor': ['recharts']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    cssMinify: true,
    reportCompressedSize: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'recharts']
  }
})
EOF

echo "✅ Development SSL setup complete!"
echo ""
echo "🚀 To test HTTPS locally:"
echo ""
echo "1. Start the HTTPS backend:"
echo "   cd backend"
echo "   python https_dev_server.py"
echo ""
echo "2. Start the HTTPS frontend:"
echo "   cd frontend"
echo "   npm run dev -- --config vite.config.https.js"
echo ""
echo "3. Open https://localhost:5173 in your browser"
echo "   (You'll see a security warning - click 'Advanced' → 'Proceed')"
echo ""
echo "📁 SSL files created in ./ssl/"
echo "   - localhost.key (private key)"
echo "   - localhost.crt (certificate)"
echo "   - localhost.conf (certificate config)"
echo ""
echo "⚠️  Note: Self-signed certificates will show browser warnings"
echo "   This is normal for development - use Let's Encrypt for production"