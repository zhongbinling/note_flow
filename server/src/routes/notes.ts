import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  getSyncData,
  batchSync,
} from '../services/notes.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Notes ====================

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/notes - Get all notes
router.get('/notes', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const notes = await getNotes(req.userId);
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/notes/:id - Get single note
router.get('/notes/:id', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const note = await getNoteById(req.params.id, req.userId);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/notes - Create note
router.post('/notes', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = createNoteSchema.parse(req.body);
    const note = await createNote(req.userId, validatedData);

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Create note error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/notes/:id - Update note
router.put('/notes/:id', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = updateNoteSchema.parse(req.body);
    const note = await updateNote(req.params.id, req.userId, validatedData);

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Update note error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/notes/:id', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const deleted = await deleteNote(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== Folders ====================

const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.string().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
});

// GET /api/folders - Get all folders
router.get('/folders', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const folders = await getFolders(req.userId);
    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/folders - Create folder
router.post('/folders', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = createFolderSchema.parse(req.body);
    const folder = await createFolder(req.userId, validatedData);

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Create folder error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/folders/:id - Update folder
router.put('/folders/:id', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = updateFolderSchema.parse(req.body);
    const folder = await updateFolder(req.params.id, req.userId, validatedData);

    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    res.json({ success: true, data: folder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Update folder error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/folders/:id - Delete folder
router.delete('/folders/:id', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const deleted = await deleteFolder(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==================== Sync ====================

// GET /api/sync/pull - Get all data for sync
router.get('/sync/pull', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const data = await getSyncData(req.userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Sync pull error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/sync/push - Batch sync data
router.post('/sync/push', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const data = await batchSync(req.userId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
