# 发布指南

本文档描述 NoteFlow 的版本管理和发布流程。

<p align="right">
  <a href="RELEASE.md">English</a> | <b>简体中文</b>
</p>

---

## 版本号规范

NoteFlow 遵循 [语义化版本（SemVer）](https://semver.org/lang/zh-CN/)：

```
主版本号.次版本号.修订号
MAJOR.MINOR.PATCH
```

- **主版本号 (MAJOR)**：不兼容的 API 变更
- **次版本号 (MINOR)**：向后兼容的新功能
- **修订号 (PATCH)**：向后兼容的问题修复

### 示例

| 版本变化 | 类型 | 描述 |
|---------|------|-------------|
| `0.1.0` → `0.1.1` | Patch | Bug 修复 |
| `0.1.1` → `0.2.0` | Minor | 新功能 |
| `0.2.0` → `1.0.0` | Major | 正式版 / 破坏性变更 |

---

## 分支策略

| 分支 | 用途 |
|--------|---------|
| `main` | 生产就绪代码 |
| `develop` | 开发集成分支 |
| `feature/*` | 新功能开发 |
| `fix/*` | Bug 修复 |
| `release/*` | 发布准备 |

### 工作流程

```
feature/* → develop → release/* → main
    fix/* ────────────────────────┘
```

---

## 发布流程

### 1. 准备发布

```bash
# 确保在 main 分支
git checkout main
git pull origin main

# 创建发布分支
git checkout -b release/v0.2.0
```

### 2. 更新版本号

更新 `package.json` 中的版本：
```json
{
  "version": "0.2.0"
}
```

### 3. 更新变更日志

更新 `CHANGELOG.md` 和 `CHANGELOG_CN.md`：

```markdown
## [0.2.0] - 2026-03-01

### 新增
- 新功能描述

### 修复
- Bug 修复描述

### 变更
- 变更描述
```

### 4. 提交并推送

```bash
git add package.json CHANGELOG.md CHANGELOG_CN.md
git commit -m "chore: bump version to 0.2.0"
git push origin release/v0.2.0
```

### 5. 创建 Pull Request

- 从 `release/v0.2.0` 向 `main` 创建 PR
- 审核并合并

### 6. 创建标签并发布

```bash
# 合并到 main 后
git checkout main
git pull origin main

# 创建带注释的标签
git tag -a v0.2.0 -m "Release v0.2.0

新增功能:
- 功能 1
- 功能 2

修复问题:
- Bug 1"

# 推送标签
git push origin v0.2.0
```

### 7. GitHub Release

1. 访问 https://github.com/zhongbinling/note_flow/releases
2. 点击 "Draft a new release"
3. 选择标签 `v0.2.0`
4. 填写发布标题和说明
5. 点击 "Publish release"

---

## 部署

### 自动部署

GitHub Actions 在以下情况自动部署到 GitHub Pages：
- 代码推送到 `main` 分支
- 手动触发 workflow

**在线演示**: https://zhongbinling.github.io/note_flow/

### 手动部署

如果自动部署失败：

```bash
# 本地构建
npm run build

# dist 文件夹包含生产文件
```

### 部署验证

1. 检查 GitHub Actions: https://github.com/zhongbinling/note_flow/actions
2. 确认 `gh-pages` 分支已更新
3. 测试在线演示 URL

---

## 发布检查清单

- [ ] 更新 `package.json` 中的版本号
- [ ] 更新 `CHANGELOG.md`
- [ ] 更新 `CHANGELOG_CN.md`
- [ ] 如需要，更新 `README.md`
- [ ] 运行测试: `npm run test:e2e`
- [ ] 运行 lint: `npm run lint`
- [ ] 本地构建: `npm run build`
- [ ] 创建 git 标签
- [ ] 推送标签到 GitHub
- [ ] 创建 GitHub Release
- [ ] 验证部署

---

## 紧急修复流程

对于严重的生产环境 Bug：

```bash
# 从 main 创建修复分支
git checkout main
git checkout -b fix/critical-bug

# 修复 Bug
git commit -m "fix: 紧急 Bug 描述"

# 合并到 main
git checkout main
git merge fix/critical-bug

# 创建补丁版本
# 增加 PATCH 版本号（如 0.2.0 → 0.2.1）
# 按上述发布流程操作
```

---

## 版本历史

| 版本 | 日期 | 描述 |
|---------|------|-------------|
| v0.1.0 | 2026-02-23 | 初始 MVP 发布 |

---

*最后更新: 2026-02-24*
