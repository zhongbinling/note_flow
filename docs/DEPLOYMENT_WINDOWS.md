# Windows Deployment Guide

This guide walks you through deploying NoteFlow on Windows.

## Table of Contents

- [Requirements](#requirements)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Process Management with PM2](#process-management-with-pm2)
- [IIS Reverse Proxy](#iis-reverse-proxy)
- [Troubleshooting](#troubleshooting)

## Requirements

- Windows 10/11 or Windows Server 2016+
- Node.js 18.0.0 or higher
- PostgreSQL 14+ (optional, SQLite by default)
- Git

## Development Setup

### 1. Install Node.js

1. Visit [Node.js官网](https://nodejs.org/)
2. Download the LTS version (18.x or higher recommended)
3. Run the installer and follow the wizard
4. Verify installation:

```powershell
node --version
npm --version
```

### 2. Install Git

1. Visit [Git官网](https://git-scm.com/download/win)
2. Download and run the installer
3. Verify installation:

```powershell
git --version
```

### 3. Clone the Project

```powershell
# Open PowerShell or CMD
cd C:\Projects

# Clone the repository
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 4. Install Dependencies

```powershell
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 5. Configure Environment Variables

```powershell
# Copy configuration template
copy .env.example .env
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

```powershell
cd server

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

### 7. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```powershell
cd C:\Projects\noteflow\server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Projects\noteflow
npm run dev
```

Visit http://localhost:5173 to use the application.

## Production Deployment

### 1. Install PostgreSQL (Recommended)

1. Download [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Create database using pgAdmin or command line:

```sql
CREATE DATABASE noteflow;
CREATE USER noteflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;
```

### 2. Build Application

```powershell
# Build frontend
cd C:\Projects\noteflow
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

```powershell
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

## Process Management with PM2

PM2 is a process manager that keeps your application running.

### 1. Install PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Configure auto-start on boot
pm2-startup install
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
      max_memory_restart: '1G'
    }
  ]
};
```

### 3. Start Application

```powershell
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

```powershell
# Restart application
pm2 restart noteflow-server

# Stop application
pm2 stop noteflow-server

# Delete application
pm2 delete noteflow-server

# Monitor
pm2 monit
```

## IIS Reverse Proxy

### 1. Install IIS

1. Open "Control Panel" → "Programs" → "Turn Windows features on or off"
2. Check "Internet Information Services"
3. Click OK to complete installation

### 2. Install URL Rewrite and ARR

1. Download and install [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Download and install [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing)

### 3. Configure IIS Site

1. Open IIS Manager
2. Right-click "Sites" → "Add Website"
3. Configure:
   - Site name: NoteFlow
   - Physical path: `C:\Projects\noteflow\dist`
   - Port: 80 (or other port)

### 4. Configure Reverse Proxy

Create `web.config` in site root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Forward API requests to backend -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        <!-- Frontend routing -->
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

### 5. Configure HTTPS (Recommended)

1. Obtain SSL certificate (self-signed or CA-issued)
2. Bind HTTPS in IIS Manager (port 443)
3. Configure HTTP to HTTPS redirect

## Firewall Configuration

```powershell
# Open port 80
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=tcp localport=80

# Open port 443
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=tcp localport=443

# If not using reverse proxy, open backend port
netsh advfirewall firewall add rule name="NoteFlow API" dir=in action=allow protocol=tcp localport=3001
```

## Troubleshooting

### 1. npm install Failed

```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### 2. Port Already in Use

```powershell
# Find process using the port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### 3. Prisma Commands Failed

```powershell
# Ensure Prisma client is generated
npx prisma generate

# Re-push database
npx prisma db push --force-reset
```

### 4. PM2 Failed to Start

```powershell
# Check logs
pm2 logs noteflow-server --lines 100

# Check configuration file path
pm2 start ecosystem.config.js --update-env
```

## Next Steps

- Configure scheduled backups: See [BACKUP.md](BACKUP.md)
- Configure monitoring alerts: See [MONITORING.md](MONITORING.md)
- Performance optimization: See [OPTIMIZATION.md](OPTIMIZATION.md)
