# Windows 部署指南

本文档指导您在 Windows 环境下部署 NoteFlow 应用。

## 目录

- [环境要求](#环境要求)
- [开发环境搭建](#开发环境搭建)
- [生产环境部署](#生产环境部署)
- [使用 PM2 管理进程](#使用-pm2-管理进程)
- [使用 IIS 反向代理](#使用-iis-反向代理)
- [常见问题](#常见问题)

## 环境要求

- Windows 10/11 或 Windows Server 2016+
- Node.js 18.0.0 或更高版本
- PostgreSQL 14+（可选，默认使用 SQLite）
- Git

## 开发环境搭建

### 1. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或更高）
3. 运行安装程序，按照向导完成安装
4. 验证安装：

```powershell
node --version
npm --version
```

### 2. 安装 Git

1. 访问 [Git 官网](https://git-scm.com/download/win)
2. 下载并运行安装程序
3. 验证安装：

```powershell
git --version
```

### 3. 克隆项目

```powershell
# 打开 PowerShell 或 CMD
cd C:\Projects

# 克隆仓库
git clone https://github.com/your-username/noteflow.git
cd noteflow
```

### 4. 安装依赖

```powershell
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 5. 配置环境变量

```powershell
# 复制配置模板
copy .env.example .env
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

```powershell
cd server

# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表
npx prisma db push
```

### 7. 启动开发服务器

打开两个终端窗口：

**终端 1 - 后端：**
```powershell
cd C:\Projects\noteflow\server
npm run dev
```

**终端 2 - 前端：**
```powershell
cd C:\Projects\noteflow
npm run dev
```

访问 http://localhost:5173 即可使用。

## 生产环境部署

### 1. 安装 PostgreSQL（推荐）

1. 下载 [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)
2. 运行安装程序
3. 使用 pgAdmin 或命令行创建数据库：

```sql
CREATE DATABASE noteflow;
CREATE USER noteflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE noteflow TO noteflow_user;
```

### 2. 构建应用

```powershell
# 构建前端
cd C:\Projects\noteflow
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

```powershell
cd server

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy
```

## 使用 PM2 管理进程

PM2 是一个进程管理器，可以保持应用持续运行。

### 1. 安装 PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# 配置开机自启
pm2-startup install
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
      max_memory_restart: '1G'
    }
  ]
};
```

### 3. 启动应用

```powershell
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

```powershell
# 重启应用
pm2 restart noteflow-server

# 停止应用
pm2 stop noteflow-server

# 删除应用
pm2 delete noteflow-server

# 监控
pm2 monit
```

## 使用 IIS 反向代理

### 1. 安装 IIS

1. 打开「控制面板」→「程序」→「启用或关闭 Windows 功能」
2. 勾选「Internet Information Services」
3. 点击确定完成安装

### 2. 安装 URL Rewrite 和 ARR

1. 下载并安装 [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2. 下载并安装 [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing)

### 3. 配置 IIS 站点

1. 打开 IIS 管理器
2. 右键「网站」→「添加网站」
3. 配置：
   - 网站名称：NoteFlow
   - 物理路径：`C:\Projects\noteflow\dist`
   - 端口：80（或其他端口）

### 4. 配置反向代理

在站点根目录创建 `web.config`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- API 请求转发到后端 -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
        </rule>
        <!-- 前端路由处理 -->
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

### 5. 配置 HTTPS（推荐）

1. 获取 SSL 证书（自签名或 CA 签发）
2. 在 IIS 管理器中绑定 HTTPS（端口 443）
3. 配置 HTTP 到 HTTPS 重定向

## 防火墙配置

```powershell
# 开放端口 80
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=tcp localport=80

# 开放端口 443
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=tcp localport=443

# 如果不使用反向代理，开放后端端口
netsh advfirewall firewall add rule name="NoteFlow API" dir=in action=allow protocol=tcp localport=3001
```

## 常见问题

### 1. npm install 失败

```powershell
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
Remove-Item -Recurse -Force node_modules
npm install
```

### 2. 端口被占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3001

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### 3. Prisma 命令失败

```powershell
# 确保 Prisma 客户端已生成
npx prisma generate

# 重新推送数据库
npx prisma db push --force-reset
```

### 4. PM2 无法启动

```powershell
# 检查日志
pm2 logs noteflow-server --lines 100

# 检查配置文件路径是否正确
pm2 start ecosystem.config.js --update-env
```

## 下一步

- 配置定时备份：参考 [BACKUP.md](BACKUP.md)
- 配置监控告警：参考 [MONITORING.md](MONITORING.md)
- 性能优化：参考 [OPTIMIZATION.md](OPTIMIZATION.md)
