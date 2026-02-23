import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import JSZip from 'jszip';

// Types defined inline to avoid import issues
export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

// Default notes for first time users
const defaultNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to NoteFlow',
    content: `# Welcome to NoteFlow

This is your new **Markdown** note-taking app.

## Features

- Real-time preview
- Beautiful UI
- Dark mode support
- Auto-save to browser storage

### Code Example

\`\`\`typescript
const greeting = "Hello, NoteFlow!";
console.log(greeting);
\`\`\`

## Getting Started

1. Create a new note
2. Write in Markdown
3. Enjoy the experience!

> "The best note is the one you can find." - Someone wise

Check out our [GitHub](https://github.com) for more info.
`,
    folder: 'General',
    tags: ['welcome', 'tutorial'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: '2',
    title: 'Project Ideas',
    content: `# Project Ideas

A collection of ideas for future projects.

## Web Development

- Build a personal blog
- Create a portfolio site
- Develop a task manager

## Mobile Apps

- Fitness tracker
- Recipe organizer
- Travel planner

## Learning Goals

- [ ] Learn TypeScript
- [ ] Master React
- [ ] Explore Rust
`,
    folder: 'Ideas',
    tags: ['projects', 'ideas'],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: '3',
    title: 'Meeting Notes - Feb 19',
    content: `# Meeting Notes - Feb 19

**Attendees:** Team A, Team B

## Agenda

1. Project updates
2. Budget review
3. Next steps

## Discussion Points

### Project Updates
- Feature X is 80% complete
- Bug fixes deployed to staging

### Budget Review
- Under budget for Q1
- Need to allocate resources for Q2

## Action Items

- [ ] @John: Complete feature X by Friday
- [ ] @Jane: Review documentation
- [ ] @Team: Prepare demo for next week
`,
    folder: 'Work',
    tags: ['meeting', 'work'],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
  },
];

const defaultFolders: Folder[] = [
  { id: 'all', name: 'All Notes', parentId: null },
  { id: 'general', name: 'General', parentId: null },
  { id: 'ideas', name: 'Ideas', parentId: null },
  { id: 'work', name: 'Work', parentId: null },
];

interface NoteStore {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  activeFolderId: string;
  searchQuery: string;
  lastSaved: number | null;
  previewMode: 'edit' | 'preview' | 'live' | 'rich';

  setActiveNote: (id: string | null) => void;
  setActiveFolder: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setPreviewMode: (mode: 'edit' | 'preview' | 'live' | 'rich') => void;
  updateNoteContent: (id: string, content: string) => void;
  createNote: (folder?: string) => void;
  deleteNote: (id: string) => void;
  getActiveNote: () => Note | undefined;
  getFilteredNotes: () => Note[];
  exportNote: (id: string) => void;
  exportAllNotes: () => void;
  exportFolder: (folderId: string) => Promise<void>;
  exportAllFolders: () => Promise<void>;
  importNotes: (files: FileList) => void;

