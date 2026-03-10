import { useMobileUIStore } from '../../stores/mobileUIStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../store/themeStore';
import MobileNav from './MobileNav';
import MobileHeader from './MobileHeader';
import FloatingActionButton from './FloatingActionButton';
import Drawer from '../common/Drawer';
import Sidebar from '../Layout/Sidebar';
import NoteList from '../NoteList';
import Outline from '../Editor/Outline';
import { LogOut, User } from 'lucide-react';
import type { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
}

/**
 * Mobile-optimized layout with bottom navigation and drawer panels
 * Only rendered on mobile viewports (< 640px)
 */
export default function MobileLayout({ children }: MobileLayoutProps) {
  const { activePanel, isPanelOpen, closePanel } = useMobileUIStore();
  const { logout, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content - Editor */}
      <main className="flex-1 overflow-hidden pb-14">
        {children}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Bottom Navigation */}
      <MobileNav />

      {/* Folder Drawer (Left) */}
      <Drawer
        isOpen={isPanelOpen && activePanel === 'folder'}
        onClose={closePanel}
        position="left"
        title="Folders"
        width="280px"
      >
        <Sidebar />
      </Drawer>

      {/* Notes Drawer (Left) */}
      <Drawer
        isOpen={isPanelOpen && activePanel === 'notes'}
        onClose={closePanel}
        position="left"
        title="Notes"
        width="300px"
      >
        <NoteList />
      </Drawer>

      {/* Outline Drawer (Right) */}
      <Drawer
        isOpen={isPanelOpen && activePanel === 'outline'}
        onClose={closePanel}
        position="right"
        title="Outline"
        width="260px"
      >
        <Outline />
      </Drawer>

      {/* Settings Drawer (Bottom) */}
      <Drawer
        isOpen={isPanelOpen && activePanel === 'settings'}
        onClose={closePanel}
        position="bottom"
        title="Settings"
        showCloseButton={true}
      >
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Dark Mode
            </span>
            <div className={`w-11 h-6 rounded-full transition-colors ${
              isDark ? 'bg-primary-500' : 'bg-gray-300'
            }`}>
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                  isDark ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full p-3 text-left text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </span>
          </button>
        </div>
      </Drawer>
    </div>
  );
}
