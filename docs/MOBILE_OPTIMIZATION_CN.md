# 移动端优化需求

NoteFlow 移动端适配方案，计划在未来版本中实现。

<p align="right">
  <a href="MOBILE_OPTIMIZATION.md">English</a> | <b>简体中文</b>
</p>

---

## 背景

NoteFlow 当前使用**四栏布局**（侧边栏 + 笔记列表 + 编辑器 + 大纲），在移动设备上完全不可用。本文档概述了移动端适配的优化方案。

---

## 当前问题

| 问题 | 描述 |
|-------|-------------|
| 栏数过多 | 4 栏无法在手机屏幕上正常显示 |
| 无法使用 | 元素太小，无法进行交互 |
| 体验差 | 没有针对移动端的交互设计 |
| 认证页面 | 登录/注册页面未针对移动端优化 |
| 键盘遮挡 | 编辑时键盘弹出遮挡内容 |

---

## 推荐方案：底部导航 + 抽屉面板 + FAB

### 概览

```
┌─────────────────────┐
│ 🔍  笔记标题    ⋮   │  ← 精简工具栏（搜索 + 标题 + 菜单）
├─────────────────────┤
│                     │
│      Editor         │  ← 默认全屏编辑器
│      (主视图)        │
│                     │
│            ┌─────┐  │
│            │  +  │  │  ← FAB 浮动按钮（快速新建）
│            └─────┘  │
├─────────────────────┤
│ 📁  📝  ✏️  📋  ⚙️ │  ← 底部导航栏（5个入口）
│文件夹 笔记 编辑 大纲 设置│
└─────────────────────┘

点击导航项 → 对应面板从侧边滑出
点击 FAB → 快速创建新笔记
```

### 优点

- 符合移动应用惯例（Material Design / iOS HIG）
- 最大化利用屏幕空间进行编辑
- 单手操作友好
- 清晰的导航结构
- 快速操作入口（FAB）

---

## 详细设计

### 1. 需要新增的组件

| 组件 | 描述 | 优先级 |
|-----------|-------------|----------|
| `useIsMobile` | 检测移动端视口的 Hook | 高 |
| `useBreakpoint` | 响应式断点检测 Hook | 高 |
| `Drawer` | 可复用的滑出面板组件 | 高 |
| `MobileNav` | 底部导航栏组件 | 高 |
| `MobileHeader` | 精简版移动端头部 | 高 |
| `FloatingActionButton` | 浮动操作按钮 | 高 |
| `FolderDrawer` | 文件夹抽屉面板 | 高 |
| `NoteListDrawer` | 笔记列表抽屉面板 | 高 |
| `OutlineDrawer` | 大纲抽屉面板 | 中 |
| `MobileSettingsSheet` | 移动端设置面板 | 中 |

### 2. 布局结构

```
MobileLayout:
├── MobileHeader (精简版)
│   ├── 搜索按钮
│   ├── 笔记标题
│   ├── 模式切换器（编辑/预览/分屏）
│   └── 更多菜单（暗色模式、同步、设置、登出）
├── Editor (全屏)
│   └── MarkdownEditor
├── FAB (浮动)
│   └── 新建笔记按钮
├── MobileNav (底部)
│   ├── 文件夹按钮
│   ├── 笔记按钮
│   ├── 编辑按钮 (首页)
│   ├── 大纲按钮
│   └── 设置按钮
└── Drawers/Sheets (覆盖层面板)
    ├── FolderDrawer (左侧)
    ├── NoteListDrawer (左侧)
    ├── OutlineDrawer (右侧)
    └── SettingsSheet (底部弹出)
```

### 3. 底部导航项

| 图标 | 名称 | 操作 |
|------|------|------|
| Folder | 文件夹 | 从左侧打开文件夹面板 |
| FileText | 笔记 | 从左侧打开笔记列表面板 |
| Edit3 | 编辑 | 关闭所有面板，返回编辑器（默认） |
| List | 大纲 | 从右侧打开大纲面板 |
| Settings | 设置 | 从底部弹出设置面板 |

### 4. 抽屉面板设计