  // Folder management
  createFolder: (name: string) => void;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderName: string) => void;
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: defaultNotes,
      folders: defaultFolders,
      activeNoteId: '1',
      activeFolderId: 'all',
      searchQuery: '',
      lastSaved: null,
      previewMode: 'edit',

      setActiveNote: (id) => set({ activeNoteId: id }),

      setActiveFolder: (id) => set({ activeFolderId: id, activeNoteId: null }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setPreviewMode: (mode) => set({ previewMode: mode }),

      updateNoteContent: (id, content) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  content,
                  title: extractTitle(content) || note.title,
                  updatedAt: Date.now(),
                }
              : note
          ),
          lastSaved: Date.now(),
        })),

      createNote: (folder = 'General') => {
        const newNote: Note = {
          id: Date.now().toString(),
          title: 'Untitled',
          content: '# Untitled\n\nStart writing here...',
          folder,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }));
      },

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        })),

      getActiveNote: () => {
        const state = get();
        return state.notes.find((note) => note.id === state.activeNoteId);
      },

      getFilteredNotes: () => {
        const state = get();
        let filtered = state.notes;

        // Filter by folder
        if (state.activeFolderId !== 'all') {
          const folderName = state.folders.find((f) => f.id === state.activeFolderId)?.name;
          if (folderName) {
            filtered = filtered.filter((note) => note.folder === folderName);
          }
        }

        // Filter by search query
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (note) =>
              note.title.toLowerCase().includes(query) ||
              note.content.toLowerCase().includes(query) ||
              note.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      },

      // Export single note as .md file
      exportNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        if (!note) return;

        const blob = new Blob([note.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      // Export all notes as a JSON file
      exportAllNotes: () => {
        const notes = get().notes;
        const exportData = {
          exportDate: new Date().toISOString(),
          notes: notes,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noteflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      // Export all notes in a folder as a ZIP file with individual .md files
      exportFolder: async (folderId: string) => {
        const state = get();
        let folderName: string;
        let notesToExport: Note[];

        if (folderId === 'all') {
          folderName = 'AllNotes';
          notesToExport = state.notes;
        } else {
          const folder = state.folders.find(f => f.id === folderId);
          if (!folder) return;
          folderName = folder.name;
          notesToExport = state.notes.filter(note => note.folder === folder.name);
        }

        if (notesToExport.length === 0) {
          alert('No notes to export in this folder');
          return;
        }

        const zip = new JSZip();

        notesToExport.forEach(note => {
          const fileName = `${note.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
          zip.file(fileName, note.content);
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      // Export all folders as a ZIP file with each folder as a subdirectory
      exportAllFolders: async () => {
        const state = get();

        if (state.notes.length === 0) {
          alert('No notes to export');
          return;
        }

        const zip = new JSZip();

        // Get unique folder names from notes (exclude 'All Notes' virtual folder)
        const folderNames = new Set(state.notes.map(note => note.folder));

        folderNames.forEach(folderName => {
          // Sanitize folder name for file system
          const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
          const folderNotes = state.notes.filter(note => note.folder === folderName);

          folderNotes.forEach(note => {
            const fileName = `${note.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
            zip.file(`${sanitizedFolderName}/${fileName}`, note.content);
          });
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NoteFlow-AllFolders-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      // Import notes from files
      importNotes: async (files: FileList) => {
        const newNotes: Note[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const content = await file.text();

          if (file.name.endsWith('.json')) {
            try {
              const data = JSON.parse(content);
              if (data.notes && Array.isArray(data.notes)) {
                newNotes.push(...data.notes);
              }
            } catch {
              console.error('Failed to parse JSON file');
            }
          } else if (file.name.endsWith('.md')) {
            const title = extractTitle(content) || file.name.replace('.md', '');
            newNotes.push({
              id: Date.now().toString() + i,
              title,
              content,
              folder: 'General',
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }

        if (newNotes.length > 0) {
          set((state) => ({
            notes: [...newNotes, ...state.notes],
          }));
        }
      },

      // Create a new folder
      createFolder: (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        // Check if folder already exists
        const exists = get().folders.some(
          f => f.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) return;

        const newFolder: Folder = {
          id: Date.now().toString(),
          name: trimmedName,
          parentId: null,
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
      },

      // Rename a folder
      renameFolder: (id: string, newName: string) => {
        const trimmedName = newName.trim();
        if (!trimmedName || id === 'all') return;

        const oldFolder = get().folders.find(f => f.id === id);
        if (!oldFolder) return;

        // Check if new name already exists
        const exists = get().folders.some(
          f => f.id !== id && f.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) return;

        set((state) => ({
          folders: state.folders.map(f =>
            f.id === id ? { ...f, name: trimmedName } : f
          ),
          // Update all notes in this folder
          notes: state.notes.map(note =>
            note.folder === oldFolder.name
              ? { ...note, folder: trimmedName, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      // Delete a folder and optionally move notes
      deleteFolder: (id: string) => {
        if (id === 'all') return;

        const folder = get().folders.find(f => f.id === id);
        if (!folder) return;

        // Move notes in this folder to General
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          notes: state.notes.map(note =>
            note.folder === folder.name
              ? { ...note, folder: 'General', updatedAt: Date.now() }
              : note
          ),
          activeFolderId: state.activeFolderId === id ? 'all' : state.activeFolderId,
        }));
      },

      // Move a note to a different folder
      moveNoteToFolder: (noteId: string, folderName: string) => {
        set((state) => ({
          notes: state.notes.map(note =>
            note.id === noteId
              ? { ...note, folder: folderName, updatedAt: Date.now() }
              : note
          ),
        }));
      },
    }),
    {
      name: 'noteflow-storage',
      partialize: (state) => ({
        notes: state.notes,
        folders: state.folders,
        previewMode: state.previewMode,
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as {
          notes?: Note[];
          folders?: Folder[];
          previewMode?: 'edit' | 'preview' | 'live' | 'rich';
        } | undefined;

        // Validate previewMode, fallback to 'edit' if invalid
        const validModes = ['edit', 'preview', 'live', 'rich'];
        const previewMode = persisted?.previewMode && validModes.includes(persisted.previewMode)
          ? persisted.previewMode
          : currentState.previewMode || 'edit';

        return {
          ...currentState,
          notes: persisted?.notes ?? currentState.notes,
          folders: persisted?.folders ?? currentState.folders,
          previewMode,
        };
      },
    }
  )
);

// Helper function to extract title from markdown content
function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : null;
}
