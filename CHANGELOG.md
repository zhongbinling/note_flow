# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-23

### Added

#### Editor
- Markdown editor with 4 modes: Edit, Split, Preview, and Rich Text (WYSIWYG)
- Real-time preview with code syntax highlighting
- Format toolbar with bold, italic, headings, lists, quotes, code, links support
- Image insertion via paste or file upload with automatic compression (>10KB)
- Auto-save with 1000ms debounce
- Keyboard shortcuts for common formatting operations

#### Rich Text Mode
- WYSIWYG editing using contentEditable
- HTML to Markdown conversion using Turndown
- Direct image insertion as HTML elements
- Format preservation during editing

#### Organization
- Folder management (create, rename, delete)
- Move notes between folders
- Default "General" folder for new notes
- Folder filtering in sidebar

#### Search
- Full-text search across titles, content, and tags
- Search highlighting in results
- Real-time filtering

#### User Interface
- Dark mode with system preference detection
- Outline navigation for document headings
- Responsive three-column layout
- Saving status indicator
- Smooth transitions and animations

#### Import/Export
- Export single note as Markdown (.md)
- Export all notes as JSON backup
- Import Markdown files
- Import JSON backup

#### Testing
- Playwright E2E testing setup
- Test cases for core features

### Fixed
- Outline click causing toolbar disappearance (browser layout bug with `scrollIntoView`)
- Preview mode outline navigation accuracy
- Rich mode content synchronization issues
- Race conditions when switching notes rapidly
- Format changes not being saved in Rich mode
- Cursor position issues in editor
- Scroll behavior in all editor modes

### Technical
- React 19 + TypeScript + Vite setup
- Tailwind CSS for styling
- Zustand for state management with persistence
- CodeMirror for Markdown editing
- Lucide React for icons

---

## Future Releases

### [0.2.0] - Planned
- Bidirectional links `[[note-name]]`
- Backlinks panel
- Tag system
- Improved search with filters

### [0.3.0] - Planned
- AI writing assistant integration
- Multiple AI model support (Claude, OpenAI, etc.)
- Custom API key configuration

### [1.0.0] - Planned
- Electron desktop application
- Local file system access
- Knowledge graph visualization
- Plugin system

---

[0.1.0]: https://github.com/zhongbinling/noteflow/releases/tag/v0.1.0
