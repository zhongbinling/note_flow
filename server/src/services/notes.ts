import { prisma } from './database.js';
import type { Note, Folder } from '@prisma/client';

// Note types
export interface CreateNoteData {
  title: string;
  content: string;
  folderId?: string;
  tags?: string[];
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  folderId?: string | null;
  tags?: string[];
}

// Folder types
export interface CreateFolderData {
  name: string;
  parentId?: string;
}

export interface UpdateFolderData {
  name?: string;
  parentId?: string | null;
}

// ==================== Notes ====================

// Get all notes for a user
export async function getNotes(userId: string): Promise<Note[]> {
  return prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

// Get a single note
export async function getNoteById(noteId: string, userId: string): Promise<Note | null> {
  return prisma.note.findFirst({
    where: {
      id: noteId,
      userId,
    },
  });
}

// Create a note
export async function createNote(userId: string, data: CreateNoteData): Promise<Note> {
  return prisma.note.create({
    data: {
      userId,
      title: data.title,
      content: data.content,
      folderId: data.folderId || null,
      tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : '[]',
    },
  });
}

// Update a note
export async function updateNote(
  noteId: string,
  userId: string,
  data: UpdateNoteData
): Promise<Note | null> {
  // First check if note belongs to user
  const existingNote = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!existingNote) {
    return null;
  }

  return prisma.note.update({
    where: { id: noteId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.folderId !== undefined && { folderId: data.folderId }),
      ...(data.tags !== undefined && { tags: JSON.stringify(data.tags) }),
    },
  });
}

// Delete a note
export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  // First check if note belongs to user
  const existingNote = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  if (!existingNote) {
    return false;
  }

  await prisma.note.delete({
    where: { id: noteId },
  });

  return true;
}

// ==================== Folders ====================

// Get all folders for a user
export async function getFolders(userId: string): Promise<Folder[]> {
  return prisma.folder.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

// Get a single folder
export async function getFolderById(folderId: string, userId: string): Promise<Folder | null> {
  return prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
  });
}

// Create a folder
export async function createFolder(userId: string, data: CreateFolderData): Promise<Folder> {
  return prisma.folder.create({
    data: {
      userId,
      name: data.name,
      parentId: data.parentId || null,
    },
  });
}

// Update a folder
export async function updateFolder(
  folderId: string,
  userId: string,
  data: UpdateFolderData
): Promise<Folder | null> {
  // First check if folder belongs to user
  const existingFolder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });

  if (!existingFolder) {
    return null;
  }

  return prisma.folder.update({
    where: { id: folderId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    },
  });
}

// Delete a folder (notes will be moved to no folder)
export async function deleteFolder(folderId: string, userId: string): Promise<boolean> {
  // First check if folder belongs to user
  const existingFolder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });

  if (!existingFolder) {
    return false;
  }

  // Move notes in this folder to no folder
  await prisma.note.updateMany({
    where: { folderId, userId },
    data: { folderId: null },
  });

  // Delete the folder
  await prisma.folder.delete({
    where: { id: folderId },
  });

  return true;
}

// ==================== Sync ====================

// Sync data response
export interface SyncData {
  folders: Folder[];
  notes: Note[];
  lastSyncTime: string;
}

// Get all data for sync
export async function getSyncData(userId: string): Promise<SyncData> {
  const [folders, notes] = await Promise.all([
    getFolders(userId),
    getNotes(userId),
  ]);

  return {
    folders,
    notes,
    lastSyncTime: new Date().toISOString(),
  };
}

// Batch sync - upload local data
export async function batchSync(
  userId: string,
  data: {
    folders?: Array<{ id: string; name: string; parentId?: string; action: 'create' | 'update' }>;
    notes?: Array<{ id: string; title: string; content: string; folderId?: string; action: 'create' | 'update' }>;
  }
): Promise<SyncData> {
  // Process folders
  if (data.folders) {
    for (const folder of data.folders) {
      if (folder.action === 'create') {
        // Check if folder already exists
        const existing = await prisma.folder.findFirst({
          where: { id: folder.id, userId },
        });
        if (!existing) {
          await prisma.folder.create({
            data: {
              id: folder.id,
              userId,
              name: folder.name,
              parentId: folder.parentId || null,
            },
          });
        }
      } else if (folder.action === 'update') {
        await prisma.folder.updateMany({
          where: { id: folder.id, userId },
          data: {
            name: folder.name,
            parentId: folder.parentId || null,
          },
        });
      }
    }
  }

  // Process notes
  if (data.notes) {
    for (const note of data.notes) {
      if (note.action === 'create') {
        // Check if note already exists
        const existing = await prisma.note.findFirst({
          where: { id: note.id, userId },
        });
        if (!existing) {
          await prisma.note.create({
            data: {
              id: note.id,
              userId,
              title: note.title,
              content: note.content,
              folderId: note.folderId || null,
              tags: '[]',
            },
          });
        }
      } else if (note.action === 'update') {
        await prisma.note.updateMany({
          where: { id: note.id, userId },
          data: {
            title: note.title,
            content: note.content,
            folderId: note.folderId || null,
          },
        });
      }
    }
  }

  // Return updated data
  return getSyncData(userId);
}
