# 账号系统设计

NoteFlow 用户认证和数据同步系统设计。

<p align="right">
  <a href="ACCOUNT_SYSTEM.md">English</a> | <b>简体中文</b>
</p>

---

## 概述

### 目标

- 用户注册和登录
- 安全的云端数据存储
- 跨设备数据同步
- 本地数据迁移到云端

### 范围

| 包含 | 不包含 |
|----------|--------------|
| 用户注册 | 社交登录（OAuth） |
| 邮箱/密码登录 | 双因素认证 |
| 云端数据存储 | 团队协作 |
| 数据同步 | 离线模式优化 |

---

## 系统架构

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  认证   │  │  笔记   │  │  同步   │  │   本地存储      │ │
│  │ Context │  │  Store  │  │ Service │  │  (IndexedDB)    │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       后端 (Node.js)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  认证   │  │  笔记   │  │  同步   │  │     中间件      │ │
│  │ Service │  │ Service │  │ Service │  │  (JWT, 限流)    │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据库 (PostgreSQL)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    用户     │  │    笔记     │  │    文件夹/标签      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术选型

### 后端

| 组件 | 技术 | 原因 |
|-----------|------------|--------|
| 运行时 | Node.js 20+ | 与前端生态统一 |
| 框架 | Express.js / Fastify | 成熟、文档完善 |
| 数据库 | PostgreSQL | 可靠、支持 JSON |
| ORM | Prisma | 类型安全、支持迁移 |
| 认证 | JWT + bcrypt | 无状态、安全 |
| 验证 | Zod | 与前端共享类型 |

### 前端（新增）

| 组件 | 技术 | 原因 |
|-----------|------------|--------|
| 状态管理 | Zustand（已有） | 已在使用 |
| HTTP | Axios / Fetch | API 通信 |
| 存储 | IndexedDB | 大数据量、离线支持 |
| 认证上下文 | React Context | 全局认证状态 |

### 基础设施

| 组件 | 方案 A | 方案 B |
|-----------|----------|----------|
| 托管 | Vercel | Railway |
| 数据库 | Supabase | Neon |
| 文件存储 | S3 | Supabase Storage |

---

## 数据库设计

### ER 图

```
┌──────────────┐       ┌──────────────┐
│    users     │       │   folders    │
│    用户表    │       │   文件夹表   │
├──────────────┤       ├──────────────┤
│ id (主键)    │───┐   │ id (主键)    │
│ email        │   │   │ user_id (FK)│◄──┐
│ password     │   │   │ name        │   │
│ name         │   │   │ parent_id   │   │
│ created_at   │   │   │ created_at  │   │
│ updated_at   │   │   └──────────────┘   │
└──────────────┘   │                      │
       │           │   ┌──────────────┐   │
       │           │   │    notes     │   │
       │           │   │    笔记表    │   │
       │           │   ├──────────────┤   │
       │           └──►│ id (主键)    │   │
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
       │           │   会话表     │
       │           ├──────────────┤
       └──────────►│ id (主键)    │
                   │ user_id (FK) │
                   │ token        │
                   │ expires_at   │
                   └──────────────┘
```

### 表结构说明

#### 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键，CUID |
| email | String | 邮箱，唯一 |
| password | String | 加密后的密码 |
| name | String? | 昵称 |
| avatar | String? | 头像 URL |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### 笔记表 (notes)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| user_id | String | 用户 ID（外键） |
| folder_id | String? | 文件夹 ID（外键） |
| title | String | 标题 |
| content | Text | 内容（Markdown） |
| tags | String[] | 标签数组 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

#### 文件夹表 (folders)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| user_id | String | 用户 ID |
| name | String | 文件夹名称 |
| parent_id | String? | 父文件夹 ID |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

---

## API 设计

### 认证接口

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| GET | `/api/auth/me` | 获取当前用户 |

### 请求/响应示例

#### 注册

```typescript
// POST /api/auth/register
// 请求体
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "张三"
}

// 响应 (201)
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123...",
      "email": "user@example.com",
      "name": "张三"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 登录

```typescript
// POST /api/auth/login
// 请求体
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// 响应 (200)
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 笔记接口

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| GET | `/api/notes` | 获取所有笔记 |
| GET | `/api/notes/:id` | 获取单个笔记 |
| POST | `/api/notes` | 创建笔记 |
| PUT | `/api/notes/:id` | 更新笔记 |
| DELETE | `/api/notes/:id` | 删除笔记 |

