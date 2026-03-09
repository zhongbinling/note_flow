# Linux 部署指南

本文档指导您在 Linux 环境下部署 NoteFlow 应用。

## 目录

- [环境要求](#环境要求)
- [开发环境搭建](#开发环境搭建)
- [生产环境部署](#生产环境部署)
- [使用 PM2 管理进程](#使用-pm2-管理进程)
- [使用 Nginx 反向代理](#使用-nginx-反向代理)
- [使用 systemd 管理服务](#使用-systemd-管理服务)
- [常见问题](#常见问题)

## 环境要求

- Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / Fedora 35+
- Node.js 18.0.0 或更高版本
- PostgreSQL 14+（可选，默认使用 SQLite）
- Git

## 开发环境搭建

### 1. 安装 Node.js

**Ubuntu/Debian:**

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**CentOS/RHEL/Fedora:**

```bash
# 使用 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 或 Fedora
sudo dnf install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装 Git

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

### 3. 克隆项目

```bash
# 创建项目目录
mkdir -p ~/projects
cd ~/projects

# 克隆仓库
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 4. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 5. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development
HOST=localhost

# 前端 URL
FRONTEND_URL=http://localhost:5173

# 数据库（SQLite 开发模式）
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET=your-development-secret-key
```

### 6. 初始化数据库

```bash
cd server

# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表
npx prisma db push
```

### 7. 启动开发服务器

打开两个终端窗口：

**终端 1 - 后端：**
```bash
cd ~/projects/noteflow/server
npm run dev
```

**终端 2 - 前端：**
```bash
cd ~/projects/noteflow
npm run dev
```

访问 http://localhost:5173 即可使用。

## 生产环境部署

### 1. 安装 PostgreSQL（推荐）

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# 启动服务
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

创建数据库：

```bash
sudo -u postgres psql

# 在 psql 中执行
CREATE DATABASE noteflow;
CREATE USER noteflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;
\q
```

### 2. 构建应用

```bash
# 构建前端
cd ~/projects/noteflow
npm run build

# 构建后端
cd server
npm run build
```

### 3. 配置生产环境

编辑 `server/.env`：

```env
# 服务器配置
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# 前端 URL（生产域名）
FRONTEND_URL=https://your-domain.com

# CORS 允许的域名
CORS_ORIGINS=https://your-domain.com

# PostgreSQL 数据库
DATABASE_URL="postgresql://noteflow_user:your_password@localhost:5432/noteflow?schema=public"

# JWT 密钥（使用强密码！）
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-characters

# 速率限制
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# 邮件配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_FROM=noreply@your-domain.com
```

### 4. 初始化生产数据库

```bash
cd server

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy
```

## 使用 PM2 管理进程

PM2 是一个进程管理器，可以保持应用持续运行。

### 1. 安装 PM2

```bash
sudo npm install -g pm2

# 配置开机自启
pm2 startup
# 按照提示执行生成的命令
```

### 2. 创建 PM2 配置文件

在项目根目录创建 `ecosystem.config.js`：

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

创建日志目录：

```bash
mkdir -p logs
```

### 3. 启动应用

```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存进程列表
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs noteflow-server
```

### 4. PM2 常用命令

```bash
# 重启应用
pm2 restart noteflow-server

# 停止应用
pm2 stop noteflow-server

# 删除应用
pm2 delete noteflow-server

# 监控
pm2 monit

# 查看详细信息
pm2 show noteflow-server
```

## 使用 Nginx 反向代理

### 1. 安装 Nginx

**Ubuntu/Debian:**
```bash
sudo apt-get install -y nginx
```

**CentOS/RHEL:**
```bash
sudo yum install -y nginx
```

### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/noteflow`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /home/user/projects/noteflow/dist;
    index index.html;

    # API 请求转发到后端
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

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/noteflow /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

### 3. 配置 HTTPS（推荐）

使用 Certbot 获取免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

Certbot 会自动修改 Nginx 配置，添加 HTTPS 支持。

## 使用 systemd 管理服务

如果您不想使用 PM2，可以使用 systemd 管理 Node.js 服务。

### 1. 创建 systemd 服务文件

创建 `/etc/systemd/system/noteflow.service`：

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

### 2. 启动服务

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start noteflow

# 开机自启
sudo systemctl enable noteflow

# 查看状态
sudo systemctl status noteflow

# 查看日志
sudo journalctl -u noteflow -f
```

## 防火墙配置

**Ubuntu/Debian (UFW):**

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 或者单独开放端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

**CentOS/RHEL (firewalld):**

```bash
# 开放 HTTP 和 HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重载防火墙
sudo firewall-cmd --reload
```

## 自动备份

创建备份脚本 `/home/user/scripts/backup-noteflow.sh`：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/home/user/backups/noteflow"
DB_NAME="noteflow"
DB_USER="noteflow_user"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/noteflow_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "noteflow_*.sql.gz" -mtime +7 -delete

echo "Backup completed: noteflow_$DATE.sql.gz"
```

添加到 crontab：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /home/user/scripts/backup-noteflow.sh >> /home/user/logs/backup.log 2>&1
```

## 常见问题

### 1. npm install 失败

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 2. 端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :3001
# 或
sudo netstat -tlnp | grep 3001

# 结束进程
kill -9 <PID>
```

### 3. 权限问题

```bash
# 确保项目目录权限正确
sudo chown -R $USER:$USER ~/projects/noteflow

# 如果使用 www-data 用户运行
sudo chown -R www-data:www-data ~/projects/noteflow
```

### 4. Prisma 命令失败

```bash
# 确保 Prisma 客户端已生成
npx prisma generate

# 重新推送数据库
npx prisma db push --force-reset
```

### 5. PM2 无法启动

```bash
# 检查日志
pm2 logs noteflow-server --lines 100

# 检查配置文件路径是否正确
pm2 start ecosystem.config.js --update-env
```

### 6. Nginx 502 Bad Gateway

```bash
# 检查后端服务是否运行
pm2 status
# 或
sudo systemctl status noteflow

# 检查 SELinux（CentOS/RHEL）
sudo setsebool -P httpd_can_network_connect 1
```

## 性能优化建议

### 1. Node.js 优化

在 PM2 配置中增加实例数（集群模式）：

```javascript
instances: 'max', // 或具体数字，如 4
exec_mode: 'cluster'
```

### 2. Nginx 优化

编辑 `/etc/nginx/nginx.conf`：

```nginx
worker_processes auto;
worker_connections 1024;
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
```

### 3. PostgreSQL 优化

编辑 `/etc/postgresql/14/main/postgresql.conf`：

```
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

## 下一步

- 配置监控告警：参考 [MONITORING.md](MONITORING.md)
- 性能优化：参考 [OPTIMIZATION.md](OPTIMIZATION.md)
- 安全加固：参考 [SECURITY.md](SECURITY.md)
