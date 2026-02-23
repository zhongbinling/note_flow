# NoteFlow Playwright 测试环境配置指南

## 1. 安装 Playwright

```bash
# 进入项目目录
cd d:/work/claude_code/cc_test/noteflow

# 安装 Playwright 及其依赖
npm install -D @playwright/test

# 安装浏览器（Chromium）
npx playwright install chromium

# 如果需要安装所有浏览器
# npx playwright install
```

## 2. 配置文件说明

已创建的文件：

| 文件 | 说明 |
|------|------|
| `playwright.config.ts` | Playwright 配置文件 |
| `tests/noteflow.spec.ts` | E2E 测试用例 |

### playwright.config.ts 关键配置

```typescript
{
  testDir: './tests',           // 测试目录
  baseURL: 'http://localhost:5180',  // 应用地址
  screenshot: 'only-on-failure',     // 失败时截图
  video: 'retain-on-failure',        // 失败时保留视频
}
```

## 3. 安装后验证

### 方式一：运行所有测试
```bash
npm run test:e2e
```

### 方式二：使用 UI 模式（推荐）
```bash
npm run test:e2e:ui
```

### 方式三：调试模式
```bash
npm run test:e2e:debug
```

### 方式四：查看测试报告
```bash
npm run test:e2e:report
```

## 4. NPM Scripts

| 命令 | 说明 |
|------|------|
| `npm run test:e2e` | 运行所有 E2E 测试 |
| `npm run test:e2e:ui` | 使用 Playwright UI 运行测试 |
| `npm run test:e2e:debug` | 调试模式运行测试 |
| `npm run test:e2e:report` | 查看 HTML 测试报告 |

## 5. 测试覆盖范围

当前测试用例覆盖：

- ✅ 页面正常加载
- ✅ 笔记列表展示
- ✅ 新增笔记
- ✅ 编辑笔记内容
- ✅ 切换预览模式（Edit/Split/Preview）
- ✅ 编辑器滚动功能
- ✅ 预览区域滚动功能
- ✅ 文件夹切换
- ✅ 搜索功能
- ✅ 暗色模式切换
- ✅ 导出/导入按钮存在

## 6. 注意事项

1. **开发服务器**：测试会自动启动 `npm run dev`，无需手动启动
2. **端口**：确保 5180 端口未被其他服务占用
3. **浏览器**：测试使用 Chromium，与 Chrome 兼容
4. **CI 环境**：在 CI 中会自动重试失败测试 2 次
