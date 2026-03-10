import { Plus } from 'lucide-react';
import { useNoteStore } from '../../store/noteStore';
import { useMobileUIStore } from '../../stores/mobileUIStore';

/**
 * Floating Action Button for quick note creation
 * Material Design 3 style FAB
 */
export default function FloatingActionButton() {
  const { isFabVisible, isPanelOpen } = useMobileUIStore();
  const createNote = useNoteStore((state) => state.createNote);

  const handleCreateNote = async () => {
    try {
      createNote('General');
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // Hide when panel is open or fab is hidden
  if (isPanelOpen || !isFabVisible) {
    return null;
  }

  return (
    <button
      onClick={handleCreateNote}
      className="fixed right-4 z-20 w-14 h-14 rounded-full bg-primary-600 dark:bg-primary-500 text-white shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 active:scale-95 transition-all duration-200 flex items-center justify-center safe-area-bottom-nav"
      style={{
        bottom: 'calc(3.5rem + 1rem + env(safe-area-inset-bottom))', // Above bottom nav
      }}
      aria-label="Create new note"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
