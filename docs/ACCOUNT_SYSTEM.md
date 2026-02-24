# Account System Design

User authentication and data synchronization system design for NoteFlow.

<p align="right">
  <b>English</b> | <a href="ACCOUNT_SYSTEM_CN.md">简体中文</a>
</p>

---

## Overview

### Goals

- User registration and login
- Secure data storage in cloud database
- Cross-device data synchronization
- Migration from local storage to cloud storage

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| User registration | Social login (OAuth) |
| Email/password login | Two-factor authentication |
| Cloud data storage | Team collaboration |
| Data sync | Offline mode optimization |

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Auth   │  │  Notes  │  │  Sync   │  │  Local Storage  │ │
│  │Context  │  │  Store  │  │ Service │  │  (IndexedDB)    │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend (Node.js)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Auth   │  │  Notes  │  │  Sync   │  │   Middleware    │ │
│  │ Service │  │ Service │  │ Service │  │  (JWT, Rate)    │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Users    │  │    Notes    │  │    Folders/Tags     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend

| Component | Technology | Reason |
|-----------|------------|--------|
| Runtime | Node.js 20+ | Same ecosystem as frontend |
| Framework | Express.js / Fastify | Mature, well-documented |
| Database | PostgreSQL | Reliable, JSON support |
| ORM | Prisma | Type-safe, migrations |
| Auth | JWT + bcrypt | Stateless, secure |
| Validation | Zod | Shared types with frontend |

### Frontend (Additions)

| Component | Technology | Reason |
|-----------|------------|--------|
| State | Zustand (existing) | Already in use |
| HTTP | Axios / Fetch | API communication |
| Storage | IndexedDB | Large data, offline support |
| Auth Context | React Context | Global auth state |

### Infrastructure

| Component | Option A | Option B |
|-----------|----------|----------|
| Hosting | Vercel | Railway |
| Database | Supabase | Neon |
| File Storage | S3 | Supabase Storage |

---

## Database Schema

### ER Diagram

```
┌──────────────┐       ┌──────────────┐
│    users     │       │   folders    │
├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │
│ email        │   │   │ user_id (FK) │◄──┐
│ password     │   │   │ name         │   │
│ name         │   │   │ parent_id    │   │
│ created_at   │   │   │ created_at   │   │
│ updated_at   │   │   └──────────────┘   │
└──────────────┘   │                      │
       │           │   ┌──────────────┐   │
       │           │   │    notes     │   │
       │           │   ├──────────────┤   │
       │           └──►│ id (PK)      │   │
       │               │ user_id (FK) │   │
       │               │ folder_id(FK)│───┘
       │               │ title        │
       │               │ content      │
       │               │ tags         │
       │               │ created_at   │
       │               │ updated_at   │
       │               └──────────────┘
       │
       │           ┌──────────────┐
       │           │   sessions   │
       │           ├──────────────┤
       └──────────►│ id (PK)      │
                   │ user_id (FK) │
                   │ token        │
                   │ expires_at   │
                   └──────────────┘
```

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  folders   Folder[]
  notes     Note[]
  sessions  Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
}

model Folder {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  parentId  String?
  parent    Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderHierarchy")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notes     Note[]

  @@index([userId])
  @@index([parentId])
}

model Note {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  folderId  String?
  folder    Folder?  @relation(fields: [folderId], references: [id], onDelete: SetNull)
  title     String
  content   String   @db.Text
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([folderId])
}
```

---

## API Design

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |

### Request/Response Examples

#### Register

```typescript
// POST /api/auth/register
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

// Response (201)
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```typescript
// POST /api/auth/login
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Notes Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes |
| GET | `/api/notes/:id` | Get single note |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

### Folders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | List all folders |
| POST | `/api/folders` | Create folder |
| PUT | `/api/folders/:id` | Update folder |
| DELETE | `/api/folders/:id` | Delete folder |

### Sync Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/push` | Push local changes |
| GET | `/api/sync/pull` | Pull remote changes |
| GET | `/api/sync/status` | Get sync status |

---

## Frontend Changes

### New Components

```
src/
├── components/
│   └── Auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       ├── AuthModal.tsx
│       └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   ├── api.ts
│   ├── authService.ts
│   └── syncService.ts
├── stores/
│   └── authStore.ts
└── types/
    └── auth.ts
```

### Auth Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}
```

### Data Migration Strategy

```
Local Storage → Cloud Storage Migration Flow:

1. User logs in for the first time
2. System detects local data exists
3. Prompt: "Import local notes to cloud?"
4. If yes:
   - Read all local data (notes, folders)
   - Batch upload to server
   - Clear local storage (optional)
   - Reload from cloud
5. If no:
   - Keep local data separate
   - Option to export manually later
```

---

## Security Considerations

### Password Security

- bcrypt with cost factor 12
- Minimum 8 characters
- Require: uppercase, lowercase, number

### Token Security

- JWT with RS256 or HS256
- Access token: 15 minutes
- Refresh token: 7 days
- Store in httpOnly cookies (recommended) or localStorage

### API Security

- Rate limiting: 100 requests/minute
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS prevention
- CORS configuration

### Data Protection

- HTTPS only
- Encrypt sensitive data at rest
- Regular backups
- GDPR compliance considerations

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1-2)

- [ ] Setup Node.js project
- [ ] Configure PostgreSQL + Prisma
- [ ] Implement user model
- [ ] Implement auth endpoints
- [ ] Add JWT middleware

### Phase 2: Core Features (Week 3-4)

- [ ] Notes CRUD endpoints
- [ ] Folders CRUD endpoints
- [ ] Basic sync endpoint
- [ ] API documentation

### Phase 3: Frontend Integration (Week 5-6)

- [ ] Auth UI components
- [ ] Auth store integration
- [ ] API service layer
- [ ] Protected routes

### Phase 4: Data Migration (Week 7)

- [ ] Local data detection
- [ ] Migration flow UI
- [ ] Batch upload
- [ ] Conflict resolution

### Phase 5: Testing & Polish (Week 8)

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization

---

## Cost Estimation

### Development

| Phase | Duration | Effort |
|-------|----------|--------|
| Backend | 2 weeks | High |
| API | 2 weeks | Medium |
| Frontend | 2 weeks | Medium |
| Migration | 1 week | Medium |
| Testing | 1 week | Low |
| **Total** | **8 weeks** | - |

### Infrastructure (Monthly)

| Service | Cost |
|---------|------|
| Hosting (Vercel/Railway) | $0-20 |
| Database (Supabase/Neon) | $0-25 |
| File Storage | $0-5 |
| **Total** | **$0-50/month** |

---

## Open Questions

1. **Social Login**: Add Google/GitHub OAuth in Phase 2?
2. **Email Verification**: Require email confirmation?
3. **Password Reset**: Implement forgot password flow?
4. **Data Limits**: Free tier storage limits?
5. **Offline Mode**: How to handle offline edits?

---

## References

- [JWT Best Practices](https://auth0.com/blog/jwt-authentication-best-practices/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Prisma Documentation](https://www.prisma.io/docs)

---

*Created: 2026-02-24*
*Status: Design Phase*
