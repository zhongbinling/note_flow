# Release Guide

This document describes the version management and release process for NoteFlow.

<p align="right">
  <b>English</b> | <a href="RELEASE_CN.md">简体中文</a>
</p>

---

## Versioning

NoteFlow follows [Semantic Versioning (SemVer)](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Examples

| Version | Type | Description |
|---------|------|-------------|
| `0.1.0` → `0.1.1` | Patch | Bug fixes |
| `0.1.1` → `0.2.0` | Minor | New features |
| `0.2.0` → `1.0.0` | Major | Stable release / Breaking changes |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Development integration |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `release/*` | Release preparation |

### Workflow

```
feature/* → develop → release/* → main
    fix/* ────────────────────────┘
```

---

## Release Process

### 1. Prepare Release

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v0.2.0
```

### 2. Update Version

Update version in `package.json`:
```json
{
  "version": "0.2.0"
}
```

### 3. Update Changelog

Update `CHANGELOG.md` and `CHANGELOG_CN.md`:

```markdown
## [0.2.0] - 2026-03-01

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Change description
```

### 4. Commit & Push

```bash
git add package.json CHANGELOG.md CHANGELOG_CN.md
git commit -m "chore: bump version to 0.2.0"
git push origin release/v0.2.0
```

### 5. Create Pull Request

- Create PR from `release/v0.2.0` to `main`
- Review and merge

### 6. Create Tag & Release

```bash
# After merging to main
git checkout main
git pull origin main

# Create annotated tag
git tag -a v0.2.0 -m "Release v0.2.0

Features:
- Feature 1
- Feature 2

Fixes:
- Bug 1"

# Push tag
git push origin v0.2.0
```

### 7. GitHub Release

1. Go to https://github.com/zhongbinling/note_flow/releases
2. Click "Draft a new release"
3. Select the tag `v0.2.0`
4. Fill in release title and notes
5. Click "Publish release"

---

## Deployment

### Automatic Deployment

GitHub Actions automatically deploys to GitHub Pages when:
- Code is pushed to `main` branch
- Workflow is manually triggered

**Live Demo**: https://zhongbinling.github.io/note_flow/

### Manual Deployment

If automatic deployment fails:

```bash
# Build locally
npm run build

# The dist folder contains production files
```

### Deployment Verification

1. Check GitHub Actions: https://github.com/zhongbinling/note_flow/actions
2. Verify `gh-pages` branch is updated
3. Test live demo URL

---

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Update `CHANGELOG_CN.md`
- [ ] Update `README.md` if needed
- [ ] Run tests: `npm run test:e2e`
- [ ] Run lint: `npm run lint`
- [ ] Build locally: `npm run build`
- [ ] Create git tag
- [ ] Push tag to GitHub
- [ ] Create GitHub Release
- [ ] Verify deployment

---

## Hotfix Process

For critical production bugs:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b fix/critical-bug

# Fix the bug
git commit -m "fix: critical bug description"

# Merge to main
git checkout main
git merge fix/critical-bug

# Create patch release
# Bump PATCH version (e.g., 0.2.0 → 0.2.1)
# Follow release process above
```

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v0.1.0 | 2026-02-23 | Initial MVP release |

---

*Last updated: 2026-02-24*
