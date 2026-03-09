# Linux 服务器部署指南

## 目录

- [快速部署](#快速部署)
- [部署选项](#部署选项)
- [手动部署](#手动部署)
- [HTTPS 配置](#https-配置)
- [数据库管理](#数据库管理)
- [常用运维命令](#常用运维命令)
- [故障排除](#故障排除)

---

## 快速部署

### 一键部署（HTTP）

```bash
# 1. SSH 登录服务器
ssh root@139.196.210.184

# 2. 下载并运行部署脚本
curl -o deploy-linux.sh https://raw.githubusercontent.com/zhongbinling/note_flow/main/deploy/deploy-linux.sh
chmod +x deploy-linux.sh
./deploy-linux.sh 139.196.210.184
```

### 一键部署（HTTPS）

```bash
# 使用 IP 地址（自签名证书）
./deploy-linux.sh 139.196.210.184 --https

# 使用域名（Let's Encrypt 免费证书）
./deploy-linux.sh noteflow.example.com --https
```

---

## 部署选项

| 参数 | 说明 | 示例 |
|------|------|------|
| `DOMAIN` | 服务器 IP 或域名 | `139.196.210.184` 或 `noteflow.example.com` |
| `--https` | 启用 HTTPS | `./deploy-linux.sh 139.196.210.184 --https` |

### HTTPS 证书类型

| 场景 | 证书类型 | 说明 |
|------|---------|------|
| IP 地址 | 自签名证书 | 浏览器会显示安全警告，点击继续即可 |
| 域名 | Let's Encrypt | 免费，自动续期，受浏览器信任 |

---

## 手动部署

### 1. 安装依赖

```bash
# Ubuntu/Debian
apt-get update
apt-get install -y curl git nginx openssl

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 PostgreSQL
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 安装 PM2
npm install -g pm2
```

### 2. 创建数据库

```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE noteflow;
CREATE USER noteflow_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;
ALTER USER noteflow_user CREATEDB;
\c noteflow
CREATE SCHEMA IF NOT EXISTS noteflow AUTHORIZATION noteflow_user;
GRANT ALL ON SCHEMA noteflow TO noteflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA noteflow TO noteflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA noteflow TO noteflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA noteflow GRANT ALL ON TABLES TO noteflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA noteflow GRANT ALL ON SEQUENCES TO noteflow_user;
EOF
```

### 3. 克隆项目

```bash
cd /opt
git clone https://github.com/zhongbinling/note_flow.git noteflow
cd noteflow
```

### 4. 安装依赖并构建

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 配置环境变量
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
cat > server/.env << EOF
PORT=3001
NODE_ENV=production
HOST=0.0.0.0
FRONTEND_URL=https://139.196.210.184
CORS_ORIGINS=https://139.196.210.184,http://139.196.210.184
DATABASE_URL="postgresql://noteflow_user:your_secure_password@localhost:5432/noteflow?schema=noteflow"
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
RESET_TOKEN_EXPIRY=3600000
EOF

# 初始化数据库
cd server
npx prisma generate
npx prisma db push --accept-data-loss
cd ..

# 构建应用
npm run build
cd server && npm run build && cd ..
```

### 5. 配置 PM2

```bash
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'noteflow-server',
    cwd: './server',
    script: 'npm',
    args: 'run start',
    env: { NODE_ENV: 'production', PORT: 3001 },
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
EOF

mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | bash
```

---

## HTTPS 配置

### 方案1：自签名证书（适用于 IP 地址）

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/noteflow.key \
  -out /etc/ssl/certs/noteflow.crt \
  -subj "/CN=139.196.210.184"

chmod 600 /etc/ssl/private/noteflow.key
```

### 方案2：Let's Encrypt（适用于域名）

```bash
# 确保域名已解析到服务器 IP
# 安装 certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d noteflow.example.com --non-interactive --agree-tos -m admin@example.com

# 测试自动续期
certbot renew --dry-run
```

### Nginx HTTPS 配置

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name 139.196.210.184;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name 139.196.210.184;

    # SSL 证书（自签名或 Let's Encrypt）
    ssl_certificate /etc/ssl/certs/noteflow.crt;
    ssl_certificate_key /etc/ssl/private/noteflow.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    root /opt/noteflow/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # 静态资源
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # SPA 路由
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }
}
```

### 证书续期

```bash
# 自签名证书续期（1年有效期）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/noteflow.key \
  -out /etc/ssl/certs/noteflow.crt \
  -subj "/CN=139.196.210.184" && \
systemctl reload nginx

# Let's Encrypt 自动续期已配置，手动续期：
certbot renew && systemctl reload nginx
```

---

## 数据库管理

### 连接数据库

```bash
# 命令行连接
psql -h localhost -U noteflow_user -d noteflow
# 密码: noteflow_secure_2024（或您设置的密码）

# 常用 SQL
\dt                    # 列出所有表
SELECT * FROM "User";  # 查看用户
SELECT * FROM "Note";  # 查看笔记
SELECT * FROM "Folder"; # 查看文件夹
\q                     # 退出
```

### 数据库备份与恢复

```bash
# 备份
pg_dump -U noteflow_user -d noteflow > backup_$(date +%Y%m%d).sql

# 恢复
psql -U noteflow_user -d noteflow < backup_20260310.sql
```

### 远程连接（通过 SSH 隧道）

```bash
# 在本地电脑建立 SSH 隧道
ssh -L 5433:localhost:5432 root@139.196.210.184

# 然后使用 GUI 工具连接
# Host: localhost
# Port: 5433
# Database: noteflow
# User: noteflow_user
```

---

## 常用运维命令

### 服务管理

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs noteflow-server
pm2 logs noteflow-server --lines 100

# 重启服务
pm2 restart noteflow-server

# 停止服务
pm2 stop noteflow-server

# 监控
pm2 monit
```

### Nginx 管理

```bash
# 测试配置
nginx -t

# 重载配置
systemctl reload nginx

# 查看状态
systemctl status nginx

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 更新部署

```bash
cd /opt/noteflow
git pull origin main
npm install
cd server && npm install && npx prisma generate && cd ..
npm run build
cd server && npm run build && cd ..
pm2 restart noteflow-server
```

### 防火墙配置

```bash
# Ubuntu (UFW)
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# CentOS (firewalld)
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

---

## 故障排除

### 端口被占用

```bash
# 查找占用进程
lsof -i :3001
# 或
netstat -tlnp | grep 3001

# 终止进程
kill -9 <PID>
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
systemctl status postgresql

# 测试连接
psql -U noteflow_user -d noteflow -h localhost

# 检查权限（PostgreSQL 15+）
sudo -u postgres psql -d noteflow -c "GRANT ALL ON SCHEMA noteflow TO noteflow_user;"
```

### Nginx 502 错误

```bash
# 检查后端是否运行
pm2 status
curl http://localhost:3001/api/health

# 检查 SELinux (CentOS)
setsebool -P httpd_can_network_connect 1
```

### 页面空白

```bash
# 检查前端构建
ls -la /opt/noteflow/dist/

# 检查 Nginx 错误日志
tail -20 /var/log/nginx/error.log

# 清除浏览器缓存后重试
```

### HTTPS 证书问题

```bash
# 检查证书
openssl s_client -connect 139.196.210.184:443 2>/dev/null | openssl x509 -noout -dates

# 检查 Nginx SSL 配置
nginx -t
```

---

## 安全建议

1. **修改默认密码**：更改数据库密码和 JWT 密钥
2. **配置防火墙**：只开放必要端口（80, 443, 22）
3. **定期备份**：设置自动备份计划
4. **更新系统**：定期更新操作系统和依赖包
5. **启用 HTTPS**：生产环境强烈建议使用 HTTPS
6. **配置邮件服务**：如需密码重置功能，配置 SMTP

---

## 联系支持

如有问题，请访问 GitHub Issues: https://github.com/zhongbinling/note_flow/issues
