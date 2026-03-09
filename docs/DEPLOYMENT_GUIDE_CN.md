# 部署指南 / Deployment Guide

本文档提供多种部署方案，您可以根据需求选择。

This document provides multiple deployment options for NoteFlow.

## 📋 部署方案概览 / Deployment Options Overview

| 方案 | 平台 | 前端 | 后端 | 数据库 | 费用 |
|------|------|------|------|--------|------|
| **1** | GitHub Pages | ✅ | ❌ | - | 免费 |
| **2** | Render | ✅ | ✅ | PostgreSQL | 免费 |
| **3** | Railway | ✅ | ✅ | PostgreSQL | $5/月起 |
| **4** | Vercel | ✅ | ✅ | 需外部DB | 免费 |
| **5** | 自托管 | 任意 | 任意 | 任意 | 自定义 |

---

## 方案 1: GitHub Pages（仅前端演示）

仅部署前端静态页面，适用于演示目的。云同步功能不可用。

### 步骤

1. 修改 `vite.config.ts` 中的 `base` 为您的仓库名：
```typescript
base: '/your-repo-name/',
```

2. 设置环境变量（可选）：
```bash
# .env.production
VITE_API_URL=https://your-backend-api.com/api
```

3. 推送到 GitHub，自动部署到 GitHub Pages。

### 已配置

- ✅ GitHub Actions 工作流：`.github/workflows/deploy.yml`
- ✅ 自动构建和部署

---

## 方案 2: Render（推荐免费方案）

Render 提供免费的 Web Service 和 PostgreSQL 数据库。

### 前提条件

- GitHub 账号
- Render 账号（https://render.com）

### 步骤

#### 1. 在 Render 创建账号并连接 GitHub

1. 访问 https://dashboard.render.com
2. 点击 "Get Started" 使用 GitHub 登录
3. 授权 Render 访问您的 GitHub 仓库

#### 2. 创建 PostgreSQL 数据库

1. 在 Render Dashboard 点击 "New +" → "PostgreSQL"
2. 配置：
   - **Name**: `noteflow-db`
   - **Database**: `noteflow`
   - **User**: 自动生成
   - **Region**: 选择离您最近的
   - **Plan**: Free
3. 点击 "Create Database"
4. 创建后，复制 **Internal Database URL**

#### 3. 创建 Web Service

1. 点击 "New +" → "Web Service"
2. 连接您的 GitHub 仓库 `noteflow`
3. 配置：
   - **Name**: `noteflow`
   - **Region**: 与数据库相同
   - **Branch**: `main`
   - **Root Directory**: `.`（留空或使用 `.`）
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

4. 添加环境变量：

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | （从数据库页面复制的 Internal Database URL） |
   | `JWT_SECRET` | （生成一个随机字符串，至少32字符） |
   | `FRONTEND_URL` | `https://noteflow.onrender.com` |
   | `CORS_ORIGINS` | `https://noteflow.onrender.com,https://your-username.github.io` |
   | `PORT` | `10000` |

5. 点击 "Create Web Service"

#### 4. 等待部署完成

首次部署大约需要 5-10 分钟。

### 配置文件

已创建 `render.yaml` 用于 Blueprint 部署。

---

## 方案 3: Railway

Railway 提供 $5/月的免费额度，适合生产环境。

### 步骤

1. 访问 https://railway.app
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择 `noteflow` 仓库
5. 配置环境变量（同 Render）
6. 添加 PostgreSQL 数据库

### 配置文件

已创建 `railway.toml`。

---

## 方案 4: Vercel

Vercel 适合前后端分离部署。

### 步骤

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 部署：
```bash
vercel --prod
```

4. 配置环境变量（在 Vercel Dashboard）

### 注意

Vercel 的 Serverless Functions 有执行时间限制（免费版 10 秒），可能需要调整后端代码。

---

## 方案 5: 自托管（Docker）

使用 Docker Compose 一键部署。

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env

# 3. 启动服务
docker-compose up -d

# 4. 初始化数据库
docker-compose exec noteflow sh -c "cd server && npx prisma migrate deploy"
```

详细说明请参阅 [DEPLOYMENT_DOCKER_CN.md](DEPLOYMENT_DOCKER_CN.md)。

---

## 🔐 环境变量清单

### 必需变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥 | 随机32+字符字符串 |
| `FRONTEND_URL` | 前端访问地址 | `https://your-domain.com` |
| `CORS_ORIGINS` | 允许的跨域来源 | `https://your-domain.com` |

### 可选变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `3001` |
| `JWT_EXPIRES_IN` | Token 有效期 | `7d` |
| `RATE_LIMIT_MAX` | API 速率限制 | `100` |
| `AUTH_RATE_LIMIT_MAX` | 认证接口速率限制 | `10` |

### 邮件服务（密码重置功能）

| 变量 | 说明 |
|------|------|
| `SMTP_HOST` | SMTP 服务器 |
| `SMTP_PORT` | SMTP 端口 |
| `SMTP_USER` | SMTP 用户名 |
| `SMTP_PASS` | SMTP 密码 |
| `SMTP_FROM` | 发件人地址 |

---

## 🛠️ 部署检查清单

部署前请确认：

- [ ] 已设置所有必需的环境变量
- [ ] `JWT_SECRET` 使用强随机密钥
- [ ] `FRONTEND_URL` 指向正确的前端地址
- [ ] `CORS_ORIGINS` 包含所有需要的前端域名
- [ ] 数据库已创建并配置正确
- [ ] 已运行数据库迁移

部署后请验证：

- [ ] 前端页面可以访问
- [ ] 用户可以注册
- [ ] 用户可以登录
- [ ] 可以创建和编辑笔记
- [ ] 笔记可以同步（如果配置了后端）

---

## 📞 需要帮助？

如果您在部署过程中遇到问题：

1. 查看平台文档：
   - [Render 文档](https://render.com/docs)
   - [Railway 文档](https://docs.railway.app)
   - [Vercel 文档](https://vercel.com/docs)

2. 检查日志：
   - Render: Dashboard → Service → Logs
   - Railway: Project → Service → Deployments → Logs
   - Vercel: Dashboard → Project → Deployments → Logs

3. 提交 Issue：
   - [GitHub Issues](https://github.com/zhongbinling/noteflow/issues)
