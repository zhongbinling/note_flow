import { create } from 'zustand';

export type MobilePanel = 'folder' | 'notes' | 'outline' | 'settings' | null;

interface MobileUIState {
  // Panel state
  activePanel: MobilePanel;
  isPanelOpen: boolean;

  // Panel actions
  openPanel: (panel: Exclude<MobilePanel, null>) => void;
  closePanel: () => void;
  togglePanel: (panel: Exclude<MobilePanel, null>) => void;

  // FAB state
  isFabVisible: boolean;
  setFabVisible: (visible: boolean) => void;

  // Search state
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  // Active nav item (for highlighting)
  activeNav: 'folder' | 'notes' | 'edit' | 'outline' | 'settings';
  setActiveNav: (nav: MobileUIState['activeNav']) => void;

  // Dev mode: Force mobile/desktop layout (for testing)
  forceMode: 'auto' | 'mobile' | 'desktop';
  setForceMode: (mode: 'auto' | 'mobile' | 'desktop') => void;
}

export const useMobileUIStore = create<MobileUIState>((set, get) => ({
  // Panel state
  activePanel: null,
  isPanelOpen: false,

  // Panel actions
  openPanel: (panel) => {
    set({
      activePanel: panel,
      isPanelOpen: true,
      activeNav: panel === 'settings' ? 'settings' : panel,
    });
  },

  closePanel: () => {
    set({
      isPanelOpen: false,
    });
    // Delay clearing activePanel for animation
    setTimeout(() => {
      if (!get().isPanelOpen) {
        set({ activePanel: null });
      }
    }, 300);
  },

  togglePanel: (panel) => {
    const { activePanel, isPanelOpen } = get();
    if (isPanelOpen && activePanel === panel) {
      get().closePanel();
    } else {
      get().openPanel(panel);
    }
  },

  // FAB state
  isFabVisible: true,
  setFabVisible: (visible) => set({ isFabVisible: visible }),

  // Search state
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  // Active nav
  activeNav: 'edit',
  setActiveNav: (nav) => set({ activeNav: nav }),

  // Dev mode: Force mobile/desktop layout
  forceMode: 'auto',
  setForceMode: (mode) => set({ forceMode: mode }),
}));
