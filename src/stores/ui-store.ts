import { create } from "zustand";
import type { ModalType } from "@/types";

interface UIState {
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  isSidebarOpen: boolean;
  isMobileNavVisible: boolean;
  theme: string;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavVisible: (visible: boolean) => void;
  setTheme: (theme: string) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: {},
  isSidebarOpen: true,
  isMobileNavVisible: true,
  theme: "sleek",

  openModal: (modal, data = {}) =>
    set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setMobileNavVisible: (isMobileNavVisible) => set({ isMobileNavVisible }),
  setTheme: (theme) => set({ theme }),
  reset: () =>
    set({
      activeModal: null,
      modalData: {},
      isSidebarOpen: true,
      isMobileNavVisible: true,
    }),
}));