```
文件夹抽屉 (左侧滑出):
┌──────────────┐
│ 📁 文件夹     │
│ ──────────── │
│ • General    │
│ • Work       │
│ • Personal   │
│              │
│ + 新建文件夹  │
└──────────────┘

笔记列表抽屉 (左侧滑出):
┌──────────────┐
│ 🔍 搜索笔记.. │
│ ──────────── │
│ 当前文件夹名  │
│ ──────────── │
│ 📝 笔记 1    │
│ 📝 笔记 2    │
│ 📝 笔记 3    │
│              │
│ + 新建笔记    │
└──────────────┘

大纲抽屉 (右侧滑出):
┌──────────────┐
│ 📋 大纲      │
│ ──────────── │
│ ▸ H1 标题    │
│   ▸ H2 章节  │
│   ▸ H2 章节  │
│ ▸ H1 标题    │
└──────────────┘

设置面板 (底部弹出):
┌──────────────┐
│ ⚙️ 设置      │
│ ──────────── │
│ 🌙 暗色模式   │
│ 🔄 同步状态   │
│ 📧 账户信息   │
│ 🚪 退出登录   │
└──────────────┘
```

### 5. 响应式断点

| 断点 | 宽度 | 布局 | 导航 |
|------------|-------|--------|------|
| 移动端 | < 640px | 单栏 + 抽屉 + FAB | 底部导航 |
| 平板竖屏 | 640px - 768px | 单栏 + 抽屉 | 底部导航 |
| 平板横屏 | 768px - 1024px | 双栏布局 | 侧边导航 |
| 桌面 | > 1024px | 当前四栏布局 | 侧边栏 |

### 6. 浮动操作按钮 (FAB)

```
位置：右下角，距离底部导航栏 16px
功能：快速创建新笔记
交互：
  - 点击：创建新笔记并进入编辑
  - 长按：显示快捷菜单（新建笔记、新建文件夹）
动画：
  - 面板打开时隐藏
  - 滚动时自动隐藏/显示
```

### 7. 移动端头部设计

```
┌─────────────────────────────────────┐
│ 🔍  │    笔记标题    │  👁️  │ ⋮  │
│搜索 │               │ 预览  │菜单 │
└─────────────────────────────────────┘

搜索按钮：展开搜索覆盖层
标题：当前笔记标题（可点击编辑）
预览切换：编辑/预览/分屏模式
更多菜单：更多操作选项
```

### 8. 认证页面移动端适配

```
登录/注册页面：
┌─────────────────────┐
│                     │
│      📓 NoteFlow    │
│                     │
│  ┌───────────────┐  │
│  │ 📧 邮箱       │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ 🔒 密码       │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │    登 录      │  │
│  └───────────────┘  │
│                     │
│     没有账号？注册   │
│                     │
└─────────────────────┘

设计要点：
- 表单元素足够大（触控友好）
- 输入框高度 48px+
- 按钮高度 48px+
- 社交登录按钮明显
- 忘记密码链接清晰
```

---

## 触控交互设计

### 1. 手势操作

| 手势 | 操作 | 上下文 |
|------|------|--------|
| 左滑 | 删除笔记 | 笔记列表项 |
| 右滑 | 快捷菜单 | 笔记列表项 |
| 下拉 | 同步/刷新 | 笔记列表 |
| 点击遮罩 | 关闭面板 | 抽屉面板 |
| 滑动关闭 | 关闭面板 | 抽屉面板 |
| 捏合 | 缩放编辑器 | 编辑器（可选） |

### 2. 触控目标

| 元素 | 最小尺寸 |
|------|---------|
| 按钮 | 44 × 44 px |
| 列表项 | 48 px 高 |
| 导航项 | 56 px 高 |
| FAB | 56 × 56 px |

### 3. 触控反馈

- 点击涟漪效果
- 按压状态变化
- 震动反馈（可选，Haptic）

---

## 键盘适配

### 1. 编辑器键盘

```
键盘弹出时：
1. 视口高度自动调整
2. 工具栏固定在键盘上方（可选）
3. 滚动到当前光标位置
4. FAB 自动隐藏

键盘收起时：
1. 恢复完整视口
2. FAB 重新显示
```

### 2. 键盘快捷键（外接键盘）

