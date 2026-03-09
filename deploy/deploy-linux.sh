#!/bin/bash

# NoteFlow Linux Deployment Script
# Usage: ./deploy-linux.sh

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
DOMAIN="${DOMAIN:-noteflow.yourdomain.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run as root or with sudo${NC}"
  exit 1
fi

# Step 1: Install dependencies
echo -e "${GREEN}[1/8] Installing dependencies...${NC}"

# Check OS
if [ -f /etc/debian_version ]; then
  # Debian/Ubuntu
  apt-get update
  apt-get install -y curl git nginx certbot python3-certbot-nginx
elif [ -f /etc/redhat-release ]; then
  # CentOS/RHEL
  yum install -y curl git nginx certbot python3-certbot-nginx
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

# Step 2: Create database
echo -e "${GREEN}[2/8] Setting up PostgreSQL database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE noteflow;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER noteflow_user WITH PASSWORD 'noteflow_secure_2024';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;"
sudo -u postgres psql -c "ALTER USER noteflow_user CREATEDB;"

echo -e "${GREEN}✓ Database configured${NC}"

# Step 3: Clone application
echo -e "${GREEN}[3/8] Cloning application...${NC}"
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
echo -e "${GREEN}[4/8] Installing npm dependencies...${NC}"
npm install
cd server && npm install && cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Configure environment
echo -e "${GREEN}[5/8] Configuring environment...${NC}"

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Create .env file
cat > server/.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Frontend URL
FRONTEND_URL=https://${DOMAIN}

# CORS Origins
CORS_ORIGINS=https://${DOMAIN},http://${DOMAIN}

# Database
DATABASE_URL="postgresql://noteflow_user:noteflow_secure_2024@localhost:5432/noteflow?schema=public"

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

# Step 6: Initialize database
echo -e "${GREEN}[6/8] Initializing database...${NC}"
cd server
npx prisma generate
npx prisma migrate deploy || npx prisma db push
cd ..

echo -e "${GREEN}✓ Database initialized${NC}"

# Step 7: Build application
echo -e "${GREEN}[7/8] Building application...${NC}"
npm run build
cd server && npm run build && cd ..

echo -e "${GREEN}✓ Application built${NC}"

# Step 8: Configure PM2
echo -e "${GREEN}[8/8] Configuring PM2...${NC}"

cat > ecosystem.config.js << EOF
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
EOF

mkdir -p logs

# Start with PM2
pm2 delete noteflow-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
pm2 startup | tail -1 | bash || true

echo -e "${GREEN}✓ PM2 configured${NC}"

# Configure Nginx
echo -e "${GREEN}Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/noteflow << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend static files
    root ${APP_DIR}/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

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
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/noteflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Setup SSL with Let's Encrypt (optional)
if [ "$1" == "--ssl" ]; then
  echo -e "${GREEN}Setting up SSL certificate...${NC}"
  certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${ADMIN_EMAIL}
  echo -e "${GREEN}✓ SSL configured${NC}"
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "Application URL: http://${DOMAIN}"
echo "API URL: http://${DOMAIN}/api"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart application"
echo ""
echo "To enable HTTPS, run: sudo certbot --nginx -d ${DOMAIN}"
echo ""
