#!/bin/bash

# NoteFlow Quick Update Script
# Usage: ./update.sh [--skip-deps] [--skip-build]
# This script updates the application and restarts services without full redeployment

set -e

echo "========================================"
echo "  NoteFlow Quick Update Script"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/noteflow"

# Parse arguments
SKIP_DEPS=false
SKIP_BUILD=false
SKIP_MIGRATIONS=false

for arg in "$@"; do
  case $arg in
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    --help)
      echo "Usage: ./update.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-deps        Skip npm install (faster if no new dependencies)"
      echo "  --skip-build       Skip build step (faster if only server changes)"
      echo "  --skip-migrations  Skip database migrations"
      echo "  --help             Show this help message"
      exit 0
      ;;
  esac
done

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ] && [ "$USER" != "root" ]; then
  echo -e "${YELLOW}Note: Running without root privileges${NC}"
fi

# Navigate to app directory
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}Error: Application directory not found at ${APP_DIR}${NC}"
  echo -e "${YELLOW}Please update APP_DIR in this script or use full deploy script${NC}"
  exit 1
fi

cd $APP_DIR
echo -e "${GREEN}Working directory: $(pwd)${NC}"

# Step 1: Pull latest code
echo ""
echo -e "${BLUE}[1/6] Pulling latest code...${NC}"
BEFORE_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

git fetch origin
git pull origin main

AFTER_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
  echo -e "${YELLOW}No code changes detected${NC}"
else
  echo -e "${GREEN}Updated from ${BEFORE_COMMIT:0:7} to ${AFTER_COMMIT:0:7}${NC}"
  # Show last 3 commits
  echo -e "${GREEN}Recent commits:${NC}"
  git log --oneline -3
fi

# Step 2: Install dependencies
if [ "$SKIP_DEPS" = true ]; then
  echo ""
  echo -e "${YELLOW}[2/6] Skipping npm install (--skip-deps)${NC}"
else
  echo ""
  echo -e "${BLUE}[2/6] Installing dependencies...${NC}"

  echo "  Installing frontend dependencies..."
  npm install --prefer-offline

  echo "  Installing backend dependencies..."
  cd server && npm install --prefer-offline && cd ..

  echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Step 3: Generate Prisma Client
echo ""
echo -e "${BLUE}[3/6] Generating Prisma Client...${NC}"
cd server
npx prisma generate
cd ..
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Step 4: Run database migrations (if any)
if [ "$SKIP_MIGRATIONS" = true ]; then
  echo ""
  echo -e "${YELLOW}[4/6] Skipping database migrations (--skip-migrations)${NC}"
else
  echo ""
  echo -e "${BLUE}[4/6] Checking database migrations...${NC}"
  cd server
  npx prisma db push --skip-generate
  cd ..
  echo -e "${GREEN}✓ Database schema synced${NC}"
fi

# Step 5: Build application
if [ "$SKIP_BUILD" = true ]; then
  echo ""
  echo -e "${YELLOW}[5/6] Skipping build (--skip-build)${NC}"
else
  echo ""
  echo -e "${BLUE}[5/6] Building application...${NC}"

  echo "  Building frontend..."
  npm run build

  echo "  Building backend..."
  cd server && npm run build && cd ..

  echo -e "${GREEN}✓ Application built${NC}"
fi

# Step 6: Restart services
echo ""
echo -e "${BLUE}[6/6] Restarting services...${NC}"

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
  echo "  Restarting PM2 service..."

  # Graceful reload (zero-downtime)
  pm2 reload noteflow-server 2>/dev/null || pm2 restart noteflow-server 2>/dev/null || {
    echo -e "${YELLOW}PM2 service not found, attempting to start...${NC}"
    pm2 start ecosystem.config.cjs 2>/dev/null || {
      echo -e "${RED}Failed to start PM2 service${NC}"
      echo -e "${YELLOW}Try running the full deploy script first${NC}"
    }
  }

  pm2 save
  echo -e "${GREEN}✓ PM2 service restarted${NC}"

  # Show status
  echo ""
  pm2 status
else
  echo -e "${RED}PM2 not found. Please install PM2: npm install -g pm2${NC}"
  exit 1
fi

# Reload Nginx (if available)
if command -v nginx &> /dev/null; then
  echo "  Reloading Nginx..."
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null && echo -e "${GREEN}✓ Nginx reloaded${NC}" || \
    echo -e "${YELLOW}Nginx reload skipped (may need manual reload)${NC}"
fi

# Verify deployment
echo ""
echo -e "${BLUE}Verifying deployment...${NC}"
sleep 2

HEALTH_URL="http://localhost:3001/api/health"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s $HEALTH_URL > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}Waiting for service to start... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
      sleep 2
    else
      echo -e "${RED}✗ Backend API health check failed after $MAX_RETRIES retries${NC}"
      echo -e "${YELLOW}Check logs: pm2 logs noteflow-server${NC}"
    fi
  fi
done

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}  Update Complete!${NC}"
echo "========================================"
echo ""
echo "Current version: ${AFTER_COMMIT:0:7}"
echo ""
echo "Useful commands:"
echo "  pm2 logs noteflow-server  - View application logs"
echo "  pm2 status                - Check service status"
echo "  pm2 restart noteflow-server - Manual restart"
echo ""
