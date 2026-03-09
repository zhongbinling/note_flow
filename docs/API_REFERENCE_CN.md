# API 参考文档

本文档详细说明 NoteFlow 的所有 API 接口。

## 目录

- [基础信息](#基础信息)
- [认证接口](#认证接口)
- [笔记接口](#笔记接口)
- [文件夹接口](#文件夹接口)
- [同步接口](#同步接口)
- [错误处理](#错误处理)

## 基础信息

### 基础 URL

```
http://your-domain.com/api
```

### 请求格式

- Content-Type: `application/json`
- 认证方式: Bearer Token（需要登录的接口）

### 认证头

```http
Authorization: Bearer <your_jwt_token>
```

### 通用响应格式

**成功响应：**

```json
{
  "success": true,
  "data": { ... }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误信息"
}
```

## 认证接口

### 注册

创建新用户账号。

```http
POST /api/auth/register
```

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "name": "用户名（可选）"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "name": "用户名",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误码：**

- `400` - 邮箱或密码格式无效
- `409` - 邮箱已被注册

---

### 登录

用户登录获取 Token。

```http
POST /api/auth/login
```

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "name": "用户名",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误码：**

- `400` - 邮箱或密码缺失
- `401` - 邮箱或密码错误

---

### 获取当前用户

获取当前登录用户信息。

```http
GET /api/auth/me
```

**请求头：**

```http
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "email": "user@example.com",
    "name": "用户名",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误码：**

- `401` - 未授权（Token 无效或过期）

---

### 修改密码

修改当前用户密码。

```http
POST /api/auth/change-password
```

**请求头：**

```http
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**响应：**

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误码：**

- `400` - 密码格式无效
- `401` - 当前密码错误

---

### 忘记密码

请求发送密码重置邮件。

```http
POST /api/auth/forgot-password
```

**请求体：**

```json
{
  "email": "user@example.com"
}
```

**响应：**

```json
{
  "success": true,
  "message": "如果该邮箱已注册，您将收到重置密码邮件"
}
```

**注意：** 无论邮箱是否存在，都返回成功，以防止邮箱枚举攻击。

---

### 验证重置令牌

验证密码重置令牌是否有效。

```http
GET /api/auth/verify-reset-token/:token
```

**响应：**

```json
{
  "success": true,
  "message": "令牌有效"
}
```

**错误码：**

- `400` - 令牌无效或已过期

---

### 重置密码

使用重置令牌设置新密码。

```http
POST /api/auth/reset-password
```

**请求体：**

```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_password"
}
```

**响应：**

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

**错误码：**

- `400` - 令牌无效或已过期

---

### 登出

用户登出（客户端清除 Token）。

```http
POST /api/auth/logout
```

**请求头：**

```http
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 笔记接口

### 获取笔记列表

获取当前用户的所有笔记。

```http
GET /api/notes
```

**请求头：**

```http
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `folderId` | string | 按文件夹筛选 |
| `search` | string | 搜索关键词 |
| `page` | number | 页码（默认 1） |
| `limit` | number | 每页数量（默认 20） |

**响应：**

```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "clx123456",
        "title": "笔记标题",
        "content": "笔记内容...",
        "folderId": "clx789012",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

### 获取单个笔记

获取指定笔记详情。

```http
GET /api/notes/:id
```

**请求头：**

```http
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "title": "笔记标题",
    "content": "笔记内容...",
    "folderId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误码：**

- `404` - 笔记不存在

---

### 创建笔记

创建新笔记。

```http
POST /api/notes
```

**请求头：**

```http
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "title": "笔记标题",
  "content": "笔记内容（Markdown）",
  "folderId": "clx789012"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "title": "笔记标题",
    "content": "笔记内容（Markdown）",
    "folderId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新笔记

更新指定笔记。

```http
PUT /api/notes/:id
```

**请求头：**

```http
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "title": "新标题",
  "content": "新内容",
  "folderId": "clx789012"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "title": "新标题",
    "content": "新内容",
    "folderId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**错误码：**

- `404` - 笔记不存在

---

### 删除笔记

删除指定笔记。

```http
DELETE /api/notes/:id
```

**请求头：**

```http
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "message": "笔记已删除"
}
```

**错误码：**

- `404` - 笔记不存在

---

## 文件夹接口

### 获取文件夹列表

获取当前用户的所有文件夹。

```http
GET /api/folders
```

**请求头：**

```http
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "name": "文件夹名称",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 创建文件夹

创建新文件夹。

```http
POST /api/folders
```

**请求头：**

```http
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "name": "文件夹名称",
  "parentId": "clx789012"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "name": "文件夹名称",
    "parentId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新文件夹

更新指定文件夹。

```http
PUT /api/folders/:id
```

**请求头：**

```http
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "name": "新名称"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "name": "新名称",
    "parentId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 删除文件夹

删除指定文件夹及其下所有笔记。

```http
DELETE /api/folders/:id
```

**请求头：**

```http
Authorization: Bearer <token>
```

**响应：**

```json
{
  "success": true,
  "message": "文件夹已删除"
}
```

---

## 同步接口

### 拉取数据

从服务器拉取最新数据。

```http
GET /api/sync/pull
```

**请求头：**

```http
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `lastSyncAt` | string | 上次同步时间（ISO 8601） |

**响应：**

```json
{
  "success": true,
  "data": {
    "notes": [...],
    "folders": [...],
    "deleted": {
      "notes": ["note_id_1"],
      "folders": ["folder_id_1"]
    },
    "syncedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 推送数据

推送本地更改到服务器。

```http
POST /api/sync/push
```

**请求头：**

```http
Authorization: Bearer <token>
```

**请求体：**

```json
{
  "notes": {
    "created": [...],
    "updated": [...],
    "deleted": ["note_id_1"]
  },
  "folders": {
    "created": [...],
    "updated": [...],
    "deleted": ["folder_id_1"]
  },
  "lastSyncAt": "2024-01-01T00:00:00.000Z"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "conflicts": [],
    "syncedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `401` | 未授权（未登录或 Token 过期） |
| `403` | 禁止访问（无权限） |
| `404` | 资源不存在 |
| `409` | 冲突（如邮箱已存在） |
| `429` | 请求过于频繁（触发限流） |
| `500` | 服务器内部错误 |

### 速率限制

API 请求受速率限制：

- 一般接口：100 次/分钟
- 认证接口：10 次/分钟

超过限制时返回 `429` 状态码：

```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

响应头包含限制信息：

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```
