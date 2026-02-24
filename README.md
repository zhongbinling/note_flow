# NoteFlow

<p align="center">
  <strong>A beautiful, powerful, and easy-to-use note-taking application</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.3.1-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.19-06B6D4?logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

<p align="center">
  <b>English</b> | <a href="README_CN.md">简体中文</a>
</p>

---

## Features

### Editor
- **Multiple Editor Modes**: Edit, Split, Preview, and Rich Text (WYSIWYG)
- **Markdown Support**: Full Markdown syntax with real-time preview
- **Code Highlighting**: Syntax highlighting for code blocks
- **Format Toolbar**: Bold, italic, headings, lists, quotes, code, links, images
- **Image Support**: Paste or upload images with automatic compression
- **Auto-save**: Debounced saving to prevent data loss

### Organization
- **Folder Management**: Create, rename, and delete folders
- **Note Organization**: Move notes between folders
- **Full-text Search**: Search across titles, content, and tags with highlighting

### User Experience
- **Dark Mode**: Full dark theme support
- **Outline Navigation**: Quick navigation through document headings
- **Responsive Design**: Adapts to different screen sizes
- **Import/Export**: Export notes as Markdown or JSON, import back anytime

## Screenshots

> Screenshots will be added soon

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

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

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Editor | CodeMirror |
| Markdown Parser | marked |
| HTML to Markdown | Turndown |
| State Management | Zustand |
| Icons | Lucide React |
| E2E Testing | Playwright |

## Project Structure

```
noteflow/
├── src/
│   ├── components/
│   │   ├── Editor/          # Markdown editor components
│   │   ├── Layout/          # Layout components (Sidebar, Header)
│   │   ├── NoteList/        # Note list component
│   │   └── common/          # Shared components
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Entry point
├── tests/                   # Playwright E2E tests
├── public/                  # Static assets
└── ...config files
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run test:e2e:report` | View test report |

## Roadmap

### Phase 1 (Current - MVP)
- [x] Markdown editor with multiple modes
- [x] Folder-based organization
- [x] Full-text search
- [x] Dark mode
- [x] Import/Export

### Phase 2
- [ ] Bidirectional links `[[note-name]]`
- [ ] Backlinks panel
- [ ] Tag system
- [ ] Knowledge graph visualization

### Phase 3
- [ ] AI writing assistant
- [ ] Multiple AI model support
- [ ] Local model support (Ollama)

### Phase 4
- [ ] Electron desktop app
- [ ] Local file system access
- [ ] Plugin system

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CodeMirror](https://codemirror.net/) - Versatile text editor
- [marked](https://marked.js.org/) - Markdown parser
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/zhongbinling">zhongbinling</a>
</p>
