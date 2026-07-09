import { create } from "zustand";
import type { ActiveCall, IncomingCall } from "@/types";

interface CallState {
  activeCall: ActiveCall | null;
  incomingCall: IncomingCall | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  setActiveCall: (call: ActiveCall | null) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  endCall: () => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  incomingCall: null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,

  setActiveCall: (activeCall) => set({ activeCall }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
  toggleScreenShare: () =>
    set((state) => ({ isScreenSharing: !state.isScreenSharing })),
  endCall: () =>
    set({
      activeCall: null,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
    }),
  reset: () =>
    set({
      activeCall: null,
      incomingCall: null,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
    }),
}));