### 文件夹接口

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| GET | `/api/folders` | 获取所有文件夹 |
| POST | `/api/folders` | 创建文件夹 |
| PUT | `/api/folders/:id` | 更新文件夹 |
| DELETE | `/api/folders/:id` | 删除文件夹 |

### 同步接口

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| POST | `/api/sync/push` | 推送本地更改 |
| GET | `/api/sync/pull` | 拉取远程更改 |
| GET | `/api/sync/status` | 获取同步状态 |

---

## 前端改造

### 新增组件结构

```
src/
├── components/
│   └── Auth/
│       ├── LoginForm.tsx       # 登录表单
│       ├── RegisterForm.tsx    # 注册表单
│       ├── AuthModal.tsx       # 认证弹窗
│       └── ProtectedRoute.tsx  # 路由保护
├── contexts/
│   └── AuthContext.tsx         # 认证上下文
├── services/
│   ├── api.ts                  # API 基础配置
│   ├── authService.ts          # 认证服务
│   └── syncService.ts          # 同步服务
├── stores/
│   └── authStore.ts            # 认证状态
└── types/
    └── auth.ts                 # 类型定义
```

### 认证状态管理

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

### 数据迁移策略

```
本地存储 → 云端存储迁移流程：

1. 用户首次登录
2. 系统检测到存在本地数据
3. 提示："是否将本地笔记导入到云端？"
4. 如果是：
   - 读取所有本地数据（笔记、文件夹）
   - 批量上传到服务器
   - 清空本地存储（可选）
   - 从云端重新加载
5. 如果否：
   - 保留本地数据独立
   - 后续可手动导出
```

---

## 安全考虑

### 密码安全

- bcrypt 加密，cost factor = 12
- 最少 8 个字符
- 要求：大写、小写、数字

### Token 安全

- JWT 使用 RS256 或 HS256
- 访问令牌：15 分钟有效期
- 刷新令牌：7 天有效期
- 存储在 httpOnly cookies（推荐）或 localStorage

### API 安全

- 限流：100 请求/分钟
- 使用 Zod 进行输入验证
- SQL 注入防护（Prisma）
- XSS 防护
- CORS 配置

### 数据保护

- 仅 HTTPS
- 敏感数据静态加密
- 定期备份
- GDPR 合规考虑

---

## 实现阶段

### 第一阶段：后端基础（第 1-2 周）

- [ ] 搭建 Node.js 项目
- [ ] 配置 PostgreSQL + Prisma
- [ ] 实现用户模型
- [ ] 实现认证接口
- [ ] 添加 JWT 中间件

### 第二阶段：核心功能（第 3-4 周）

- [ ] 笔记 CRUD 接口
- [ ] 文件夹 CRUD 接口
- [ ] 基础同步接口
- [ ] API 文档

### 第三阶段：前端集成（第 5-6 周）

- [ ] 认证 UI 组件
- [ ] 认证状态集成
- [ ] API 服务层
- [ ] 路由保护

### 第四阶段：数据迁移（第 7 周）

- [ ] 本地数据检测
- [ ] 迁移流程 UI
- [ ] 批量上传
- [ ] 冲突解决

### 第五阶段：测试优化（第 8 周）

- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 性能优化

---

## 成本估算

### 开发成本

| 阶段 | 周期 | 工作量 |
|-------|----------|--------|
| 后端开发 | 2 周 | 高 |
| API 开发 | 2 周 | 中 |
| 前端集成 | 2 周 | 中 |
| 数据迁移 | 1 周 | 中 |
| 测试 | 1 周 | 低 |
| **总计** | **8 周** | - |

### 基础设施（月度）

| 服务 | 费用 |
|---------|------|
| 托管（Vercel/Railway） | $0-20 |
| 数据库（Supabase/Neon） | $0-25 |
| 文件存储 | $0-5 |
| **总计** | **$0-50/月** |

---

## 待确认问题

1. **社交登录**：是否在第二阶段添加 Google/GitHub OAuth？
2. **邮箱验证**：是否需要邮箱确认？
3. **密码重置**：是否实现忘记密码流程？
4. **数据限制**：免费版存储限制是多少？
5. **离线模式**：如何处理离线编辑？

---

## 参考资料

- [JWT 最佳实践](https://auth0.com/blog/jwt-authentication-best-practices/)
- [OWASP 认证备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Prisma 文档](https://www.prisma.io/docs)

---

*创建时间: 2026-02-24*
*状态: 设计阶段*
