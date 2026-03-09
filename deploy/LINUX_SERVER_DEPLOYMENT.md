# Linux 服务器部署指南

## 服务器信息

- **IP**: 139.196.210.184
- **用户**: zhongbl
- **系统**: 需要确认（Ubuntu/CentOS）

## 部署步骤

### 方法一：一键部署脚本

#### 1. SSH 登录服务器

```bash
ssh zhongbl@139.196.210.184
# 输入密码: ilyDD@@00
```

#### 2. 切换到 root 用户

```bash
sudo su -
# 或输入当前用户密码
```

#### 3. 下载并运行部署脚本

```bash
# 下载部署脚本
curl -o deploy-linux.sh https://raw.githubusercontent.com/zhongbinling/note_flow/main/deploy/deploy-linux.sh

# 添加执行权限
chmod +x deploy-linux.sh

# 设置域名（修改为您的实际域名）
export DOMAIN=your-domain.com
export ADMIN_EMAIL=your-email@example.com

# 运行部署脚本
./deploy-linux.sh

# 如果需要自动配置 SSL，运行：
# ./deploy-linux.sh --ssl
```

---

### 方法二：手动部署

#### 1. 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 3. 创建数据库

```bash
sudo -u postgres psql

# 在 psql 中执行
CREATE DATABASE noteflow;
CREATE USER noteflow_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;
ALTER USER noteflow_user CREATEDB;
\q
```

#### 4. 克隆项目

```bash
sudo mkdir -p /opt/noteflow
sudo chown $USER:$USER /opt/noteflow
cd /opt/noteflow

git clone https://github.com/zhongbinling/note_flow.git .
```

#### 5. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd server
npm install
cd ..
```

#### 6. 配置环境变量

```bash
# 生成 JWT 密钥
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 创建 .env 文件
cat > server/.env << EOF
PORT=3001
NODE_ENV=production
HOST=0.0.0.0
FRONTEND_URL=http://139.196.210.184
CORS_ORIGINS=http://139.196.210.184
DATABASE_URL="postgresql://noteflow_user:your_secure_password@localhost:5432/noteflow?schema=public"
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
RESET_TOKEN_EXPIRY=3600000
EOF
```

#### 7. 初始化数据库

```bash
cd server
npx prisma generate
npx prisma migrate deploy
cd ..
```

#### 8. 构建应用

```bash
# 构建前端
npm run build

# 构建后端
cd server
npm run build
cd ..
```

#### 9. 安装 PM2

```bash
sudo npm install -g pm2

# 创建 PM2 配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
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
    max_memory_restart: '1G'
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令
```

#### 10. 配置 Nginx

```bash
# 安装 Nginx
sudo apt-get install -y nginx  # Ubuntu
# 或
sudo yum install -y nginx      # CentOS

# 创建配置文件
sudo cat > /etc/nginx/sites-available/noteflow << 'EOF'
server {
    listen 80;
    server_name 139.196.210.184;

    root /opt/noteflow/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/noteflow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试并重启
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx
```

#### 11. 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 验证部署

### 1. 检查服务状态

```bash
# 检查 PM2
pm2 status

# 检查 Nginx
sudo systemctl status nginx

# 检查 PostgreSQL
sudo systemctl status postgresql
```

### 2. 查看日志

```bash
# 应用日志
pm2 logs noteflow-server

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 3. 访问应用

打开浏览器访问: `http://139.196.210.184`

---

## 常用运维命令

```bash
# 重启应用
pm2 restart noteflow-server

# 查看日志
pm2 logs noteflow-server --lines 100

# 查看状态
pm2 monit

# 更新代码
cd /opt/noteflow
git pull
npm install
cd server && npm install && npx prisma generate
cd .. && npm run build
cd server && npm run build && cd ..
pm2 restart noteflow-server
```

---

## 故障排除

### 端口被占用

```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U noteflow_user -d noteflow -h localhost
```

### Nginx 502 错误

```bash
# 检查后端是否运行
pm2 status

# 检查 SELinux (CentOS)
sudo setsebool -P httpd_can_network_connect 1
```
