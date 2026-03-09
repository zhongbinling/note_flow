# Docker 部署指南

本文档指导您使用 Docker 部署 NoteFlow 应用。

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [Docker Compose 部署](#docker-compose-部署)
- [单独构建镜像](#单独构建镜像)
- [生产环境配置](#生产环境配置)
- [数据持久化](#数据持久化)
- [常见问题](#常见问题)

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+

### 安装 Docker

**Windows:**
1. 下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. 启动 Docker Desktop

**macOS:**
```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop
```

**Linux (Ubuntu/Debian):**
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 2. 配置环境变量

```bash
# 复制配置模板
cp server/.env.example server/.env

# 编辑配置文件
nano server/.env
```

### 3. 启动服务

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问 http://localhost 即可使用。

## Docker Compose 部署

项目根目录下的 `docker-compose.yml` 配置：

```yaml
version: '3.8'

services:
  # 前端 + 后端服务
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

  # PostgreSQL 数据库
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

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f noteflow

# 进入容器
docker-compose exec noteflow sh

# 重新构建
docker-compose up -d --build
```

## 单独构建镜像

### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 阶段1: 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
RUN npm ci

# 复制前端源码
COPY . .

# 构建前端
RUN npm run build

# 阶段2: 构建后端
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# 复制后端依赖文件
COPY server/package*.json ./
RUN npm ci

# 复制后端源码
COPY server/ .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建后端
RUN npm run build

# 阶段3: 生产镜像
FROM node:20-alpine

WORKDIR /app

# 安装 nginx
RUN apk add --no-cache nginx

# 复制前端构建产物
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 复制后端构建产物
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/package.json ./server/
COPY --from=backend-builder /app/server/prisma ./server/prisma

# 复制 nginx 配置
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# 复制启动脚本
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# 暴露端口
EXPOSE 80

# 启动
CMD ["/start.sh"]
```

### 2. 创建 Nginx 配置

创建 `docker/nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # API 请求转发到后端
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

    # 前端路由处理（SPA）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 创建启动脚本

创建 `docker/start.sh`：

```bash
#!/bin/sh

# 启动后端服务
cd /app/server
node dist/index.js &

# 启动 nginx
nginx -g 'daemon off;'
```

### 4. 构建和运行

```bash
# 构建镜像
docker build -t noteflow:latest .

# 运行容器（使用 SQLite）
docker run -d \
  --name noteflow \
  -p 80:80 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  -v noteflow-data:/app/server/data \
  noteflow:latest

# 运行容器（连接外部 PostgreSQL）
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

## 生产环境配置

### 1. 使用环境变量文件

创建 `.env.production`：

```env
# 数据库
DATABASE_URL=postgresql://noteflow:your_password@postgres:5432/noteflow?schema=public

# JWT
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-characters

# 服务器
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com

# 邮件
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@your-domain.com

# 速率限制
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

### 2. 生产级 Docker Compose

创建 `docker-compose.prod.yml`：

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

  # 可选：数据库备份服务
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

### 3. 启动生产环境

```bash
# 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. 配置 HTTPS（使用 Traefik）

创建 `docker-compose.traefik.yml`：

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

## 数据持久化

### 备份数据

```bash
# 备份 PostgreSQL 数据
docker-compose exec postgres pg_dump -U noteflow noteflow | gzip > backup_$(date +%Y%m%d).sql.gz

# 备份 SQLite 数据（如果使用 SQLite）
docker cp noteflow:/app/server/data ./backup
```

### 恢复数据

```bash
# 恢复 PostgreSQL 数据
gunzip -c backup_20240101.sql.gz | docker-compose exec -T postgres psql -U noteflow noteflow

# 恢复 SQLite 数据（如果使用 SQLite）
docker cp ./backup noteflow:/app/server/data
```

### 数据卷管理

```bash
# 列出数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect noteflow_postgres-data

# 删除数据卷（危险操作！）
docker volume rm noteflow_postgres-data
```

## 常见问题

### 1. 容器无法启动

```bash
# 查看容器日志
docker-compose logs noteflow

# 查看容器状态
docker-compose ps

# 重新构建
docker-compose up -d --build
```

### 2. 数据库连接失败

```bash
# 检查数据库容器状态
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres

# 进入数据库容器检查
docker-compose exec postgres psql -U noteflow
```

### 3. 权限问题

```bash
# 检查文件权限
ls -la

# 修复权限
sudo chown -R $USER:$USER .
```

### 4. 端口冲突

```bash
# 检查端口占用
lsof -i :80
lsof -i :3001

# 修改 docker-compose.yml 中的端口映射
ports:
  - "8080:80"  # 使用 8080 端口
```

### 5. 镜像过大

```bash
# 查看镜像大小
docker images

# 清理未使用的镜像
docker image prune -a

# 清理构建缓存
docker builder prune
```

### 6. 初始化数据库

```bash
# 运行 Prisma 迁移
docker-compose exec noteflow sh -c "cd server && npx prisma migrate deploy"

# 或使用 db push（开发环境）
docker-compose exec noteflow sh -c "cd server && npx prisma db push"
```

## 健康检查

添加健康检查到 Docker Compose：

```yaml
services:
  noteflow:
    # ... 其他配置
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看新容器状态
docker-compose ps
```

## 下一步

- 配置监控告警：参考 [MONITORING.md](MONITORING.md)
- 安全加固：参考 [SECURITY.md](SECURITY.md)
- CI/CD 配置：参考 [CI_CD.md](CI_CD.md)
