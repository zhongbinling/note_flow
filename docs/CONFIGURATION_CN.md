# 配置参考

本文档详细说明 NoteFlow 的所有配置选项。

## 目录

- [后端配置](#后端配置)
- [前端配置](#前端配置)
- [数据库配置](#数据库配置)
- [邮件配置](#邮件配置)
- [安全配置](#安全配置)

## 后端配置

配置文件位置：`server/.env`

### 服务器配置

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 否 | `3001` | 服务器监听端口 |
| `HOST` | 否 | `localhost` | 服务器绑定地址，生产环境建议 `0.0.0.0` |
| `NODE_ENV` | 否 | `development` | 运行环境：`development` 或 `production` |
| `FRONTEND_URL` | 是 | - | 前端访问地址，用于 CORS 和邮件链接 |
| `CORS_ORIGINS` | 否 | - | 允许的跨域来源，多个用逗号分隔 |

### JWT 配置

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `JWT_SECRET` | **是** | - | JWT 签名密钥，**生产环境必须修改** |
| `JWT_EXPIRES_IN` | 否 | `7d` | Token 过期时间 |

### 速率限制

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `RATE_LIMIT_MAX` | 否 | `100` | 一般 API 每分钟最大请求数 |
| `AUTH_RATE_LIMIT_MAX` | 否 | `10` | 认证接口每分钟最大请求数 |

### 邮件配置

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `SMTP_HOST` | 否 | - | SMTP 服务器地址 |
| `SMTP_PORT` | 否 | `587` | SMTP 端口 |
| `SMTP_SECURE` | 否 | `false` | 是否使用 SSL（端口 465 时自动 true） |
| `SMTP_USER` | 否 | - | SMTP 用户名 |
| `SMTP_PASS` | 否 | - | SMTP 密码 |
| `SMTP_FROM` | 否 | `noreply@noteflow.app` | 发件人地址 |

### 密码重置

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `RESET_TOKEN_EXPIRY` | 否 | `3600000` | 重置令牌有效期（毫秒），默认 1 小时 |

## 前端配置

配置文件位置：`.env`（项目根目录）

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `VITE_API_URL` | 否 | `/api` | API 请求地址 |
| `VITE_APP_URL` | 否 | - | 应用访问地址 |

## 数据库配置

### SQLite（开发环境）

```env
DATABASE_URL="file:./dev.db"
```

数据库文件位置：`server/dev.db`

### PostgreSQL（生产环境）

```env
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名?schema=public"
```

示例：

```env
# 本地 PostgreSQL
DATABASE_URL="postgresql://noteflow:password@localhost:5432/noteflow?schema=public"

# 远程 PostgreSQL（如 Supabase、Neon 等）
DATABASE_URL="postgresql://user:pass@host.neon.tech/neondb?sslmode=require"
```

### 连接池配置（可选）

对于高并发场景，可以添加连接池参数：

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=30"
```

## 邮件配置

### 常见邮件服务商配置

#### QQ 邮箱

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_qq@qq.com
SMTP_PASS=授权码（不是QQ密码）
SMTP_FROM=your_qq@qq.com
```

#### 163 邮箱

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@163.com
SMTP_PASS=授权码
SMTP_FROM=your_email@163.com
```

#### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=应用专用密码
SMTP_FROM=your_email@gmail.com
```

#### 阿里云邮件

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

## 安全配置

### JWT 密钥生成

生成安全的 JWT 密钥：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Bash
head -c 64 /dev/urandom | xxd -p -c 64
```

### 生产环境检查清单

- [ ] `NODE_ENV` 设置为 `production`
- [ ] `JWT_SECRET` 使用强随机密钥（至少 32 字符）
- [ ] `FRONTEND_URL` 设置为正确的生产域名
- [ ] `CORS_ORIGINS` 只包含需要的域名
- [ ] 数据库使用 PostgreSQL 而非 SQLite
- [ ] 配置 SMTP 邮件服务
- [ ] 使用 HTTPS

## 配置示例

### 开发环境

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

### 生产环境

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

## 环境变量优先级

NoteFlow 按以下优先级加载配置：

1. 系统环境变量
2. `.env` 文件
3. 默认值

## 配置验证

启动时，后端会验证必需的配置项。如果缺少必需配置，应用将拒绝启动并输出错误信息。

检查配置是否正确：

```bash
cd server
npm run dev
```

查看启动日志，确认配置加载成功。
