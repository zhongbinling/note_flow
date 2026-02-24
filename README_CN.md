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

### 安装

```bash
# 克隆仓库
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用将在 `http://localhost:5173` 运行

### 生产构建

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 样式 | Tailwind CSS |
| 编辑器 | CodeMirror |
| Markdown 解析 | marked |
| HTML 转 Markdown | Turndown |
| 状态管理 | Zustand |
| 图标 | Lucide React |
| E2E 测试 | Playwright |

## 项目结构

```
noteflow/
├── src/
│   ├── components/
│   │   ├── Editor/          # Markdown 编辑器组件
│   │   ├── Layout/          # 布局组件（侧边栏、顶部栏）
│   │   ├── NoteList/        # 笔记列表组件
│   │   └── common/          # 共享组件
│   ├── store/               # Zustand 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 入口文件
├── tests/                   # Playwright E2E 测试
├── public/                  # 静态资源
└── ...配置文件
```

## 脚本命令

| 命令 | 描述 |
|---------|-------------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint |
| `npm run test:e2e` | 运行 E2E 测试 |
| `npm run test:e2e:ui` | 带界面的 E2E 测试 |
| `npm run test:e2e:report` | 查看测试报告 |

## 开发路线

### 第一阶段（当前 - MVP）
- [x] 多模式 Markdown 编辑器
- [x] 基于文件夹的组织
- [x] 全文搜索
- [x] 暗色模式
- [x] 导入导出

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

---

<p align="center">
  由 <a href="https://github.com/zhongbinling">zhongbinling</a> 用 ❤️ 构建
</p>
