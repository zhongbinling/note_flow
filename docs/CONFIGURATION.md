# Configuration Reference

This document details all configuration options for NoteFlow.

## Table of Contents

- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database Configuration](#database-configuration)
- [Email Configuration](#email-configuration)
- [Security Configuration](#security-configuration)

## Backend Configuration

Configuration file location: `server/.env`

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server listening port |
| `HOST` | No | `localhost` | Server bind address, use `0.0.0.0` for production |
| `NODE_ENV` | No | `development` | Environment: `development` or `production` |
| `FRONTEND_URL` | Yes | - | Frontend URL for CORS and email links |
| `CORS_ORIGINS` | No | - | Allowed CORS origins, comma-separated |

### JWT Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | - | JWT signing secret, **must change in production** |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration time |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_MAX` | No | `100` | Max requests per minute for general API |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max requests per minute for auth endpoints |

### Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | - | SMTP server address |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use SSL (auto true for port 465) |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |
| `SMTP_FROM` | No | `noreply@noteflow.app` | Sender email address |

### Password Reset

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESET_TOKEN_EXPIRY` | No | `3600000` | Reset token validity (milliseconds), default 1 hour |

## Frontend Configuration

Configuration file location: `.env` (project root)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `/api` | API request URL |
| `VITE_APP_URL` | No | - | Application URL |

## Database Configuration

### SQLite (Development)

```env
DATABASE_URL="file:./dev.db"
```

Database file location: `server/dev.db`

### PostgreSQL (Production)

```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

Examples:

```env
# Local PostgreSQL
DATABASE_URL="postgresql://noteflow:password@localhost:5432/noteflow?schema=public"

# Remote PostgreSQL (Supabase, Neon, etc.)
DATABASE_URL="postgresql://user:pass@host.neon.tech/neondb?sslmode=require"
```

### Connection Pool Configuration (Optional)

For high-concurrency scenarios, add connection pool parameters:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=30"
```

## Email Configuration

### Common Email Provider Settings

#### QQ Mail

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_qq@qq.com
SMTP_PASS=authorization_code (not QQ password)
SMTP_FROM=your_qq@qq.com
```

#### 163 Mail

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@163.com
SMTP_PASS=authorization_code
SMTP_FROM=your_email@163.com
```

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=app_specific_password
SMTP_FROM=your_email@gmail.com
```

#### Aliyun Mail

```env
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@your-domain.com
SMTP_PASS=your_password
SMTP_FROM=noreply@your-domain.com
```

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@your-domain.com
```

## Security Configuration

### JWT Secret Generation

Generate a secure JWT secret:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Bash
head -c 64 /dev/urandom | xxd -p -c 64
```

### Production Checklist

- [ ] `NODE_ENV` set to `production`
- [ ] `JWT_SECRET` uses strong random key (at least 32 characters)
- [ ] `FRONTEND_URL` set to correct production domain
- [ ] `CORS_ORIGINS` only contains needed domains
- [ ] Database uses PostgreSQL instead of SQLite
- [ ] SMTP email service configured
- [ ] HTTPS enabled

## Configuration Examples

### Development Environment

```env
# server/.env
PORT=3001
NODE_ENV=development
HOST=localhost
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev-secret-key-do-not-use-in-production
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
RESET_TOKEN_EXPIRY=3600000
```

### Production Environment

```env
# server/.env
PORT=3001
NODE_ENV=production
HOST=0.0.0.0
FRONTEND_URL=https://noteflow.your-domain.com
CORS_ORIGINS=https://noteflow.your-domain.com
DATABASE_URL="postgresql://noteflow:secure_password@localhost:5432/noteflow?schema=public"
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
RESET_TOKEN_EXPIRY=3600000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@your-domain.com
```

## Environment Variable Priority

NoteFlow loads configuration in this priority order:

1. System environment variables
2. `.env` file
3. Default values

## Configuration Validation

On startup, the backend validates required configuration items. If required configuration is missing, the application will refuse to start and output an error message.

Check if configuration is correct:

```bash
cd server
npm run dev
```

Check startup logs to confirm configuration loaded successfully.
