# NoteFlow

<p align="center">
  <strong>A beautiful, powerful, and easy-to-use note-taking application with cloud sync</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.3.1-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.19-06B6D4?logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <a href="https://139.196.210.184"><img src="https://img.shields.io/badge/Demo-Live-brightgreen" alt="Live Demo"></a>
</p>

<p align="center">
  <a href="https://139.196.210.184">🎮 Online Demo</a>
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

### Cloud Sync (New!)
- **User Authentication**: Secure registration and login with JWT
- **Cloud Storage**: Sync notes across all your devices
- **Password Recovery**: Reset password via email
- **Offline Support**: Works offline, syncs when connected

### User Experience
- **Dark Mode**: Full dark theme support
- **Outline Navigation**: Quick navigation through document headings
- **Responsive Design**: Adapts to different screen sizes
- **Import/Export**: Export notes as Markdown or JSON, import back anytime

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/zhongbinling/noteflow.git
cd noteflow

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
npx prisma generate
npx prisma db push

# Start backend (terminal 1)
cd server
npm run dev

# Start frontend (terminal 2)
cd ..
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

**Quick deployment guide:** [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) / [DEPLOYMENT_GUIDE_CN.md](docs/DEPLOYMENT_GUIDE_CN.md)

Detailed deployment guides for different platforms:

| Platform | English | 中文 |
|----------|---------|------|
| 🚀 Quick Guide | [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | [DEPLOYMENT_GUIDE_CN.md](docs/DEPLOYMENT_GUIDE_CN.md) |
| 🪟 Windows | [DEPLOYMENT_WINDOWS.md](docs/DEPLOYMENT_WINDOWS.md) | [DEPLOYMENT_WINDOWS_CN.md](docs/DEPLOYMENT_WINDOWS_CN.md) |
| 🐧 Linux | [DEPLOYMENT_LINUX.md](docs/DEPLOYMENT_LINUX.md) | [DEPLOYMENT_LINUX_CN.md](docs/DEPLOYMENT_LINUX_CN.md) |
| 🍎 macOS | [DEPLOYMENT_MACOS.md](docs/DEPLOYMENT_MACOS.md) | [DEPLOYMENT_MACOS_CN.md](docs/DEPLOYMENT_MACOS_CN.md) |
| 🐳 Docker | [DEPLOYMENT_DOCKER.md](docs/DEPLOYMENT_DOCKER.md) | [DEPLOYMENT_DOCKER_CN.md](docs/DEPLOYMENT_DOCKER_CN.md) |

**Recommended free hosting options:**
- **[Render](https://render.com)** - Free web service + PostgreSQL
- **[Railway](https://railway.app)** - $5/month free credits
- **[Vercel](https://vercel.com)** - Free serverless deployment

### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build

# Start production server
npm run start
```

## Configuration

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/noteflow"

# JWT
JWT_SECRET=your-secure-random-secret
JWT_EXPIRES_IN=7d

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

### Frontend (.env)

```env
VITE_API_URL=https://api.your-domain.com/api
VITE_APP_URL=https://your-domain.com
```

See [CONFIGURATION.md](docs/CONFIGURATION.md) / [CONFIGURATION_CN.md](docs/CONFIGURATION_CN.md) for detailed configuration options.

## Tech Stack

### Frontend
| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Routing | React Router |
| Editor | CodeMirror |
| Icons | Lucide React |

### Backend
| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite / PostgreSQL |
| ORM | Prisma |
| Auth | JWT |
| Email | Nodemailer |

## API Reference

See [API_REFERENCE.md](docs/API_REFERENCE.md) / [API_REFERENCE_CN.md](docs/API_REFERENCE_CN.md) for detailed API documentation.

### Main Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password |
| GET | /api/notes | List notes |
| POST | /api/notes | Create note |
| GET | /api/folders | List folders |
| GET | /api/sync/pull | Pull sync data |
| POST | /api/sync/push | Push sync data |

## Project Structure

```
noteflow/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── stores/             # Zustand stores
│   ├── services/           # API services
│   └── pages/              # Page components
├── server/                 # Backend source
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration
│   └── prisma/             # Database schema
├── docs/                   # Documentation
└── dist/                   # Build output
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `cd server && npm run dev` | Start backend server |
| `cd server && npm run build` | Build backend |
| `cd server && npm run start` | Start production backend |

## Roadmap

### Phase 1 (Current - MVP)
- [x] Markdown editor with multiple modes
- [x] Folder-based organization
- [x] Full-text search
- [x] Dark mode
- [x] Import/Export
- [x] Cloud sync with authentication
- [x] Password reset via email

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
- [Prisma](https://www.prisma.io/) - Next-generation ORM

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/zhongbinling">zhongbinling</a>
</p>