| 快捷键 | 操作 |
|--------|------|
| Cmd/Ctrl + N | 新建笔记 |
| Cmd/Ctrl + S | 保存 |
| Cmd/Ctrl + F | 搜索 |
| Cmd/Ctrl + B | 粗体 |
| Cmd/Ctrl + I | 斜体 |
| Esc | 关闭面板 |

---

## 状态指示

### 1. 同步状态

```
┌─────────────────┐
│ 🔄 同步中...     │  ← 顶部横幅
└─────────────────┘

┌─────────────────┐
│ ✅ 已同步        │  ← 短暂显示后消失
└─────────────────┘

┌─────────────────┐
│ ⚠️ 离线模式      │  ← 持续显示
└─────────────────┘
```

### 2. 离线模式

- 显示离线指示器
- 禁用需要网络的功能
- 本地数据正常可用
- 联网后自动同步

---

## 实现任务清单

### 第一阶段：基础设施

- [x] 创建 `useIsMobile` hook
- [x] 创建 `useBreakpoint` hook
- [x] 创建带动画的 `Drawer` 组件
- [x] 创建 `MobileNav` 底部导航组件
- [x] 创建 `FloatingActionButton` 组件

### 第二阶段：面板组件

- [x] 创建 `MobileHeader` 精简头部组件
- [x] 创建 `FolderDrawer` 文件夹抽屉
- [x] 创建 `NoteListDrawer` 笔记列表抽屉
- [x] 创建 `OutlineDrawer` 大纲抽屉
- [x] 创建 `SettingsSheet` 设置面板
- [x] 实现面板状态管理 (mobileUIStore)

### 第三阶段：布局集成

- [x] 创建 `MobileLayout` 移动端布局
- [x] 更新 `App.tsx` 支持移动端布局切换
- [x] 更新 `MainLayout` 支持响应式
- [x] 所有组件的移动端样式
- [x] 添加触控友好的交互

### 第四阶段：页面优化

- [x] 优化 `LandingPage` 认证页面移动端适配
- [x] 优化编辑器键盘交互
- [x] 添加搜索移动端体验
- [x] 添加手势操作（滑动删除等）

### 第五阶段：优化完善

- [x] 添加流畅动画
- [x] 性能优化
- [x] 多设备测试
- [x] 修复移动端特定 bug
- [x] PWA 支持（可选）

---

## 技术实现

### 1. 状态管理

```typescript
// stores/mobileUIStore.ts
interface MobileUIState {
  // 面板状态
  activePanel: 'folder' | 'notes' | 'outline' | 'settings' | null;
  isPanelOpen: boolean;

  // 操作
  openPanel: (panel: 'folder' | 'notes' | 'outline' | 'settings') => void;
  closePanel: () => void;
  togglePanel: (panel: 'folder' | 'notes' | 'outline' | 'settings') => void;

  // FAB 状态
  isFabVisible: boolean;
  setFabVisible: (visible: boolean) => void;

  // 搜索状态
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}
```

### 2. 响应式 Hook

```typescript
// hooks/useBreakpoint.ts
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useBreakpoint(): {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}
```

### 3. Drawer 组件

```typescript
// components/common/Drawer.tsx
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  title?: string;
  width?: string;
}
```

### 4. CSS 注意事项

```css
/* 安全区域适配 */
.mobile-header {
  padding-top: env(safe-area-inset-top);
}

.mobile-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 抽屉样式 */
.drawer {
  position: fixed;
  z-index: 50;
  transition: transform 0.3s ease-in-out;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

/* 触控反馈 */
.touchable {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.touchable:active {
  transform: scale(0.98);
  opacity: 0.9;
}
```

---

## 目标版本

- **计划版本**: v0.3.0
- **优先级**: 高
- **依赖**: 无

---

## 参考资料

- [Material Design - 底部导航](https://m3.material.io/components/navigation-bar)
- [Material Design - 侧边抽屉](https://m3.material.io/components/navigation-drawer)
- [Material Design - 浮动操作按钮](https://m3.material.io/components/floating-action-button)
- [Apple HIG - 标签栏](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Apple HIG - 侧边栏](https://developer.apple.com/design/human-interface-guidelines/sidebars)

---

*创建时间: 2026-02-24*
*更新时间: 2026-03-10*
*状态: 开发中*
