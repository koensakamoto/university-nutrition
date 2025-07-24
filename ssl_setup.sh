#!/bin/bash
# SSL Certificate Setup Script for Campus Nutrition App
# This script sets up HTTPS using Let's Encrypt (free SSL certificates)

set -e

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

echo "🔒 Setting up SSL certificates for Campus Nutrition App"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)" 
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    apt install -y nginx
fi

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt install -y certbot python3-certbot-nginx
fi

# Create nginx configuration for the app
echo "⚙️ Creating nginx configuration..."
cat > "$NGINX_CONFIG_DIR/campus-nutrition" << EOF
# Campus Nutrition App - Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (certbot will add certificates here)
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend (React app)
    location / {
        root /var/www/campus-nutrition/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Auth endpoints
    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Other backend endpoints
    location ~ ^/(foods|agent|static)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
EOF

# Enable the site
echo "🔗 Enabling nginx site..."
ln -sf "$NGINX_CONFIG_DIR/campus-nutrition" "$NGINX_ENABLED_DIR/"

# Remove default nginx site if it exists
if [ -f "$NGINX_ENABLED_DIR/default" ]; then
    rm "$NGINX_ENABLED_DIR/default"
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

# Open firewall ports
echo "🔥 Configuring firewall..."
ufw allow 'Nginx Full'
ufw --force enable

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate from Let's Encrypt..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

# Set up auto-renewal
echo "⏰ Setting up automatic certificate renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test auto-renewal
echo "🧪 Testing certificate auto-renewal..."
certbot renew --dry-run

echo "✅ SSL setup complete!"
echo ""
echo "🎉 Your Campus Nutrition app is now available at:"
echo "   https://$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with the new HTTPS URLs:"
echo "   FRONTEND_URL=https://$DOMAIN"
echo "   BACKEND_URL=https://$DOMAIN"
echo ""
echo "2. Deploy your application files to /var/www/campus-nutrition/"
echo ""
echo "3. Start your backend server:"
echo "   cd /var/www/campus-nutrition/backend"
echo "   python production_server.py"
echo ""
echo "📊 Certificate status:"
certbot certificates
EOF