// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: Array<{ path: string[]; message: string }>;
}

export interface NoteResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    folderId: string | null;
    title: string;
    content: string;
    tags: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface FolderResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Helper function for API calls
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// Auth API
export const authApi = {
  // Register
  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get current user
  me: async (): Promise<{ success: boolean; data: User }> => {
    return apiRequest('/auth/me');
  },

  // Logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Verify reset token
  verifyResetToken: async (token: string): Promise<{ success: boolean; data?: { email: string; name: string | null } }> => {
    return apiRequest(`/auth/verify-reset-token/${token}`);
  },
};

// Notes API
export const notesApi = {
  // Get all notes
  getAll: async (): Promise<{ success: boolean; data: NoteResponse['data'][] }> => {
    return apiRequest('/notes');
  },

  // Get single note
  get: async (id: string): Promise<NoteResponse> => {
    return apiRequest(`/notes/${id}`);
  },

  // Create note
  create: async (data: { title: string; content: string; folderId?: string }): Promise<NoteResponse> => {
    return apiRequest('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update note
  update: async (id: string, data: { title?: string; content?: string; folderId?: string | null }): Promise<NoteResponse> => {
    return apiRequest(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete note
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/notes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Folders API
export const foldersApi = {
  // Get all folders
  getAll: async (): Promise<{ success: boolean; data: FolderResponse['data'][] }> => {
    return apiRequest('/folders');
  },

  // Create folder
  create: async (data: { name: string; parentId?: string }): Promise<FolderResponse> => {
    return apiRequest('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update folder
  update: async (id: string, data: { name?: string; parentId?: string | null }): Promise<FolderResponse> => {
    return apiRequest(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete folder
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/folders/${id}`, {
      method: 'DELETE',
    });
  },
};

// Sync API
export const syncApi = {
  // Pull all data from server
  pull: async (): Promise<{
    success: boolean;
    data: {
      folders: Array<{
        id: string;
        userId: string;
        name: string;
        parentId: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
      notes: Array<{
        id: string;
        userId: string;
        folderId: string | null;
        title: string;
        content: string;
        tags: string;
        createdAt: string;
        updatedAt: string;
      }>;
      lastSyncTime: string;
    };
  }> => {
    return apiRequest('/sync/pull');
  },

  // Push local data to server
  push: async (data: {
    folders?: Array<{
      id: string;
      name: string;
      parentId?: string;
      action: 'create' | 'update';
    }>;
    notes?: Array<{
      id: string;
      title: string;
      content: string;
      folderId?: string;
      action: 'create' | 'update';
    }>;
  }) => {
    return apiRequest('/sync/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
