import {
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
  MoreHorizontal,
  Edit2,
  Trash2,
  FolderPlus,
  Download,
  FolderDown,
} from 'lucide-react';
import { useNoteStore } from '../../store/noteStore';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from '../../utils/date';

export default function Sidebar() {
  const {
    folders,
    activeFolderId,
    setActiveFolder,
    createNote,
    notes,
    createFolder,
    renameFolder,
    deleteFolder,
    moveNoteToFolder,
    activeNoteId,
    setActiveNote,
    getActiveNote,
    exportFolder,
    exportAllFolders,
  } = useNoteStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['all']));
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveMenu, setShowMoveMenu] = useState<string | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const activeNote = getActiveNote();

  useEffect(() => {
    if (editingFolderId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFolderId]);

  useEffect(() => {
    if (showNewFolderInput && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolderInput]);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const getNoteCount = (folderId: string) => {
    if (folderId === 'all') return notes.length;
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      return notes.filter(n => n.folder === folder.name).length;
    }
    return 0;
  };

  const getNotesInFolder = (folderId: string): typeof notes => {
    if (folderId === 'all') return notes;
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      return notes.filter(n => n.folder === folder.name);
    }
    return [];
  };

  const handleCreateNote = () => {
    const folder = activeFolderId === 'all' ? 'General' :
      folders.find(f => f.id === activeFolderId)?.name || 'General';
    createNote(folder);
  };

  const handleStartEditFolder = (id: string, name: string) => {
    setEditingFolderId(id);
    setEditingFolderName(name);
    setShowFolderMenu(null);
  };

  const handleSaveFolderName = () => {
    if (editingFolderId && editingFolderName.trim()) {
      renameFolder(editingFolderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm('Delete this folder? Notes will be moved to General.')) {
      deleteFolder(id);
    }
    setShowFolderMenu(null);
  };

  const handleMoveNote = (noteId: string, folderName: string) => {
    moveNoteToFolder(noteId, folderName);
    setShowMoveMenu(null);
  };

  const handleExportFolder = async (folderId: string) => {
    setShowFolderMenu(null);
    await exportFolder(folderId);
  };

  // Get folders excluding 'All Notes' for move menu
  const movableFolders = folders.filter(f => f.id !== 'all');

  return (
    <aside className="w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
          NoteFlow
        </span>
      </div>

      {/* New Note Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={handleCreateNote}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Folders
          </span>
          <button
            type="button"
            onClick={() => setShowNewFolderInput(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* New Folder Input */}
        {showNewFolderInput && (
          <div className="px-2 py-1 mb-1">
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }
              }}
              onBlur={() => {
                if (!newFolderName.trim()) {
                  setShowNewFolderInput(false);
                }
              }}
              placeholder="Folder name..."
              className="w-full px-2 py-1 text-sm border border-primary-500 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        )}

        <nav className="space-y-1">
          {folders.map((folder) => {
            const isEditing = editingFolderId === folder.id;
            const isAllNotes = folder.id === 'all';
            const folderNotes = getNotesInFolder(folder.id);
            const isExpanded = expandedFolders.has(folder.id);

            return (
              <div key={folder.id} className="relative group">
                {isEditing ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveFolderName();
                        if (e.key === 'Escape') {
                          setEditingFolderId(null);
                        }
                      }}
                      onBlur={handleSaveFolderName}
                      className="flex-1 px-2 py-0.5 text-sm border border-primary-500 rounded focus:outline-none dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFolder(folder.id);
                        toggleFolder(folder.id);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeFolderId === folder.id
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {isExpanded && folderNotes.length > 0 ? (
                        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                      )}
                      <FolderOpen size={18} className="flex-shrink-0" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {getNoteCount(folder.id)}
                      </span>

                      {/* Folder menu button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFolderMenu(showFolderMenu === folder.id ? null : folder.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </button>

                    {/* Notes under folder when expanded */}
                    {isExpanded && folderNotes.length > 0 && (
                      <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 mt-1 mb-1">
                        {folderNotes.map((note) => (
                          <button
                            type="button"
                            key={note.id}
                            onClick={() => {
                              setActiveFolder(folder.id);
                              setActiveNote(note.id);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors text-sm ${
                              activeNoteId === note.id
                                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <FileText size={14} className="flex-shrink-0" />
                            <span className="truncate flex-1">{note.title}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                              {formatDistanceToNow(note.updatedAt)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Folder context menu */}
                {showFolderMenu === folder.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFolderMenu(null)}
                    />
                    <div className="absolute right-2 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                      <button
                        type="button"
                        onClick={() => handleExportFolder(folder.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Download size={14} />
                        Export
                      </button>
                      {!isAllNotes && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditFolder(folder.id, folder.name)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit2 size={14} />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Move note menu */}
      {activeNote && showMoveMenu === activeNoteId && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMoveMenu(null)}
          />
          <div className="absolute left-64 bottom-20 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Move to...
            </div>
            {movableFolders.map(folder => (
              <button
                type="button"
                key={folder.id}
                onClick={() => activeNoteId && handleMoveNote(activeNoteId, folder.name)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeNote.folder === folder.name ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <FolderOpen size={14} />
                {folder.name}
                {activeNote.folder === folder.name && (
                  <span className="ml-auto text-xs text-primary-500">current</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FileText size={16} />
            <span>{notes.length} notes</span>
          </div>
          {activeNote && (
            <button
              type="button"
              onClick={() => setShowMoveMenu(showMoveMenu === activeNoteId ? null : activeNoteId)}
              className="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Move note
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportAllFolders()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Export all folders"
        >
          <FolderDown size={16} />
          <span>Export All Folders</span>
        </button>
      </div>
    </aside>
  );
}
