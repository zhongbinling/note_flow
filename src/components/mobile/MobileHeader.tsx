import { useState } from 'react';
import { Search, Eye, Edit3, Columns, MoreVertical, Moon, Sun, LogOut, RefreshCw } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useNoteStore } from '../../store/noteStore';
import { useMobileUIStore } from '../../stores/mobileUIStore';

type EditorMode = 'edit' | 'preview' | 'split';

/**
 * Simplified header for mobile devices
 */
export default function MobileHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const getActiveNote = useNoteStore((state) => state.getActiveNote);
  const isSyncing = useNoteStore((state) => state.isSyncing);
  const { openSearch } = useMobileUIStore();

  const activeNote = getActiveNote();

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
  };

  const cycleEditorMode = () => {
    const modes: EditorMode[] = ['edit', 'preview', 'split'];
    const currentIndex = modes.indexOf(editorMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setEditorMode(modes[nextIndex]);
  };

  const getEditorModeIcon = () => {
    switch (editorMode) {
      case 'edit':
        return <Edit3 className="w-5 h-5" />;
      case 'preview':
        return <Eye className="w-5 h-5" />;
      case 'split':
        return <Columns className="w-5 h-5" />;
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-top">
      <div className="flex items-center justify-between h-12 px-2">
        {/* Left: Search */}
        <button
          onClick={openSearch}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Search notes"
        >
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Center: Note Title */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {activeNote?.title || 'NoteFlow'}
          </h1>
          {isSyncing && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing...
            </p>
          )}
        </div>

        {/* Right: Mode toggle + Menu */}
        <div className="flex items-center gap-1">
          {/* Editor mode toggle */}
          <button
            onClick={cycleEditorMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Editor mode: ${editorMode}`}
          >
            {getEditorModeIcon()}
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="More options"
              aria-expanded={showMenu}
            >
              <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                  {/* User info */}
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-4 h-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        Dark Mode
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
