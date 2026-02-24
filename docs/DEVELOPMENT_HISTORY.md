# NoteFlow 开发对话记录

**日期**: 2026-02-19 ~ 2026-02-23
**项目**: NoteFlow - 高级笔记应用

---

## 目录

1. [项目概述](#项目概述)
2. [PRD 文档创建](#prd-文档创建)
3. [前端 Demo 开发](#前端-demo-开发)
4. [功能迭代与修复](#功能迭代与修复)
5. [Rich 模式开发](#rich-模式开发)
6. [测试环境配置](#测试环境配置)
7. [技术栈总结](#技术栈总结)

---

## 项目概述

### 需求描述

开发一款高级的笔记应用，用户应该能：
- 在一个美观、强大且易用的编辑器中编辑笔记
- 支持 Markdown 格式
- 把笔记保存到本地文件夹中
- 按照自己的意愿方便且自由地整理
- 在笔记中使用 AI 功能，对笔记内容进行分析

### 产品定位

| 项目 | 决策 |
|------|------|
| 产品名称 | **NoteFlow** |
| 目标平台 | Web 应用 + Electron 桌面端 |
| AI 策略 | 多模型支持（Claude、OpenAI 等） |
| 数据策略 | 本地优先，无云端同步 |
| 云端同步 | 不需要 |
| 协作编辑 | 不在初期规划中 |
| 移动端 | 不在初期规划中 |

---

## PRD 文档创建

### 产品愿景

打造一款**美观、强大且易用**的笔记应用，让用户能够：
- 在高质量的 Markdown 编辑器中自由创作
- 按个人习惯灵活组织和管理笔记
- 借助 AI 能力提升写作效率和笔记价值

### 核心价值主张

1. **本地优先**：数据保存在本地，用户完全掌控
2. **自由组织**：支持文件夹、标签、双向链接等多种组织方式
3. **AI 赋能**：内置 AI 写作助手，提升创作效率
4. **知识网络**：通过双向链接和知识图谱构建个人知识库

### 功能模块

| 模块 | 关键功能 |
|------|---------|
| **编辑器** | 实时预览、代码高亮、大纲管理、拖拽排序 |
| **文件组织** | 本地 .md 文件、文件夹、标签、多维度筛选 |
| **搜索** | 全局全文搜索、搜索高亮 |
| **双向链接** | `[[Wiki链接]]`、反向链接、知识图谱 |
| **AI 助手** | 续写、改写、翻译、摘要、语法检查 |

### 技术架构

```
前端框架：React 18 + TypeScript
构建工具：Vite
样式：Tailwind CSS
编辑器：CodeMirror
Markdown 解析：marked
状态管理：Zustand
```

### 开发阶段

1. **Phase 1**：MVP（编辑器 + 本地存储）
2. **Phase 2**：组织与链接功能
3. **Phase 3**：AI 能力
4. **Phase 4**：知识图谱 + 高级功能

---

## 前端 Demo 开发

### 项目初始化

```bash
npm create vite@latest noteflow -- --template react-ts
cd noteflow
npm install
```

### 核心依赖安装

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# 编辑器与工具
npm install @uiw/react-codemirror @codemirror/lang-markdown marked

# 状态管理
npm install zustand

# 图标
npm install lucide-react
```

### 项目结构

```
noteflow/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx        # 侧边栏
│   │   │   ├── Header.tsx         # 顶部栏
│   │   │   └── MainLayout.tsx     # 主布局
│   │   ├── Editor/
│   │   │   ├── MarkdownEditor.tsx # Markdown 编辑器
│   │   │   └── Outline.tsx        # 大纲视图
│   │   └── NoteList/
│   │       └── NoteList.tsx       # 笔记列表
│   ├── store/
│   │   ├── noteStore.ts           # 笔记状态
│   │   └── themeStore.ts          # 主题状态
│   ├── types/
│   │   └── note.ts                # 类型定义
│   ├── utils/
│   │   └── date.ts                # 日期工具
│   ├── App.tsx
│   └── main.tsx
├── playwright.config.ts
├── tailwind.config.js
└── package.json
```

---

## 功能迭代与修复

### 1. 编辑器问题修复

#### 问题描述
- 编辑器卡顿
- 光标位置与实际不匹配
- 鼠标滚轮不响应
- 预览模式无法滚动

#### 解决方案

**编辑器卡顿**：
- 使用本地状态 `localContent` 管理编辑内容
- 防抖保存（1000ms）到 store
- 使用 `useMemo` 和 `useCallback` 优化渲染

**光标位置问题**：
- 移除 `key={activeNoteId}` 避免组件重新挂载
- 使用 `lastSavedContent` ref 跟踪保存状态

**滚动问题**：
- 使用 ref 获取容器高度
- CodeMirror 使用固定高度配置
- `.cm-scroller` 配置 `overflow-y: auto`

```typescript
// 最终编辑器配置
<CodeMirror
  key={activeNoteId}
  value={localContent}
  height={`${editorContainerRef.current?.clientHeight || '100%'}px`}
  extensions={extensions}
  onChange={handleChange}
  theme={isDark ? 'dark' : 'light'}
  basicSetup={{
    lineNumbers: false,
    foldGutter: false,
    highlightActiveLine: false,
  }}
/>
```

### 2. 暗色模式修复

#### 问题描述
NoteList 等区域在暗色模式下仍显示白色

#### 解决方案
修复无效的 Tailwind 类（如 `dark:bg-gray-850` → `dark:bg-gray-900`）

```diff
- <div className="w-72 bg-gray-50 dark:bg-gray-850 ...">
+ <div className="w-72 bg-gray-50 dark:bg-gray-900 ...">
```

### 3. 文件夹管理功能

#### 新增功能
- 创建文件夹
- 重命名文件夹
- 删除文件夹（笔记自动移到 General）
- 移动笔记到不同文件夹

#### Store 实现

```typescript
// 创建文件夹
createFolder: (name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const exists = get().folders.some(
    f => f.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) return;

  const newFolder: Folder = {
    id: Date.now().toString(),
    name: trimmedName,
    parentId: null,
  };
  set((state) => ({
    folders: [...state.folders, newFolder],
  }));
},

// 移动笔记
moveNoteToFolder: (noteId: string, folderName: string) => {
  set((state) => ({
    notes: state.notes.map(note =>
      note.id === noteId
        ? { ...note, folder: folderName, updatedAt: Date.now() }
        : note
    ),
  }));
},
```

### 4. 数据持久化

使用 Zustand 的 persist 中间件：

```typescript
export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'noteflow-storage',
      partialize: (state) => ({
        notes: state.notes,
        folders: state.folders,
      }),
    }
  )
);
```

### 5. 导入导出功能

```typescript
// 导出单篇笔记为 .md
exportNote: (id: string) => {
  const note = get().notes.find((n) => n.id === id);
  if (!note) return;

  const blob = new Blob([note.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title}.md`;
  a.click();
  URL.revokeObjectURL(url);
},

// 导出所有笔记为 JSON
exportAllNotes: () => {
  const notes = get().notes;
  const exportData = {
    exportDate: new Date().toISOString(),
    notes: notes,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  // ...
},
```

---

## Rich 模式开发

### 概述

Rich 模式是一种所见即所得（WYSIWYG）的编辑体验，用户可以直接在渲染后的 HTML 上进行编辑，同时保留 Markdown 源码的同步。

### 技术实现

#### 核心组件

**RichTextEditor 组件**：管理 contentEditable 元素，避免 React 重新渲染导致的编辑冲突。

```typescript
interface RichTextEditorProps {
  initialHtml: string;
  noteId: string | null;
  onChange: (markdown: string, noteId: string) => void;
}

function RichTextEditor({ initialHtml, noteId, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastNotifiedMarkdownRef = useRef<string>('');
  const currentNoteIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const inputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialMarkdownRef = useRef<string>('');
  // ...
}
```

#### HTML ↔ Markdown 转换

使用 **TurndownService** 将 HTML 转换回 Markdown：

```typescript
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});
```

### 问题修复记录

#### 1. dangerouslySetInnerHTML + contentEditable 冲突

**问题**：React 的 `dangerouslySetInnerHTML` 与 `contentEditable` 冲突，导致用户编辑被覆盖。

**解决方案**：移除 `dangerouslySetInnerHTML`，手动管理 `innerHTML`：

```typescript
// 初始化时手动设置 innerHTML
useEffect(() => {
  if (editorRef.current && noteId) {
    if (currentNoteIdRef.current !== noteId) {
      editorRef.current.innerHTML = initialHtml;
      currentNoteIdRef.current = noteId;
    }
  }
}, [initialHtml, noteId]);
```

#### 2. Rich 模式格式编辑不工作

**问题**：格式按钮操作的是隐藏的 CodeMirror 编辑器，而不是可见的 Rich 编辑器。

**解决方案**：为 Rich 模式使用 `document.execCommand`：

```typescript
const applyRichFormat = useCallback((formatType: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  switch (formatType) {
    case 'bold':
      document.execCommand('bold', false);
      break;
    case 'italic':
      document.execCommand('italic', false);
      break;
    case 'heading1':
      document.execCommand('formatBlock', false, 'h1');
      break;
    // ...
  }

  // 触发内容变更通知
  const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
  if (richEditor) {
    richEditor.dispatchEvent(new Event('input', { bubbles: true }));
  }
}, []);
```

#### 3. Rich 模式图片插入

**问题**：图片插入只支持 Markdown 语法，不支持直接插入 HTML 图片。

**解决方案**：

```typescript
if (previewMode === 'rich') {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const img = document.createElement('img');
    img.src = base64;
    img.alt = name;
    img.style.maxWidth = '100%';

    range.deleteContents();
    range.insertNode(img);

    // 移动光标到图片后
    range.setStartAfter(img);
    range.setEndAfter(img);
    selection.removeAllRanges();
    selection.addRange(range);

    // 触发变更
    richEditor.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

#### 4. Outline 点击多次后内容清空

**问题**：点击 Outline 时，blur 事件触发保存空内容。

**解决方案**：添加 `isInitializedRef` 和空内容检查：

```typescript
const handleBlur = useCallback(() => {
  if (!editorRef.current || !isInitializedRef.current) return;

  const editorHtml = editorRef.current.innerHTML;
  // 不保存空内容
  if (!editorHtml || editorHtml.trim() === '' || editorHtml === '<br>') {
    return;
  }
  notifyChange();
}, [notifyChange]);
```

#### 5. 快速切换文件时的竞态条件

**问题**：快速切换文件时，debounce 回调使用过时的 `activeNoteId`，导致内容保存到错误的笔记。

**解决方案**：使用 ref 跟踪当前笔记 ID，并在保存时验证：

```typescript
const activeNoteIdRef = useRef<string | null>(null);
useEffect(() => {
  activeNoteIdRef.current = activeNoteId;
}, [activeNoteId]);

const handleChange = useCallback((value: string, noteIdForValidation?: string) => {
  // 验证笔记 ID 匹配
  if (noteIdForValidation && noteIdForValidation !== activeNoteId) {
    console.log('[NoteFlow] Blocked save - noteId mismatch');
    return;
  }
  // ...
}, [activeNoteId, updateNoteContent]);
```

#### 6. 快速切换时显示内容错乱

**问题**：`renderedHtml` 使用 debounce 后的 `localContent`，导致切换时显示旧内容。

**解决方案**：Rich 模式直接使用 `activeNote.content`：

```typescript
const renderedHtml = useMemo(() => {
  if (previewMode === 'rich' && activeNote) {
    return marked.parse(activeNote.content) as string;
  }
  const contentToRender = localContent;
  return marked.parse(contentToRender) as string;
}, [previewMode, localContent, activeNote]);
```

#### 7. 切换文件时内容未保存

**问题**：修改内容后快速切换，debounce 未完成导致内容丢失。

**解决方案**：添加 `pendingSaveRef` 在切换前立即保存：

```typescript
const pendingSaveRef = useRef<{ noteId: string; value: string } | null>(null);

useEffect(() => {
  if (activeNote) {
    // 切换前保存待保存内容
    if (pendingSaveRef.current && pendingSaveRef.current.value !== lastSavedContent.current) {
      updateNoteContent(pendingSaveRef.current.noteId, pendingSaveRef.current.value);
      lastSavedContent.current = pendingSaveRef.current.value;
      pendingSaveRef.current = null;
    }
    // ...
  }
}, [activeNoteId, activeNote, updateNoteContent]);
```

#### 8. 格式修改不保存

**问题**：仅修改格式（不改变文本内容）时，`lastNotifiedMarkdownRef` 比较失败导致不保存。

**解决方案**：使用 `initialMarkdownRef` 与初始内容比较：

```typescript
// 清理时与初始内容比较
useEffect(() => {
  return () => {
    if (editorRef.current && isInitializedRef.current) {
      const markdown = turndownService.turndown(editorRef.current.innerHTML);
      // 与初始内容比较，而非上次通知的内容
      if (markdown !== initialMarkdownRef.current) {
        onChangeRef.current(markdown, currentNoteIdRef.current);
      }
    }
  };
}, []);
```

#### 9. Outline 跳转到错误位置

**问题**：Rich 模式下，Outline 点击标题跳转到错误位置。

**原因分析**：
1. Outline 发送 Markdown 行号
2. Rich 模式错误地使用 `line - 1` 作为标题索引
3. 编辑器内容可能与保存内容不同，导致标题数量/顺序不匹配

**解决方案**：使用文本匹配而非索引：

```typescript
// 新增事件类型
export const SCROLL_TO_HEADING_INDEX_EVENT = 'noteflow-scroll-to-heading-index';

export function dispatchScrollToHeadingIndex(index: number, text: string) {
  window.dispatchEvent(new CustomEvent(SCROLL_TO_HEADING_INDEX_EVENT, {
    detail: { index, text }
  }));
}

// Rich 模式滚动处理
const handleScrollToHeadingIndex = (e: CustomEvent<{ index: number; text: string }>) => {
  const { index, text } = e.detail;
  const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
  if (richEditor) {
    const headings = richEditor.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // 优先通过文本匹配查找
    let targetHeading: HTMLElement | null = null;
    for (const heading of headings) {
      if (heading.textContent?.trim() === text.trim()) {
        targetHeading = heading as HTMLElement;
        break;
      }
    }

    // 回退到索引匹配
    if (!targetHeading && index >= 0 && index < headings.length) {
      targetHeading = headings[index] as HTMLElement;
    }

    if (targetHeading) {
      targetHeading.scrollIntoView({ behavior: 'auto', block: 'start' });
      // 高亮反馈
      targetHeading.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        targetHeading!.style.backgroundColor = '';
      }, 500);
    }
  }
};
```

#### 10. Outline 点击导致工具栏消失（2026-02-23）

**问题**：在 Rich/Preview/Edit 模式下，点击 Outline 中的标题后，格式工具栏（粗体、斜体等按钮）消失。

**原因分析**：
1. 使用 `scrollIntoView()` 触发了浏览器的布局重计算
2. 这个布局重计算导致 SVG 图标（Lucide React 图标）的尺寸变为 0x0
3. 工具栏按钮实际存在，但图标不可见

**解决方案**：使用 `scrollTo()` 替代 `scrollIntoView()`：

```typescript
// Rich 模式 - 修改前
targetHeading.scrollIntoView({ behavior: 'auto', block: 'start' });

// Rich 模式 - 修改后
const richEditor = document.querySelector('.rich-editor') as HTMLDivElement;
if (richEditor && targetHeading) {
  const editorRect = richEditor.getBoundingClientRect();
  const headingRect = targetHeading.getBoundingClientRect();
  const scrollOffset = headingRect.top - editorRect.top + richEditor.scrollTop;
  richEditor.scrollTo({ top: scrollOffset, behavior: 'auto' });
}
```

**Preview 模式修复**：同样使用 `scrollTo()` 替代 `scrollIntoView()`。

**Edit 模式修复**：
1. Edit 模式使用 CodeMirror 编辑器，滚动机制不同
2. CodeMirror 的 `.cm-scroller` 设置了 `overflow: visible`，实际滚动容器是父元素
3. 使用 `lineBlockAt()` 获取行的文档位置，然后设置容器的 `scrollTop`

```typescript
// Edit 模式滚动处理
if (editorRef.current && editorContainerRef.current) {
  const editorView = editorRef.current;
  const container = editorContainerRef.current;
  const doc = editorView.state.doc;

  if (line > 0 && line <= doc.lines) {
    const linePos = doc.line(line).from;
    const lineBlock = editorView.lineBlockAt(linePos);

    // 计算滚动位置
    const margin = 50;
    const targetScrollTop = Math.max(0, lineBlock.top - margin);

    // 滚动容器（不是 CodeMirror 的 scrollDOM）
    container.scrollTop = targetScrollTop;

    // 设置光标位置
    editorView.dispatch({
      selection: { anchor: linePos },
    });
  }
}
```

#### 11. Preview 模式 Outline 跳转位置不准确（2026-02-23）

**问题**：Preview 模式下，点击 Outline 中的标题，跳转到错误的位置。

**原因分析**：
1. Preview 模式原本监听 `SCROLL_TO_LINE_EVENT`（行号）
2. 使用 `line - 1` 作为标题索引，但行号和标题索引不对应
3. 例如：第 10 行可能是第 2 个标题，使用 `line - 1 = 9` 会导致跳转到不存在的标题

**解决方案**：Preview 模式改为监听 `SCROLL_TO_HEADING_INDEX_EVENT`：

```typescript
// 事件监听分离
// Edit/Split 模式：监听 SCROLL_TO_LINE_EVENT（行号）
// Preview/Rich 模式：监听 SCROLL_TO_HEADING_INDEX_EVENT（标题索引 + 文本）

// Preview 模式处理
if (previewMode === 'preview' && previewRef.current) {
  const previewContainer = previewRef.current;
  const headings = previewContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');

  // 优先通过文本匹配查找
  let targetHeading: HTMLElement | null = null;
  for (const heading of headings) {
    if (heading.textContent?.trim() === text.trim()) {
      targetHeading = heading as HTMLElement;
      break;
    }
  }

  // 回退到索引匹配
  if (!targetHeading && index >= 0 && index < headings.length) {
    targetHeading = headings[index] as HTMLElement;
  }

  if (targetHeading) {
    const containerRect = previewContainer.getBoundingClientRect();
    const headingRect = targetHeading.getBoundingClientRect();
    const scrollOffset = headingRect.top - containerRect.top + previewContainer.scrollTop;
    previewContainer.scrollTo({ top: scrollOffset, behavior: 'auto' });
  }
}
```

**关键技术点**：
- `scrollIntoView()` 会触发布局重计算，可能导致 SVG 图标渲染异常
- CodeMirror 的 `scrollDOM` 可能不是实际滚动容器（取决于 CSS 配置）
- 行号和标题索引是不同的概念，需要分别处理

### 关键技术模式

#### Ref 模式避免闭包陷阱

```typescript
// 存储回调函数避免过期闭包
const onChangeRef = useRef(onChange);
useEffect(() => {
  onChangeRef.current = onChange;
}, [onChange]);

// 清理时使用 ref
useEffect(() => {
  return () => {
    onChangeRef.current(markdown, currentNoteIdRef.current);
  };
}, []);
```

#### 组件强制重新挂载

```typescript
// 使用 key 强制组件在笔记切换时重新挂载
<RichTextEditor
  key={activeNoteId}
  initialHtml={renderedHtml}
  noteId={activeNoteId}
  onChange={handleChange}
/>
```

#### 待保存队列模式

```typescript
// 存储待保存内容
const pendingSaveRef = useRef<{ noteId: string; value: string } | null>(null);

// 变更时入队
pendingSaveRef.current = { noteId: activeNoteId, value };

// 切换前立即保存
if (pendingSaveRef.current && pendingSaveRef.current.value !== lastSavedContent.current) {
  updateNoteContent(pendingSaveRef.current.noteId, pendingSaveRef.current.value);
}
```

### Rich 模式功能清单

- [x] 所见即所得编辑
- [x] 格式工具栏（粗体、斜体、标题、列表等）
- [x] 图片插入（支持粘贴和文件选择）
- [x] 大纲导航
- [x] 自动保存
- [x] 快速切换文件不丢失内容
- [x] 格式修改保存

---

## 测试环境配置

### Playwright 安装

```bash
# 安装 Playwright
npm install -D @playwright/test

# 安装浏览器
npx playwright install chromium
```

### 配置文件

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 测试用例覆盖

| 功能 | 测试状态 |
|------|---------|
| 页面正常加载 | ✅ |
| 笔记列表展示 | ✅ |
| 新增笔记 | ✅ |
| 编辑笔记内容 | ✅ |
| 切换预览模式 | ✅ |
| 编辑器滚动功能 | ✅ |
| 预览区域滚动功能 | ✅ |
| 文件夹切换 | ✅ |
| 搜索功能 | ✅ |
| 暗色模式切换 | ✅ |
| 导出/导入按钮 | ✅ |

### 运行测试

```bash
npm run test:e2e        # 运行所有测试
npm run test:e2e:ui     # UI 模式
npm run test:e2e:debug  # 调试模式
npm run test:e2e:report # 查看报告
```

---

## 技术栈总结

### 前端技术

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2.0 |
| 语言 | TypeScript | 5.9.3 |
| 构建工具 | Vite | 7.3.1 |
| 样式 | Tailwind CSS | 3.4.19 |
| 编辑器 | CodeMirror | 4.25.4 |
| Markdown 解析 | marked | 17.0.3 |
| HTML 转 Markdown | TurndownService | 7.2.0 |
| 状态管理 | Zustand | 5.0.11 |
| 图标 | Lucide React | 0.574.0 |

### 测试技术

| 类别 | 技术 | 版本 |
|------|------|------|
| E2E 测试 | Playwright | 1.58.2 |
| 浏览器 | Chromium | - |

### NPM Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

---

## 已实现功能清单

### 编辑器
- [x] Markdown 编辑（实时预览）
- [x] 四种模式切换（Edit/Split/Preview/Rich）
- [x] 代码高亮
- [x] 自动保存（防抖 1000ms）
- [x] 编辑器滚动
- [x] 预览区域滚动
- [x] 格式工具栏（粗体、斜体、标题、列表等）
- [x] 图片插入（粘贴和文件选择）
- [x] 图片压缩（>10KB 自动压缩）

### Rich 模式
- [x] 所见即所得编辑
- [x] contentEditable 编辑器
- [x] HTML ↔ Markdown 双向转换
- [x] 格式编辑支持
- [x] 图片直接插入
- [x] 大纲导航
- [x] 快速切换不丢失内容

### 文件组织
- [x] 本地 localStorage 存储
- [x] 文件夹管理（创建/重命名/删除）
- [x] 笔记在文件夹间移动
- [x] 按文件夹筛选

### 搜索
- [x] 全局搜索（标题/内容/标签）
- [x] 搜索高亮

### 导入导出
- [x] 导出单篇笔记为 .md
- [x] 导出所有笔记为 JSON
- [x] 导入 .md 文件
- [x] 导入 JSON 备份

### UI/UX
- [x] 暗色模式
- [x] 主题切换
- [x] 大纲视图
- [x] 保存状态指示

### 测试
- [x] Playwright E2E 测试配置
- [x] 核心功能测试用例

---

## 待实现功能

### Phase 2
- [ ] 双向链接 `[[笔记名]]`
- [ ] 反向链接面板
- [ ] 标签系统
- [ ] 知识图谱

### Phase 3
- [ ] AI 写作助手
- [ ] API Key 配置
- [ ] 多模型切换

### Phase 4
- [ ] Electron 桌面端
- [ ] 本地文件系统直接读写
- [ ] 插件系统

---

## 文件清单

### 源代码
- `src/App.tsx` - 应用入口
- `src/main.tsx` - React 入口
- `src/index.css` - 全局样式
- `src/components/Layout/MainLayout.tsx` - 主布局
- `src/components/Layout/Sidebar.tsx` - 侧边栏
- `src/components/Layout/Header.tsx` - 顶部栏
- `src/components/Editor/MarkdownEditor.tsx` - Markdown 编辑器
- `src/components/Editor/Outline.tsx` - 大纲视图
- `src/components/NoteList/NoteList.tsx` - 笔记列表
- `src/store/noteStore.ts` - 笔记状态管理
- `src/store/themeStore.ts` - 主题状态管理
- `src/types/note.ts` - 类型定义
- `src/utils/date.ts` - 日期工具函数

### 配置文件
- `package.json` - 项目配置
- `tsconfig.json` - TypeScript 配置
- `vite.config.ts` - Vite 配置
- `tailwind.config.js` - Tailwind 配置
- `postcss.config.js` - PostCSS 配置
- `playwright.config.ts` - Playwright 配置

### 测试文件
- `tests/noteflow.spec.ts` - E2E 测试用例

### 文档
- `NoteFlow-PRD.md` - 产品需求文档
- `PLAYWRIGHT_README.md` - Playwright 使用说明

---

*文档导出时间: 2026-02-23*
