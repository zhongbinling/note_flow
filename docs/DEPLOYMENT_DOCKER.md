# Docker Deployment Guide

This guide walks you through deploying NoteFlow using Docker.

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Building Images Separately](#building-images-separately)
- [Production Configuration](#production-configuration)
- [Data Persistence](#data-persistence)
- [Troubleshooting](#troubleshooting)

## Requirements

- Docker 20.10+
- Docker Compose 2.0+

### Install Docker

**Windows:**
1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Start Docker Desktop

**macOS:**
```bash
# Install using Homebrew
brew install --cask docker

# Or download Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop
```

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Project

```bash
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 2. Configure Environment Variables

```bash
# Copy configuration template
cp server/.env.example server/.env

# Edit configuration file
nano server/.env
```

### 3. Start Services

```bash
# Start using Docker Compose
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f
```

Visit http://localhost to use the application.

## Docker Compose Deployment

The `docker-compose.yml` configuration in project root:

```yaml
version: '3.8'

services:
  # Frontend + Backend service
  noteflow:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://noteflow:noteflow123@postgres:5432/noteflow?schema=public
      - JWT_SECRET=${JWT_SECRET:-change-this-secret-in-production}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost}
      - CORS_ORIGINS=${CORS_ORIGINS:-http://localhost}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - noteflow-network

  # PostgreSQL database
  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=noteflow
      - POSTGRES_PASSWORD=noteflow123
      - POSTGRES_DB=noteflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U noteflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - noteflow-network

volumes:
  postgres-data:

networks:
  noteflow-network:
    driver: bridge
```

### Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f noteflow

# Enter container
docker-compose exec noteflow sh

# Rebuild
docker-compose up -d --build
```

## Building Images Separately

### 1. Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend dependency files
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# Copy backend dependency files
COPY server/package*.json ./
RUN npm ci

# Copy backend source
COPY server/ .

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy frontend build output
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy backend build output
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/package.json ./server/
COPY --from=backend-builder /app/server/prisma ./server/prisma

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose port
EXPOSE 80

# Start
CMD ["/start.sh"]
```

### 2. Create Nginx Configuration

Create `docker/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Forward API requests to backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
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

### 3. Create Startup Script

Create `docker/start.sh`:

```bash
#!/bin/sh

# Start backend service
cd /app/server
node dist/index.js &

# Start nginx
nginx -g 'daemon off;'
```

### 4. Build and Run

```bash
# Build image
docker build -t noteflow:latest .

# Run container (using SQLite)
docker run -d \
  --name noteflow \
  -p 80:80 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  -v noteflow-data:/app/server/data \
  noteflow:latest

# Run container (connecting to external PostgreSQL)
docker run -d \
  --name noteflow \
  -p 80:80 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@host:5432/noteflow" \
  -e JWT_SECRET=your-secret-key \
  -e FRONTEND_URL=http://your-domain.com \
  -e CORS_ORIGINS=http://your-domain.com \
  noteflow:latest
```

## Production Configuration

### 1. Use Environment File

Create `.env.production`:

```env
# Database
DATABASE_URL=postgresql://noteflow:your_password@postgres:5432/noteflow?schema=public

# JWT
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-characters

# Server
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@your-domain.com

# Rate Limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

### 2. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  noteflow:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    restart: always
    networks:
      - noteflow-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=noteflow
      - POSTGRES_PASSWORD=${DB_PASSWORD:-noteflow123}
      - POSTGRES_DB=noteflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backup:/backup
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U noteflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - noteflow-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Optional: Database backup service
  backup:
    image: postgres:14-alpine
    environment:
      - PGPASSWORD=${DB_PASSWORD:-noteflow123}
    volumes:
      - ./backup:/backup
    entrypoint: |
      sh -c 'while true; do
        pg_dump -h postgres -U noteflow noteflow | gzip > /backup/noteflow_$$(date +%Y%m%d_%H%M%S).sql.gz
        find /backup -name "noteflow_*.sql.gz" -mtime +7 -delete
        sleep 86400
      done'
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - noteflow-network

volumes:
  postgres-data:

networks:
  noteflow-network:
    driver: bridge
```

### 3. Start Production Environment

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Configure HTTPS (using Traefik)

Create `docker-compose.traefik.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "./letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - noteflow-network

  noteflow:
    build:
      context: .
      dockerfile: Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.noteflow.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.noteflow.entrypoints=websecure"
      - "traefik.http.routers.noteflow.tls.certresolver=letsencrypt"
      - "traefik.http.services.noteflow.loadbalancer.server.port=80"
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - noteflow-network

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=noteflow
      - POSTGRES_PASSWORD=${DB_PASSWORD:-noteflow123}
      - POSTGRES_DB=noteflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U noteflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - noteflow-network

volumes:
  postgres-data:

networks:
  noteflow-network:
    driver: bridge
```

## Data Persistence

### Backup Data

```bash
# Backup PostgreSQL data
docker-compose exec postgres pg_dump -U noteflow noteflow | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup SQLite data (if using SQLite)
docker cp noteflow:/app/server/data ./backup
```

### Restore Data

```bash
# Restore PostgreSQL data
gunzip -c backup_20240101.sql.gz | docker-compose exec -T postgres psql -U noteflow noteflow

# Restore SQLite data (if using SQLite)
docker cp ./backup noteflow:/app/server/data
```

### Volume Management

```bash
# List volumes
docker volume ls

# View volume details
docker volume inspect noteflow_postgres-data

# Delete volume (dangerous!)
docker volume rm noteflow_postgres-data
```

## Troubleshooting

### 1. Container Won't Start

```bash
# View container logs
docker-compose logs noteflow

# View container status
docker-compose ps

# Rebuild
docker-compose up -d --build
```

### 2. Database Connection Failed

```bash
# Check database container status
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Enter database container to check
docker-compose exec postgres psql -U noteflow
```

### 3. Permission Issues

```bash
# Check file permissions
ls -la

# Fix permissions
sudo chown -R $USER:$USER .
```

### 4. Port Conflict

```bash
# Check port usage
lsof -i :80
lsof -i :3001

# Modify port mapping in docker-compose.yml
ports:
  - "8080:80"  # Use port 8080
```

### 5. Image Too Large

```bash
# View image size
docker images

# Clean unused images
docker image prune -a

# Clean build cache
docker builder prune
```

### 6. Initialize Database

```bash
# Run Prisma migration
docker-compose exec noteflow sh -c "cd server && npx prisma migrate deploy"

# Or use db push (development)
docker-compose exec noteflow sh -c "cd server && npx prisma db push"
```

## Health Check

Add health check to Docker Compose:

```yaml
services:
  noteflow:
    # ... other config
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Update Deployment

```bash
# Pull latest code
git pull

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build

# View new container status
docker-compose ps
```

## Next Steps

- Configure monitoring alerts: See [MONITORING.md](MONITORING.md)
- Security hardening: See [SECURITY.md](SECURITY.md)
- CI/CD configuration: See [CI_CD.md](CI_CD.md)
