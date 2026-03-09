# Linux Deployment Guide

This guide walks you through deploying NoteFlow on Linux.

## Table of Contents

- [Requirements](#requirements)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Process Management with PM2](#process-management-with-pm2)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [systemd Service Management](#systemd-service-management)
- [Troubleshooting](#troubleshooting)

## Requirements

- Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / Fedora 35+
- Node.js 18.0.0 or higher
- PostgreSQL 14+ (optional, SQLite by default)
- Git

## Development Setup

### 1. Install Node.js

**Ubuntu/Debian:**

```bash
# Use NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**CentOS/RHEL/Fedora:**

```bash
# Use NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Or Fedora
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install Git

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y git
```

**CentOS/RHEL:**
```bash
sudo yum install -y git
```

**Fedora:**
```bash
sudo dnf install -y git
```

### 3. Clone the Project

```bash
# Create project directory
mkdir -p ~/projects
cd ~/projects

# Clone the repository
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 5. Configure Environment Variables

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

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create database:

```bash
sudo -u postgres psql

# Execute in psql
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

# Configure auto-start on boot
pm2 startup
# Execute the generated command as prompted
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

### 3. Start Application

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

### 4. PM2 Common Commands

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

**Ubuntu/Debian:**
```bash
sudo apt-get install -y nginx
```

**CentOS/RHEL:**
```bash
sudo yum install -y nginx
```

### 2. Configure Nginx

Create configuration file `/etc/nginx/sites-available/noteflow`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    root /home/user/projects/noteflow/dist;
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

Enable configuration:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/noteflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

### 3. Configure HTTPS (Recommended)

Use Certbot to obtain free SSL certificate:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically modify Nginx configuration to add HTTPS support.

## systemd Service Management

If you prefer not to use PM2, you can use systemd to manage Node.js services.

### 1. Create systemd Service File

Create `/etc/systemd/system/noteflow.service`:

```ini
[Unit]
Description=NoteFlow Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/home/user/projects/noteflow/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=noteflow
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 2. Start Service

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Start service
sudo systemctl start noteflow

# Enable auto-start on boot
sudo systemctl enable noteflow

# View status
sudo systemctl status noteflow

# View logs
sudo journalctl -u noteflow -f
```

## Firewall Configuration

**Ubuntu/Debian (UFW):**

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Or open ports individually
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

**CentOS/RHEL (firewalld):**

```bash
# Open HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload
```

## Automatic Backup

Create backup script `/home/user/scripts/backup-noteflow.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/user/backups/noteflow"
DB_NAME="noteflow"
DB_USER="noteflow_user"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/noteflow_$DATE.sql.gz

# Delete backups older than 7 days
find $BACKUP_DIR -name "noteflow_*.sql.gz" -mtime +7 -delete

echo "Backup completed: noteflow_$DATE.sql.gz"
```

Add to crontab:

```bash
# Edit crontab
crontab -e

# Execute backup daily at 2 AM
0 2 * * * /home/user/scripts/backup-noteflow.sh >> /home/user/logs/backup.log 2>&1
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
sudo lsof -i :3001
# Or
sudo netstat -tlnp | grep 3001

# Kill process
kill -9 <PID>
```

### 3. Permission Issues

```bash
# Ensure project directory permissions are correct
sudo chown -R $USER:$USER ~/projects/noteflow

# If running as www-data user
sudo chown -R www-data:www-data ~/projects/noteflow
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

### 6. Nginx 502 Bad Gateway

```bash
# Check if backend service is running
pm2 status
# Or
sudo systemctl status noteflow

# Check SELinux (CentOS/RHEL)
sudo setsebool -P httpd_can_network_connect 1
```

## Performance Optimization

### 1. Node.js Optimization

Increase instances in PM2 config (cluster mode):

```javascript
instances: 'max', // or specific number like 4
exec_mode: 'cluster'
```

### 2. Nginx Optimization

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
```

### 3. PostgreSQL Optimization

Edit `/etc/postgresql/14/main/postgresql.conf`:

```
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

## Next Steps

- Configure monitoring alerts: See [MONITORING.md](MONITORING.md)
- Performance optimization: See [OPTIMIZATION.md](OPTIMIZATION.md)
- Security hardening: See [SECURITY.md](SECURITY.md)
