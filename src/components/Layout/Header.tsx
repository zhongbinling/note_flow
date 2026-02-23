import { useState, useRef } from 'react';
import { Search, Sun, Moon, Download, Upload, Check, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';

export default function Header() {
  const { isDark, toggleTheme } = useThemeStore();
  const {
    searchQuery,
    setSearchQuery,
    getActiveNote,
    activeNoteId,
    lastSaved,
    exportNote,
    exportAllNotes,
    importNotes,
  } = useNoteStore();
  const activeNote = getActiveNote();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const diff = Date.now() - lastSaved;
    if (diff < 60000) return 'Saved just now';
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`;
    return `Saved ${Math.floor(diff / 3600000)}h ago`;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importNotes(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* Note Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        {activeNote && (
          <>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activeNote.folder}
            </span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {activeNote.title}
            </span>
            {/* Save indicator */}
            {lastSaved && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check size={12} />
                {formatLastSaved()}
              </span>
            )}
          </>
        )}
        {!activeNote && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Select a note to start
          </span>
        )}
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Import Button */}
        <button
          onClick={handleImportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Import notes"
        >
          <Upload size={16} />
          <span className="hidden sm:inline">Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.json"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    if (activeNoteId) {
                      exportNote(activeNoteId);
                    }
                    setShowExportMenu(false);
                  }}
                  disabled={!activeNoteId}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export current note (.md)
                </button>
                <button
                  onClick={() => {
                    exportAllNotes();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export all notes (.json)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
