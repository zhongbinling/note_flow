#!/bin/bash

# NoteFlow Linux Deployment Script
# Usage: ./deploy-linux.sh [DOMAIN] [--https]
# Example: ./deploy-linux.sh 139.196.210.184
# Example: ./deploy-linux.sh 139.196.210.184 --https
# Example: ./deploy-linux.sh noteflow.example.com --https

set -e

echo "========================================"
echo "  NoteFlow Linux Deployment Script"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/noteflow"
DB_NAME="noteflow"
DB_USER="noteflow_user"
DB_PASSWORD="noteflow_secure_2024"
DB_SCHEMA="noteflow"

# Get DOMAIN from argument or environment or default
DOMAIN="${1:-${DOMAIN:-noteflow.yourdomain.com}}"
# Skip flags if present
[[ "$DOMAIN" == "--https" ]] && DOMAIN="noteflow.yourdomain.com"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"

# Check for HTTPS flag
ENABLE_HTTPS=false
if [[ "$*" == *"--https"* ]]; then
  ENABLE_HTTPS=true
fi

echo -e "${GREEN}Domain/IP: ${DOMAIN}${NC}"
echo -e "${GREEN}HTTPS: ${ENABLE_HTTPS}${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run as root or with sudo${NC}"
  exit 1
fi

# Step 1: Install dependencies
echo -e "${GREEN}[1/10] Installing dependencies...${NC}"

# Check OS
if [ -f /etc/debian_version ]; then
  # Debian/Ubuntu
  apt-get update
  apt-get install -y curl git nginx certbot python3-certbot-nginx openssl
elif [ -f /etc/redhat-release ]; then
  # CentOS/RHEL
  yum install -y curl git nginx certbot python3-certbot-nginx openssl
else
  echo -e "${RED}Unsupported OS. Please install Node.js, PostgreSQL, Nginx manually.${NC}"
  exit 1
fi

# Install Node.js 20
if ! command -v node &> /dev/null; then
  echo -e "${GREEN}Installing Node.js 20...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs || yum install -y nodejs
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
  echo -e "${GREEN}Installing PostgreSQL...${NC}"
  apt-get install -y postgresql postgresql-contrib || yum install -y postgresql-server postgresql-contrib

  # Initialize PostgreSQL (CentOS)
  if [ -f /etc/redhat-release ]; then
    postgresql-setup initdb || true
  fi

  systemctl start postgresql
  systemctl enable postgresql
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
  echo -e "${GREEN}Installing PM2...${NC}"
  npm install -g pm2
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 2: Create database and schema with proper permissions
echo -e "${GREEN}[2/10] Setting up PostgreSQL database...${NC}"

# Create database
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || echo "Database already exists"

# Create user
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" 2>/dev/null || echo "User already exists"

# Grant database privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;"

# Create dedicated schema and grant permissions (fixes PostgreSQL 15+ public schema issue)
sudo -u postgres psql -d ${DB_NAME} -c "CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA} AUTHORIZATION ${DB_USER};" 2>/dev/null || echo "Schema already exists"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA ${DB_SCHEMA} TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${DB_SCHEMA} TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${DB_SCHEMA} TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA ${DB_SCHEMA} GRANT ALL ON TABLES TO ${DB_USER};"
sudo -u postgres psql -d ${DB_NAME} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA ${DB_SCHEMA} GRANT ALL ON SEQUENCES TO ${DB_USER};"

echo -e "${GREEN}✓ Database configured${NC}"

# Step 3: Clone application
echo -e "${GREEN}[3/10] Cloning application...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

if [ -d ".git" ]; then
  echo "Updating existing repository..."
  git pull origin main
else
  echo "Cloning repository..."
  git clone https://github.com/zhongbinling/note_flow.git .
fi

echo -e "${GREEN}✓ Application cloned${NC}"

# Step 4: Install dependencies
echo -e "${GREEN}[4/10] Installing npm dependencies...${NC}"
npm install
cd server && npm install && cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Configure environment
echo -e "${GREEN}[5/10] Configuring environment...${NC}"

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Determine protocol based on HTTPS
if [ "$ENABLE_HTTPS" = true ]; then
  PROTOCOL="https"
else
  PROTOCOL="http"
fi

# Create .env file with dedicated schema
cat > server/.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Frontend URL
FRONTEND_URL=${PROTOCOL}://${DOMAIN}

# CORS Origins
CORS_ORIGINS=https://${DOMAIN},http://${DOMAIN}

# Database (using dedicated schema to avoid PostgreSQL 15+ public schema permission issues)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=${DB_SCHEMA}"

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# Password Reset
RESET_TOKEN_EXPIRY=3600000
EOF

echo -e "${GREEN}✓ Environment configured${NC}"
echo -e "${YELLOW}Note: Please update SMTP settings in server/.env if you need email functionality${NC}"

# Step 6: Generate Prisma Client
echo -e "${GREEN}[6/10] Generating Prisma Client...${NC}"
cd server
npx prisma generate
cd ..

echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Step 7: Initialize database schema
echo -e "${GREEN}[7/10] Initializing database schema...${NC}"
cd server
npx prisma db push --accept-data-loss
cd ..

echo -e "${GREEN}✓ Database schema initialized${NC}"

# Step 8: Build application
echo -e "${GREEN}[8/10] Building application...${NC}"
npm run build
cd server && npm run build && cd ..

echo -e "${GREEN}✓ Application built${NC}"

# Step 9: Configure PM2
echo -e "${GREEN}[9/10] Configuring PM2...${NC}"

