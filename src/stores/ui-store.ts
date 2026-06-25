import { create } from 'zustand';

export type PanelView = 'chat' | 'editor' | 'agent' | 'search' | 'terminal' | 'files' | 'settings';

interface UIStore {
  // Panel layout
  leftPanelView: PanelView;
  rightPanelView: PanelView;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  bottomPanelOpen: boolean;

  // Sidebar
  sidebarOpen: boolean;
  activeSection: string;

  // Command palette
  commandPaletteOpen: boolean;

  // Theme
  theme: 'dark' | 'light';

  // Notifications
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];

  // Actions
  setLeftPanelView: (view: PanelView) => void;
  setRightPanelView: (view: PanelView) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  toggleSidebar: () => void;
  setActiveSection: (section: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  leftPanelView: 'chat',
  rightPanelView: 'editor',
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  bottomPanelOpen: true,
  sidebarOpen: true,
  activeSection: 'chat',
  commandPaletteOpen: false,
  theme: 'dark',
  toasts: [],

  setLeftPanelView: (view) => set({ leftPanelView: view }),
  setRightPanelView: (view) => set({ rightPanelView: view }),
  toggleLeftPanel: () => set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => set({ theme }),

  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
