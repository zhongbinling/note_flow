# 贡献指南

感谢您有兴趣为 NoteFlow 做贡献！本文档提供了贡献的指南和说明。

## 目录

- [行为准则](#行为准则)
- [快速开始](#快速开始)
- [开发环境配置](#开发环境配置)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [报告 Bug](#报告-bug)
- [功能请求](#功能请求)

## 行为准则

参与本项目即表示您同意保持尊重和包容的环境。请体谅他人并遵循标准的开源社区准则。

## 快速开始

1. Fork 本仓库
2. 克隆您的 Fork 到本地
3. 安装依赖：`npm install`
4. 启动开发服务器：`npm run dev`
5. 创建功能分支：`git checkout -b feature/your-feature-name`

## 开发环境配置

### 环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本（或 yarn/pnpm）

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 可用脚本

| 脚本 | 描述 |
|--------|-------------|
| `npm run dev` | 启动开发服务器（端口 5173） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint |
| `npm run test:e2e` | 运行 Playwright E2E 测试 |
| `npm run test:e2e:ui` | 带 Playwright UI 运行测试 |
| `npm run test:e2e:debug` | 调试测试 |
| `npm run test:e2e:report` | 查看测试报告 |

## 项目结构

```
noteflow/
├── src/
│   ├── components/
│   │   ├── Editor/          # 编辑器相关组件
│   │   │   ├── MarkdownEditor.tsx
│   │   │   └── Outline.tsx
│   │   ├── Layout/          # 布局组件
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── NoteList/        # 笔记列表组件
│   │   └── common/          # 共享/可复用组件
│   ├── store/               # Zustand 状态存储
│   │   ├── noteStore.ts
│   │   └── themeStore.ts
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── tests/                   # E2E 测试
├── public/                  # 静态资源
└── ...配置文件
```

## 代码规范

### TypeScript

- 所有新文件使用 TypeScript
- 在 `src/types/` 中定义类型，或为本地类型内联定义
- 尽可能避免使用 `any` 类型
- 使用类型导入：`import type { ... }`

### React

- 使用函数组件和 Hooks
- 需要时使用 `useCallback` 和 `useMemo` 进行性能优化
- 保持组件专注和单一职责
- 将可复用逻辑提取到自定义 Hooks

### 样式

- 使用 Tailwind CSS 实用类
- 遵循现有命名约定
- 使用 `dark:` 变体支持暗色模式

### 代码风格

- 提交前运行 `npm run lint`
- 修复所有 lint 错误
- 使用有意义的变量和函数名
- 为复杂逻辑添加注释

## 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

### 格式

```
<type>(<scope>): <description>

[可选的正文]

[可选的脚注]
```

### 类型

| 类型 | 描述 |
|------|-------------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更改 |
| `style` | 代码风格更改（格式化等） |
| `refactor` | 代码重构 |
| `perf` | 性能改进 |
| `test` | 添加或更新测试 |
| `chore` | 构建流程或辅助工具更改 |

### 示例

```
feat(editor): 添加图片拖拽上传支持
fix(outline): 修复预览模式下的滚动位置
docs(readme): 更新安装说明
```

## Pull Request 流程

1. **创建分支**：使用描述性的分支名（如 `feat/image-upload`、`fix/outline-scroll`）

2. **进行更改**：遵循代码规范，编写整洁的代码

3. **测试您的更改**：
   - 运行 `npm run lint` 检查 lint 错误
   - 运行 `npm run test:e2e` 确保测试通过
   - 在浏览器中手动测试

4. **提交更改**：遵循提交规范

5. **推送到您的 Fork**：`git push origin your-branch-name`

6. **创建 Pull Request**：
   - 提供清晰的更改描述
   - 引用任何相关 issue
   - UI 更更请包含截图
   - 确保 CI 通过

7. **代码审查**：处理维护者的反馈

8. **合并**：一旦批准，维护者将合并您的 PR

## 报告 Bug

### 提交前

1. 检查 [Issues](https://github.com/zhongbinling/noteflow/issues) 中是否已有相同 Bug 报告
2. 尝试使用最新版本复现 Bug
3. 收集相关信息（浏览器、操作系统、复现步骤）

### 提交 Bug 报告

使用 Bug 报告模板并包含：

- **描述**：清晰的 Bug 描述
- **复现步骤**：详细的步骤
- **期望行为**：应该发生什么
- **实际行为**：实际发生了什么
- **截图**：如适用
- **环境**：浏览器、操作系统、Node.js 版本

## 功能请求

我们欢迎功能请求！请：

1. 检查是否已有相同的功能请求
2. 使用功能请求模板
3. 提供清晰的功能描述
4. 解释用例和好处
5. 考虑包含原型或图表

---

感谢您为 NoteFlow 做贡献！

---

<p align="center">
  <a href="CONTRIBUTING.md">English</a> | <b>简体中文</b>
</p>