# Use .cjs extension to avoid ES module conflicts
cat > ecosystem.config.cjs << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'noteflow-server',
    cwd: './server',
    script: 'npm',
    args: 'run start',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    time: true
  }]
};
EOFPM2

mkdir -p logs

# Start with PM2
pm2 delete noteflow-server 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 startup
pm2 startup | tail -1 | bash || true

echo -e "${GREEN}✓ PM2 configured${NC}"

# Step 10: Configure Nginx
echo -e "${GREEN}[10/10] Configuring Nginx...${NC}"

# Configure based on HTTPS setting
if [ "$ENABLE_HTTPS" = true ]; then
  # Check if DOMAIN is an IP address (for self-signed cert) or domain name (for Let's Encrypt)
  if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${GREEN}Setting up self-signed SSL certificate for IP address...${NC}"

    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/private/noteflow.key \
      -out /etc/ssl/certs/noteflow.crt \
      -subj "/CN=${DOMAIN}" 2>/dev/null

    chmod 600 /etc/ssl/private/noteflow.key

    # Nginx HTTPS config with self-signed cert
    cat > /etc/nginx/sites-available/noteflow << EOF
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name ${DOMAIN};

    # Let's Encrypt verification path
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other requests to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL certificates
    ssl_certificate /etc/ssl/certs/noteflow.crt;
    ssl_certificate_key /etc/ssl/private/noteflow.key;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # Frontend static files
    root ${APP_DIR}/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static assets with cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # SPA routing
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
    echo -e "${GREEN}✓ Self-signed SSL certificate configured${NC}"

  else
    echo -e "${GREEN}Setting up Let's Encrypt SSL for domain...${NC}"

    # First setup HTTP for Let's Encrypt verification
    cat > /etc/nginx/sites-available/noteflow << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root ${APP_DIR}/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

    # Enable site first for Let's Encrypt
    ln -sf /etc/nginx/sites-available/noteflow /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx

    # Get Let's Encrypt certificate
    echo -e "${GREEN}Requesting Let's Encrypt certificate...${NC}"
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${ADMIN_EMAIL} || {
      echo -e "${YELLOW}Let's Encrypt failed. Falling back to HTTP.${NC}"
      ENABLE_HTTPS=false
    }

    echo -e "${GREEN}✓ Let's Encrypt SSL configured${NC}"
  fi
fi

# HTTP only configuration
if [ "$ENABLE_HTTPS" = false ]; then
  cat > /etc/nginx/sites-available/noteflow << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root ${APP_DIR}/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static assets with cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # SPA routing
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
fi

# Enable site
ln -sf /etc/nginx/sites-available/noteflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Configure firewall
echo -e "${GREEN}Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw allow 22/tcp 2>/dev/null || true
elif command -v firewall-cmd &> /dev/null; then
  firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
  firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
fi

# Verify deployment
echo -e "${GREEN}Verifying deployment...${NC}"
sleep 2

if curl -s http://localhost:3001/api/health > /dev/null; then
  echo -e "${GREEN}✓ Backend API is running${NC}"
else
  echo -e "${YELLOW}⚠ Backend API health check failed. Check logs: pm2 logs noteflow-server${NC}"
fi

if [ "$ENABLE_HTTPS" = true ]; then
  if curl -sk https://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✓ HTTPS Nginx proxy is working${NC}"
  else
    echo -e "${YELLOW}⚠ HTTPS proxy check failed.${NC}"
  fi
else
  if curl -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✓ HTTP Nginx proxy is working${NC}"
  else
    echo -e "${YELLOW}⚠ HTTP proxy check failed.${NC}"
  fi
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "========================================"
echo ""

if [ "$ENABLE_HTTPS" = true ]; then
  echo "Application URL: https://${DOMAIN}"
  echo "API URL: https://${DOMAIN}/api"
  echo "Health Check: https://${DOMAIN}/api/health"
  echo ""
  if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${YELLOW}Note: Using self-signed certificate. Browser will show security warning.${NC}"
    echo -e "${YELLOW}Click 'Advanced' -> 'Proceed to site' to continue.${NC}"
    echo ""
    echo "To renew self-signed certificate (expires in 1 year):"
    echo "  openssl req -x509 -nodes -days 365 -newkey rsa:2049 \\"
    echo "    -keyout /etc/ssl/private/noteflow.key \\"
    echo "    -out /etc/ssl/certs/noteflow.crt \\"
    echo "    -subj '/CN=${DOMAIN}' && systemctl reload nginx"
  else
    echo "SSL Certificate: Let's Encrypt (auto-renewal enabled)"
  fi
else
  echo "Application URL: http://${DOMAIN}"
  echo "API URL: http://${DOMAIN}/api"
  echo "Health Check: http://${DOMAIN}/api/health"
  echo ""
  echo "To enable HTTPS, run:"
  echo "  ./deploy-linux.sh ${DOMAIN} --https"
fi

echo ""
echo "Database Info:"
echo "  Database: ${DB_NAME}"
echo "  Schema: ${DB_SCHEMA}"
echo "  User: ${DB_USER}"
echo ""
echo "Useful commands:"
echo "  pm2 status                          - Check application status"
echo "  pm2 logs                            - View logs"
echo "  pm2 restart noteflow-server         - Restart application"
echo "  pm2 logs noteflow-server --lines 100 - View last 100 lines"
echo "  nginx -t && systemctl reload nginx  - Reload Nginx config"
echo ""
