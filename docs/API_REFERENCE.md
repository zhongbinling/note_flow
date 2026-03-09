# API Reference

This document details all API endpoints for NoteFlow.

## Table of Contents

- [Basic Information](#basic-information)
- [Authentication Endpoints](#authentication-endpoints)
- [Notes Endpoints](#notes-endpoints)
- [Folders Endpoints](#folders-endpoints)
- [Sync Endpoints](#sync-endpoints)
- [Error Handling](#error-handling)

## Basic Information

### Base URL

```
http://your-domain.com/api
```

### Request Format

- Content-Type: `application/json`
- Authentication: Bearer Token (for protected endpoints)

### Authorization Header

```http
Authorization: Bearer <your_jwt_token>
```

### Common Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication Endpoints

### Register

Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "name": "Username (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "name": "Username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Codes:**

- `400` - Invalid email or password format
- `409` - Email already registered

---

### Login

User login to get Token.

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123456",
      "email": "user@example.com",
      "name": "Username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Codes:**

- `400` - Missing email or password
- `401` - Invalid email or password

---

### Get Current User

Get current logged-in user information.

```http
GET /api/auth/me
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "email": "user@example.com",
    "name": "Username",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Codes:**

- `401` - Unauthorized (invalid or expired token)

---

### Change Password

Change current user's password.

```http
POST /api/auth/change-password
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Codes:**

- `400` - Invalid password format
- `401` - Current password is incorrect

---

### Forgot Password

Request a password reset email.

```http
POST /api/auth/forgot-password
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If that email is registered, you will receive a password reset email"
}
```

**Note:** Always returns success to prevent email enumeration attacks.

---

### Verify Reset Token

Verify if password reset token is valid.

```http
GET /api/auth/verify-reset-token/:token
```

**Response:**

```json
{
  "success": true,
  "message": "Token is valid"
}
```

**Error Codes:**

- `400` - Invalid or expired token

---

### Reset Password

Set new password using reset token.

```http
POST /api/auth/reset-password
```

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Codes:**

- `400` - Invalid or expired token

---

### Logout

User logout (client clears token).

```http
POST /api/auth/logout
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Notes Endpoints

### List Notes

Get all notes for current user.

```http
GET /api/notes
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `folderId` | string | Filter by folder |
| `search` | string | Search keyword |
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20) |

**Response:**

```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": "clx123456",
        "title": "Note Title",
        "content": "Note content...",
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

### Get Single Note

Get specific note details.

```http
GET /api/notes/:id
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "title": "Note Title",
    "content": "Note content...",
    "folderId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Codes:**

- `404` - Note not found

---

### Create Note

Create a new note.

```http
POST /api/notes
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Note Title",
  "content": "Note content (Markdown)",
  "folderId": "clx789012"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "title": "Note Title",
    "content": "Note content (Markdown)",
    "folderId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update Note

Update a specific note.

```http
PUT /api/notes/:id
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "New Title",
  "content": "New Content",
  "folderId": "clx789012"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "title": "New Title",
    "content": "New Content",
    "folderId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Codes:**

- `404` - Note not found

---

### Delete Note

Delete a specific note.

```http
DELETE /api/notes/:id
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Note deleted"
}
```

**Error Codes:**

- `404` - Note not found

---

## Folders Endpoints

### List Folders

Get all folders for current user.

```http
GET /api/folders
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123456",
      "name": "Folder Name",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Create Folder

Create a new folder.

```http
POST /api/folders
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Folder Name",
  "parentId": "clx789012"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "name": "Folder Name",
    "parentId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update Folder

Update a specific folder.

```http
PUT /api/folders/:id
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "New Name"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123456",
    "name": "New Name",
    "parentId": "clx789012",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### Delete Folder

Delete a specific folder and all notes within it.

```http
DELETE /api/folders/:id
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Folder deleted"
}
```

---

## Sync Endpoints

### Pull Data

Pull latest data from server.

```http
GET /api/sync/pull
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lastSyncAt` | string | Last sync time (ISO 8601) |

**Response:**

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

### Push Data

Push local changes to server.

```http
POST /api/sync/push
```

**Request Header:**

```http
Authorization: Bearer <token>
```

**Request Body:**

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

**Response:**

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

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error description"
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request (invalid parameters) |
| `401` | Unauthorized (not logged in or token expired) |
| `403` | Forbidden (no permission) |
| `404` | Resource not found |
| `409` | Conflict (e.g., email already exists) |
| `429` | Too many requests (rate limited) |
| `500` | Internal server error |

### Rate Limiting

API requests are rate limited:

- General endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute

When exceeded, returns `429` status code:

```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

Response headers include limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```
