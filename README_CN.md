# NoteFlow

<p align="center">
  <strong>一款美观、强大且易用的笔记应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.3.1-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.19-06B6D4?logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <a href="https://zhongbinling.github.io/note_flow/"><img src="https://img.shields.io/badge/Demo-Live-brightgreen" alt="Live Demo"></a>
</p>

<p align="center">
  <a href="https://zhongbinling.github.io/note_flow/">🎮 在线体验</a>
</p>

<p align="center">
  <a href="README.md">English</a> | <b>简体中文</b>
</p>

---

## 功能特性

### 编辑器
- **多种编辑模式**：编辑模式、分屏模式、预览模式、富文本模式（所见即所得）
- **Markdown 支持**：完整的 Markdown 语法，实时预览
- **代码高亮**：代码块语法高亮
- **格式工具栏**：粗体、斜体、标题、列表、引用、代码、链接、图片
- **图片支持**：粘贴或上传图片，自动压缩（>10KB）
- **自动保存**：防抖保存，防止数据丢失

### 组织管理
- **文件夹管理**：创建、重命名、删除文件夹
- **笔记组织**：在文件夹之间移动笔记
- **全文搜索**：搜索标题、内容、标签，高亮显示结果

### 云端同步（新功能！）
- **用户认证**：安全的注册和登录（JWT）
- **云端存储**：在所有设备间同步笔记
- **密码找回**：通过邮件重置密码
- **离线支持**：离线可用，联网时自动同步

### 用户体验
- **暗色模式**：完整的暗色主题支持
- **大纲导航**：快速跳转到文档标题
- **响应式设计**：适配不同屏幕尺寸
- **导入导出**：导出为 Markdown 或 JSON，随时导入

## 截图

> 截图即将添加

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 快速开始（开发环境）

```bash
# 克隆仓库
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置您的设置

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动后端（终端1）
cd server
npm run dev

# 启动前端（终端2）
cd ..
npm run dev
```

应用将在 `http://localhost:5173` 运行

## 部署

**快速部署指南:** [DEPLOYMENT_GUIDE_CN.md](docs/DEPLOYMENT_GUIDE_CN.md) / [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

各平台详细部署指南：

| 平台 | 中文 | English |
|------|------|---------|
| 🚀 快速指南 | [DEPLOYMENT_GUIDE_CN.md](docs/DEPLOYMENT_GUIDE_CN.md) | [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) |
| 🪟 Windows | [DEPLOYMENT_WINDOWS_CN.md](docs/DEPLOYMENT_WINDOWS_CN.md) | [DEPLOYMENT_WINDOWS.md](docs/DEPLOYMENT_WINDOWS.md) |
| 🐧 Linux | [DEPLOYMENT_LINUX_CN.md](docs/DEPLOYMENT_LINUX_CN.md) | [DEPLOYMENT_LINUX.md](docs/DEPLOYMENT_LINUX.md) |
| 🍎 macOS | [DEPLOYMENT_MACOS_CN.md](docs/DEPLOYMENT_MACOS_CN.md) | [DEPLOYMENT_MACOS.md](docs/DEPLOYMENT_MACOS.md) |
| 🐳 Docker | [DEPLOYMENT_DOCKER_CN.md](docs/DEPLOYMENT_DOCKER_CN.md) | [DEPLOYMENT_DOCKER.md](docs/DEPLOYMENT_DOCKER.md) |

**推荐的免费托管平台：**
- **[Render](https://render.com)** - 免费 Web 服务 + PostgreSQL 数据库
- **[Railway](https://railway.app)** - 每月 $5 免费额度
- **[Vercel](https://vercel.com)** - 免费无服务器部署

### 生产构建

```bash
# 构建前端
npm run build

# 构建后端
cd server
npm run build

# 启动生产服务器
npm run start
```

构建产物将生成在 `dist` 目录中。

## 配置

### 后端 (.env)

```env
# 服务器
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/noteflow"

# JWT
JWT_SECRET=your-secure-random-secret
JWT_EXPIRES_IN=7d

# 邮件（用于密码重置）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

详细配置选项请参阅 [CONFIGURATION_CN.md](docs/CONFIGURATION_CN.md) / [CONFIGURATION.md](docs/CONFIGURATION.md)。

## API 参考

详细 API 文档请参阅 [API_REFERENCE_CN.md](docs/API_REFERENCE_CN.md) / [API_REFERENCE.md](docs/API_REFERENCE.md)。

### 主要接口

| 方法 | 路径 | 描述 |
|--------|------|-------------|
| POST | /api/auth/register | 注册新用户 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/forgot-password | 请求密码重置 |
| POST | /api/auth/reset-password | 重置密码 |
| GET | /api/notes | 获取笔记列表 |
| POST | /api/notes | 创建笔记 |
| GET | /api/folders | 获取文件夹列表 |
| GET | /api/sync/pull | 拉取同步数据 |
| POST | /api/sync/push | 推送同步数据 |

## 技术栈

### 前端
| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 路由 | React Router |
| 编辑器 | CodeMirror |
| 图标 | Lucide React |

### 后端
| 类别 | 技术 |
|------|------|
| 运行时 | Node.js |
| 框架 | Express.js |
| 数据库 | SQLite / PostgreSQL |
| ORM | Prisma |
| 认证 | JWT |
| 邮件 | Nodemailer |

## 项目结构

```
noteflow/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── stores/             # Zustand 状态管理
│   ├── services/           # API 服务
│   └── pages/              # 页面组件
├── server/                 # 后端源码
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # Express 中间件
│   │   └── config/         # 配置
│   └── prisma/             # 数据库模型
├── docs/                   # 文档
└── dist/                   # 构建产物
```

## 脚本命令

| 命令 | 描述 |
|---------|-------------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint |
| `cd server && npm run dev` | 启动后端服务器 |
| `cd server && npm run build` | 构建后端 |
| `cd server && npm run start` | 启动生产后端 |

## 开发路线

### 第一阶段（当前 - MVP）
- [x] 多模式 Markdown 编辑器
- [x] 基于文件夹的组织
- [x] 全文搜索
- [x] 暗色模式
- [x] 导入导出
- [x] 云端同步与认证
- [x] 邮件密码重置

### 第二阶段
- [ ] 双向链接 `[[笔记名称]]`
- [ ] 反向链接面板
- [ ] 标签系统
- [ ] 知识图谱可视化

### 第三阶段
- [ ] AI 写作助手
- [ ] 多 AI 模型支持
- [ ] 本地模型支持（Ollama）

### 第四阶段
- [ ] Electron 桌面应用
- [ ] 本地文件系统访问
- [ ] 插件系统

## 贡献

欢迎参与贡献！详情请参阅 [贡献指南](CONTRIBUTING_CN.md)。

## 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [CodeMirror](https://codemirror.net/) - 强大的文本编辑器
- [marked](https://marked.js.org/) - Markdown 解析器
- [Lucide](https://lucide.dev/) - 精美的图标库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Prisma](https://www.prisma.io/) - 下一代 ORM

---

<p align="center">
  由 <a href="https://github.com/zhongbinling">zhongbinling</a> 用 ❤️ 构建
</p>
