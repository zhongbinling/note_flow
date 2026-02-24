# Contributing to NoteFlow

Thank you for your interest in contributing to NoteFlow! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be considerate of others and follow standard open-source community guidelines.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:debug` | Debug tests |
| `npm run test:e2e:report` | View test report |

## Project Structure

```
noteflow/
├── src/
│   ├── components/
│   │   ├── Editor/          # Editor-related components
│   │   │   ├── MarkdownEditor.tsx
│   │   │   └── Outline.tsx
│   │   ├── Layout/          # Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── NoteList/        # Note list components
│   │   └── common/          # Shared/reusable components
│   ├── store/               # Zustand state stores
│   │   ├── noteStore.ts
│   │   └── themeStore.ts
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── tests/                   # E2E tests
├── public/                  # Static assets
└── ...config files
```

## Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types in `src/types/` or inline for local types
- Avoid `any` type when possible
- Use type imports: `import type { ... }`

### React

- Use functional components with hooks
- Use `useCallback` and `useMemo` for performance optimization when needed
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

### Styling

- Use Tailwind CSS utility classes
- Follow existing naming conventions
- Support dark mode with `dark:` variants

### Code Style

- Run `npm run lint` before committing
- Fix all linting errors
- Use meaningful variable and function names
- Add comments for complex logic

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |

### Examples

```
feat(editor): add image drag and drop support
fix(outline): correct scroll position in preview mode
docs(readme): update installation instructions
```

## Pull Request Process

1. **Create a branch**: Use descriptive branch names (e.g., `feat/image-upload`, `fix/outline-scroll`)

2. **Make your changes**: Follow coding standards and write clean code

3. **Test your changes**:
   - Run `npm run lint` to check for linting errors
   - Run `npm run test:e2e` to ensure tests pass
   - Test manually in the browser

4. **Commit your changes**: Follow commit guidelines

5. **Push to your fork**: `git push origin your-branch-name`

6. **Open a Pull Request**:
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI passes

7. **Code Review**: Address any feedback from maintainers

8. **Merge**: Once approved, a maintainer will merge your PR

## Reporting Bugs

### Before Submitting

1. Check if the bug has already been reported in [Issues](https://github.com/zhongbinling/noteflow/issues)
2. Try to reproduce the bug with the latest version
3. Collect relevant information (browser, OS, steps to reproduce)

### Submitting a Bug Report

Use the bug report template and include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**: Browser, OS, Node.js version

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Use the feature request template
3. Provide a clear description of the feature
4. Explain the use case and benefits
5. Consider including mockups or diagrams

---

Thank you for contributing to NoteFlow!
