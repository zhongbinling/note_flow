# macOS Deployment Guide

This guide walks you through deploying NoteFlow on macOS.

## Table of Contents

- [Requirements](#requirements)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Process Management with PM2](#process-management-with-pm2)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [launchd Service Management](#launchd-service-management)
- [Troubleshooting](#troubleshooting)

## Requirements

- macOS 12 (Monterey) or higher
- Node.js 18.0.0 or higher
- PostgreSQL 14+ (optional, SQLite by default)
- Git

## Development Setup

### 1. Install Homebrew (if not installed)

Homebrew is a popular package manager for macOS.

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

### 2. Install Node.js

**Method 1: Using Homebrew (Recommended)**

```bash
brew install node@20

# Add to PATH if needed
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
node --version
npm --version
```

**Method 2: Using nvm (Node Version Manager)**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.zshrc

# Install Node.js
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version
npm --version
```

### 3. Install Git

```bash
# Using Homebrew
brew install git

# Or install Xcode Command Line Tools (includes Git)
xcode-select --install

# Verify installation
git --version
```

### 4. Clone the Project

```bash
# Create project directory
mkdir -p ~/projects
cd ~/projects

# Clone the repository
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 5. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 6. Configure Environment Variables

```bash
# Copy configuration template
cp .env.example .env
```

Edit `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
HOST=localhost

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET=your-development-secret-key
```

### 6. Initialize Database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

### 7. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd ~/projects/noteflow/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd ~/projects/noteflow
npm run dev
```

Visit http://localhost:5173 to use the application.

## Production Deployment

### 1. Install PostgreSQL (Recommended)

```bash
# Install using Homebrew
brew install postgresql@14

# Start service
brew services start postgresql@14

# Create database
createdb noteflow

# Or create user and database using psql
psql postgres
```

Execute in psql:

```sql
CREATE DATABASE noteflow;
CREATE USER noteflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;
\q
```

### 2. Build Application

```bash
# Build frontend
cd ~/projects/noteflow
npm run build

# Build backend
cd server
npm run build
```

### 3. Configure Production Environment

Edit `server/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Frontend URL (production domain)
FRONTEND_URL=https://your-domain.com

# CORS allowed origins
CORS_ORIGINS=https://your-domain.com

# PostgreSQL Database
DATABASE_URL="postgresql://noteflow_user:your_password@localhost:5432/noteflow?schema=public"

# JWT Secret (use a strong password!)
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-characters

# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_FROM=noreply@your-domain.com
```

### 4. Initialize Production Database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

## Process Management with PM2

PM2 is a process manager that keeps your application running.

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Configuration File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
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
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

Create log directory:

```bash
mkdir -p logs
```

### 3. Configure Auto-start on Boot

```bash
# Generate startup script
pm2 startup

# Execute the output command as prompted, similar to:
# sudo env PATH=$PATH:/opt/homebrew/bin pm2 startup launchd -u username --hp /Users/username
```

### 4. Start Application

```bash
# Start application
pm2 start ecosystem.config.js

# Save process list
pm2 save

# View status
pm2 status

# View logs
pm2 logs noteflow-server
```

### 5. PM2 Common Commands

```bash
# Restart application
pm2 restart noteflow-server

# Stop application
pm2 stop noteflow-server

# Delete application
pm2 delete noteflow-server

# Monitor
pm2 monit

# View details
pm2 show noteflow-server
```

## Nginx Reverse Proxy

### 1. Install Nginx

```bash
brew install nginx
```

### 2. Configure Nginx

Edit configuration file `/opt/homebrew/etc/nginx/nginx.conf` or create separate config:

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend static files
    root /Users/username/projects/noteflow/dist;
    index index.html;

    # Forward API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static resource caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Start Nginx

```bash
# Test configuration
nginx -t

# Start Nginx
brew services start nginx

# Or start manually
nginx

# Reload configuration
nginx -s reload
```

### 4. Configure HTTPS (Recommended)

**Using self-signed certificate (development/testing):**

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/homebrew/etc/nginx/selfsigned.key \
  -out /opt/homebrew/etc/nginx/selfsigned.crt

# Add HTTPS to Nginx config
```

```nginx
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /opt/homebrew/etc/nginx/selfsigned.crt;
    ssl_certificate_key /opt/homebrew/etc/nginx/selfsigned.key;

    # ... other config
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}
```

**Using Certbot (production domain):**

```bash
# Install Certbot
brew install certbot

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure certificate path in Nginx
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

## launchd Service Management

If you prefer not to use PM2, you can use macOS native launchd to manage Node.js services.

### 1. Create plist File

Create `~/Library/LaunchAgents/com.noteflow.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.noteflow.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/username/projects/noteflow/server/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/username/projects/noteflow/server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/username/projects/noteflow/logs/out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/username/projects/noteflow/logs/error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3001</string>
    </dict>
</dict>
</plist>
```

### 2. Load and Start Service

```bash
# Create log directory
mkdir -p ~/projects/noteflow/logs

# Load service
launchctl load ~/Library/LaunchAgents/com.noteflow.server.plist

# Start service
launchctl start com.noteflow.server

# View service status
launchctl list | grep noteflow

# Stop service
launchctl stop com.noteflow.server

# Unload service
launchctl unload ~/Library/LaunchAgents/com.noteflow.server.plist
```

## Firewall Configuration

### 1. Check Firewall Status

```bash
# View firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### 2. Allow Ports

```bash
# Allow specific ports (if needed)
# Note: macOS firewall is application-level by default
# Usually no need to manually open ports unless using non-standard config
```

## Automatic Backup

Create backup script `~/scripts/backup-noteflow.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="$HOME/backups/noteflow"
DB_NAME="noteflow"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DB_NAME | gzip > $BACKUP_DIR/noteflow_$DATE.sql.gz

# Delete backups older than 7 days
find $BACKUP_DIR -name "noteflow_*.sql.gz" -mtime +7 -delete

echo "Backup completed: noteflow_$DATE.sql.gz"
```

Add to crontab:

```bash
# Edit crontab
crontab -e

# Execute backup daily at 2 AM
0 2 * * * $HOME/scripts/backup-noteflow.sh >> $HOME/logs/backup.log 2>&1
```

## Troubleshooting

### 1. npm install Failed

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### 2. Port Already in Use

```bash
# Find process using the port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### 3. Permission Issues

```bash
# Ensure project directory permissions are correct
sudo chown -R $(whoami) ~/projects/noteflow

# Fix npm permission issues
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /opt/homebrew/lib/node_modules
```

### 4. Prisma Commands Failed

```bash
# Ensure Prisma client is generated
npx prisma generate

# Re-push database
npx prisma db push --force-reset
```

### 5. PM2 Failed to Start

```bash
# Check logs
pm2 logs noteflow-server --lines 100

# Check configuration file path
pm2 start ecosystem.config.js --update-env
```

### 6. Nginx Failed to Start

```bash
# Check configuration syntax
nginx -t

# Check port usage
lsof -i :80
lsof -i :443

# View Nginx error log
tail -f /opt/homebrew/var/log/nginx/error.log
```

### 7. Homebrew Services Won't Start

```bash
# View service status
brew services list

# Restart service
brew services restart nginx
brew services restart postgresql@14

# View service info
brew services info nginx
```

## Performance Optimization

### 1. Node.js Optimization

Increase instances in PM2 config:

```javascript
instances: 'max', // or specific number
exec_mode: 'cluster'
```

### 2. Nginx Optimization

Edit `/opt/homebrew/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
```

### 3. PostgreSQL Optimization

Edit `/opt/homebrew/var/postgresql@14`:

```
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
```

## Recommended Development Tools

- **Visual Studio Code**: Code editor
- **Postico**: PostgreSQL client
- **TablePlus**: Database management tool
- **Postman**: API testing tool
- **iTerm2**: Enhanced terminal

```bash
# Install using Homebrew
brew install --cask visual-studio-code
brew install --cask postico
brew install --cask tableplus
brew install --cask postman
brew install --cask iterm2
```

## Next Steps

- Configure monitoring alerts: See [MONITORING.md](MONITORING.md)
- Performance optimization: See [OPTIMIZATION.md](OPTIMIZATION.md)
- Security hardening: See [SECURITY.md](SECURITY.md)
