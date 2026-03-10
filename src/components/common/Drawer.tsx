import { createPortal } from 'react-dom';
import { useEffect, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'bottom';
  children: ReactNode;
  title?: string;
  width?: string;
  showCloseButton?: boolean;
}

/**
 * Reusable drawer component for mobile panels
 * Supports left, right, and bottom positions
 */
export default function Drawer({
  isOpen,
  onClose,
  position = 'left',
  children,
  title,
  width = '280px',
  showCloseButton = true,
}: DrawerProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Get position-based styles
  const getPositionStyles = () => {
    switch (position) {
      case 'left':
        return {
          drawer: 'left-0 top-0 bottom-0 h-full',
          transform: isOpen ? 'translate-x-0' : '-translate-x-full',
        };
      case 'right':
        return {
          drawer: 'right-0 top-0 bottom-0 h-full',
          transform: isOpen ? 'translate-x-0' : 'translate-x-full',
        };
      case 'bottom':
        return {
          drawer: 'left-0 right-0 bottom-0',
          transform: isOpen ? 'translate-y-0' : 'translate-y-full',
        };
    }
  };

  const styles = getPositionStyles();

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed ${styles.drawer} bg-white dark:bg-gray-800 z-50 transform ${styles.transform} transition-transform duration-300 ease-out flex flex-col shadow-xl max-w-[85vw]`}
        style={position === 'left' || position === 'right' ? { width } : {}}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer panel'}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );

  // Render in portal to avoid z-index issues
  return createPortal(drawerContent, document.body);
}
