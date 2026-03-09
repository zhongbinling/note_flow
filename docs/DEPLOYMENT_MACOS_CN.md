# macOS 部署指南

本文档指导您在 macOS 环境下部署 NoteFlow 应用。

## 目录

- [环境要求](#环境要求)
- [开发环境搭建](#开发环境搭建)
- [生产环境部署](#生产环境部署)
- [使用 PM2 管理进程](#使用-pm2-管理进程)
- [使用 Nginx 反向代理](#使用-nginx-反向代理)
- [使用 launchd 管理服务](#使用-launchd-管理服务)
- [常见问题](#常见问题)

## 环境要求

- macOS 12 (Monterey) 或更高版本
- Node.js 18.0.0 或更高版本
- PostgreSQL 14+（可选，默认使用 SQLite）
- Git

## 开发环境搭建

### 1. 安装 Homebrew（如未安装）

Homebrew 是 macOS 上常用的包管理器。

```bash
# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 验证安装
brew --version
```

### 2. 安装 Node.js

**方法一：使用 Homebrew（推荐）**

```bash
brew install node@20

# 如果需要添加到 PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 验证安装
node --version
npm --version
```

**方法二：使用 nvm（Node Version Manager）**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.zshrc

# 安装 Node.js
nvm install 20
nvm use 20
nvm alias default 20

# 验证安装
node --version
npm --version
```

### 3. 安装 Git

```bash
# 使用 Homebrew 安装
brew install git

# 或安装 Xcode Command Line Tools（包含 Git）
xcode-select --install

# 验证安装
git --version
```

### 4. 克隆项目

```bash
# 创建项目目录
mkdir -p ~/projects
cd ~/projects

# 克隆仓库
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 5. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 6. 配置环境变量

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

### 7. 初始化数据库

```bash
cd server

# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表
npx prisma db push
```

### 8. 启动开发服务器

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

```bash
# 使用 Homebrew 安装
brew install postgresql@14

# 启动服务
brew services start postgresql@14

# 创建数据库
createdb noteflow

# 或使用 psql 创建用户和数据库
psql postgres
```

在 psql 中执行：

```sql
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

### 3. 配置开机自启

```bash
# 生成启动脚本
pm2 startup

# 按照提示执行输出的命令，类似于：
# sudo env PATH=$PATH:/opt/homebrew/bin pm2 startup launchd -u username --hp /Users/username
```

### 4. 启动应用

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

### 5. PM2 常用命令

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

```bash
brew install nginx
```

### 2. 配置 Nginx

编辑配置文件 `/opt/homebrew/etc/nginx/nginx.conf` 或创建单独的配置：

```nginx
server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    root /Users/username/projects/noteflow/dist;
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

### 3. 启动 Nginx

```bash
# 测试配置
nginx -t

# 启动 Nginx
brew services start nginx

# 或手动启动
nginx

# 重载配置
nginx -s reload
```

### 4. 配置 HTTPS（推荐）

**使用自签名证书（开发/测试）：**

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/homebrew/etc/nginx/selfsigned.key \
  -out /opt/homebrew/etc/nginx/selfsigned.crt

# 在 Nginx 配置中添加 HTTPS
```

```nginx
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /opt/homebrew/etc/nginx/selfsigned.crt;
    ssl_certificate_key /opt/homebrew/etc/nginx/selfsigned.key;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}
```

**使用 Certbot（正式域名）：**

```bash
# 安装 Certbot
brew install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 在 Nginx 中配置证书路径
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

## 使用 launchd 管理服务

如果您不想使用 PM2，可以使用 macOS 原生的 launchd 管理 Node.js 服务。

### 1. 创建 plist 文件

创建 `~/Library/LaunchAgents/com.noteflow.server.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.noteflow.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/username/projects/noteflow/server/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/username/projects/noteflow/server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/username/projects/noteflow/logs/out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/username/projects/noteflow/logs/error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3001</string>
    </dict>
</dict>
</plist>
```

### 2. 加载和启动服务

```bash
# 创建日志目录
mkdir -p ~/projects/noteflow/logs

# 加载服务
launchctl load ~/Library/LaunchAgents/com.noteflow.server.plist

# 启动服务
launchctl start com.noteflow.server

# 查看服务状态
launchctl list | grep noteflow

# 停止服务
launchctl stop com.noteflow.server

# 卸载服务
launchctl unload ~/Library/LaunchAgents/com.noteflow.server.plist
```

## 防火墙配置

### 1. 查看防火墙状态

```bash
# 查看防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### 2. 允许端口

```bash
# 允许特定端口（如需要）
# 注意：macOS 防火墙默认是应用程序级别的
# 通常不需要手动开放端口，除非使用非标准配置
```

## 自动备份

创建备份脚本 `~/scripts/backup-noteflow.sh`：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="$HOME/backups/noteflow"
DB_NAME="noteflow"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump $DB_NAME | gzip > $BACKUP_DIR/noteflow_$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "noteflow_*.sql.gz" -mtime +7 -delete

echo "Backup completed: noteflow_$DATE.sql.gz"
```

添加到 crontab：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * $HOME/scripts/backup-noteflow.sh >> $HOME/logs/backup.log 2>&1
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
lsof -i :3001

# 结束进程
kill -9 <PID>
```

### 3. 权限问题

```bash
# 确保项目目录权限正确
sudo chown -R $(whoami) ~/projects/noteflow

# 修复 npm 权限问题
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /opt/homebrew/lib/node_modules
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

### 6. Nginx 启动失败

```bash
# 检查配置语法
nginx -t

# 检查端口占用
lsof -i :80
lsof -i :443

# 查看 Nginx 错误日志
tail -f /opt/homebrew/var/log/nginx/error.log
```

### 7. Homebrew 服务无法启动

```bash
# 查看服务状态
brew services list

# 重启服务
brew services restart nginx
brew services restart postgresql@14

# 查看服务信息
brew services info nginx
```

## 性能优化建议

### 1. Node.js 优化

在 PM2 配置中增加实例数：

```javascript
instances: 'max', // 或具体数字
exec_mode: 'cluster'
```

### 2. Nginx 优化

编辑 `/opt/homebrew/etc/nginx/nginx.conf`：

```nginx
worker_processes auto;
worker_connections 1024;
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
```

### 3. PostgreSQL 优化

编辑 `/opt/homebrew/var/postgresql@14`：

```
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
```

## 开发工具推荐

- **Visual Studio Code**：代码编辑器
- **Postico**：PostgreSQL 客户端
- **TablePlus**：数据库管理工具
- **Postman**：API 测试工具
- **iTerm2**：增强终端

```bash
# 使用 Homebrew 安装
brew install --cask visual-studio-code
brew install --cask postico
brew install --cask tableplus
brew install --cask postman
brew install --cask iterm2
```

## 下一步

- 配置监控告警：参考 [MONITORING.md](MONITORING.md)
- 性能优化：参考 [OPTIMIZATION.md](OPTIMIZATION.md)
- 安全加固：参考 [SECURITY.md](SECURITY.md)
