import { Folder, FileText, Edit3, List, Settings } from 'lucide-react';
import { useMobileUIStore } from '../../stores/mobileUIStore';

interface NavItem {
  id: 'folder' | 'notes' | 'edit' | 'outline' | 'settings';
  icon: React.ReactNode;
  label: string;
  panel?: 'folder' | 'notes' | 'outline' | 'settings';
}

const navItems: NavItem[] = [
  { id: 'folder', icon: <Folder className="w-6 h-6" />, label: 'Folders', panel: 'folder' },
  { id: 'notes', icon: <FileText className="w-6 h-6" />, label: 'Notes', panel: 'notes' },
  { id: 'edit', icon: <Edit3 className="w-6 h-6" />, label: 'Edit' },
  { id: 'outline', icon: <List className="w-6 h-6" />, label: 'Outline', panel: 'outline' },
  { id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'Settings', panel: 'settings' },
];

/**
 * Bottom navigation bar for mobile devices
 * Following Material Design 3 navigation bar guidelines
 */
export default function MobileNav() {
  const { activeNav, activePanel, openPanel, closePanel, setActiveNav } = useMobileUIStore();

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'edit') {
      // Close all panels and return to editor
      closePanel();
      setActiveNav('edit');
    } else if (item.panel) {
      // Toggle panel
      if (activePanel === item.panel) {
        closePanel();
        setActiveNav('edit');
      } else {
        openPanel(item.panel);
      }
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeNav === item.id || activePanel === item.panel;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-1 transition-colors touch-manipulation ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-primary-100 dark:bg-primary-900/30' : ''
              }`}>
                {item.icon}
              </div>
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
