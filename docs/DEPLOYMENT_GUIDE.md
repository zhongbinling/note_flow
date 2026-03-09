# Deployment Guide

This document provides multiple deployment options for NoteFlow.

## 📋 Deployment Options Overview

| Option | Platform | Frontend | Backend | Database | Cost |
|--------|----------|----------|---------|----------|------|
| **1** | GitHub Pages | ✅ | ❌ | - | Free |
| **2** | Render | ✅ | ✅ | PostgreSQL | Free |
| **3** | Railway | ✅ | ✅ | PostgreSQL | $5/mo+ |
| **4** | Vercel | ✅ | ✅ | External DB | Free |
| **5** | Self-hosted | Any | Any | Any | Custom |

---

## Option 1: GitHub Pages (Frontend Demo Only)

Deploy only the static frontend for demo purposes. Cloud sync features will not be available.

### Steps

1. Update `base` in `vite.config.ts` to your repository name:
```typescript
base: '/your-repo-name/',
```

2. Set environment variables (optional):
```bash
# .env.production
VITE_API_URL=https://your-backend-api.com/api
```

3. Push to GitHub, automatic deployment to GitHub Pages.

### Already Configured

- ✅ GitHub Actions workflow: `.github/workflows/deploy.yml`
- ✅ Automatic build and deploy

---

## Option 2: Render (Recommended Free Option)

Render offers free Web Service and PostgreSQL database.

### Prerequisites

- GitHub account
- Render account (https://render.com)

### Steps

#### 1. Create Account on Render and Connect GitHub

1. Visit https://dashboard.render.com
2. Click "Get Started" and sign in with GitHub
3. Authorize Render to access your GitHub repositories

#### 2. Create PostgreSQL Database

1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `noteflow-db`
   - **Database**: `noteflow`
   - **User**: auto-generated
   - **Region**: choose closest to you
   - **Plan**: Free
3. Click "Create Database"
4. After creation, copy the **Internal Database URL**

#### 3. Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository `noteflow`
3. Configure:
   - **Name**: `noteflow`
   - **Region**: same as database
   - **Branch**: `main`
   - **Root Directory**: `.` (leave empty or use `.`)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && cd server && npm install && npx prisma generate && npm run build && cd .. && npm run build
     ```
   - **Start Command**:
     ```bash
     cd server && npx prisma migrate deploy && npm run start
     ```
   - **Plan**: Free

4. Add environment variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | (Internal Database URL from database page) |
   | `JWT_SECRET` | (generate a random string, at least 32 characters) |
   | `FRONTEND_URL` | `https://noteflow.onrender.com` |
   | `CORS_ORIGINS` | `https://noteflow.onrender.com,https://your-username.github.io` |
   | `PORT` | `10000` |

5. Click "Create Web Service"

#### 4. Wait for Deployment

First deployment takes approximately 5-10 minutes.

### Configuration File

`render.yaml` created for Blueprint deployment.

---

## Option 3: Railway

Railway offers $5/month free credits, suitable for production.

### Steps

1. Visit https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `noteflow` repository
5. Configure environment variables (same as Render)
6. Add PostgreSQL database

### Configuration File

`railway.toml` created.

---

## Option 4: Vercel

Vercel is suitable for frontend/backend separated deployment.

### Steps

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Configure environment variables (in Vercel Dashboard)

### Note

Vercel's Serverless Functions have execution time limits (10s for free tier), may require backend code adjustments.

---

## Option 5: Self-hosted (Docker)

One-click deployment using Docker Compose.

### Steps

```bash
# 1. Clone repository
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# 2. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env

# 3. Start services
docker-compose up -d

# 4. Initialize database
docker-compose exec noteflow sh -c "cd server && npx prisma migrate deploy"
```

See [DEPLOYMENT_DOCKER.md](DEPLOYMENT_DOCKER.md) for details.

---

## 🔐 Environment Variables Checklist

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret | random 32+ character string |
| `FRONTEND_URL` | Frontend access URL | `https://your-domain.com` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://your-domain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `RATE_LIMIT_MAX` | API rate limit | `100` |
| `AUTH_RATE_LIMIT_MAX` | Auth endpoint rate limit | `10` |

### Email Service (Password Reset)

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender address |

---

## 🛠️ Deployment Checklist

Before deploying, confirm:

- [ ] All required environment variables are set
- [ ] `JWT_SECRET` uses a strong random key
- [ ] `FRONTEND_URL` points to correct frontend address
- [ ] `CORS_ORIGINS` includes all needed frontend domains
- [ ] Database is created and configured correctly
- [ ] Database migration has been run

After deploying, verify:

- [ ] Frontend page is accessible
- [ ] Users can register
- [ ] Users can login
- [ ] Notes can be created and edited
- [ ] Notes can sync (if backend is configured)

---

## 📞 Need Help?

If you encounter issues during deployment:

1. Check platform documentation:
   - [Render Docs](https://render.com/docs)
   - [Railway Docs](https://docs.railway.app)
   - [Vercel Docs](https://vercel.com/docs)

2. Check logs:
   - Render: Dashboard → Service → Logs
   - Railway: Project → Service → Deployments → Logs
   - Vercel: Dashboard → Project → Deployments → Logs

3. Submit an Issue:
   - [GitHub Issues](https://github.com/zhongbinling/noteflow/issues)
