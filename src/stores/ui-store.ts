import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isCreatePostOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCreatePostOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isCreatePostOpen: false,
  activeModal: null,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setCreatePostOpen: (open) => set({ isCreatePostOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}));
