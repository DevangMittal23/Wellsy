import { create } from "zustand";
import type { Message } from "@/types/chat";

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  last_message_at: string;
  other_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_online: boolean;
  } | null;
  last_message?: {
    id: string;
    content: string | null;
    message_type: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count?: number;
}

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  totalUnread: number;
  setRooms: (rooms: ChatRoom[]) => void;
  setActiveRoom: (roomId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  prependMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setTotalUnread: (count: number) => void;
  updateRoomPreview: (roomId: string, message: Message) => void;
  markRoomRead: (roomId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messages: [],
  isLoading: false,
  hasMore: true,
  totalUnread: 0,
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
  setMessages: (messages) => set({ messages }),
  prependMessages: (older) =>
    set((state) => ({ messages: [...older, ...state.messages] })),
  addMessage: (message) =>
    set((state) => {
      // Deduplicate
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setTotalUnread: (totalUnread) => set({ totalUnread }),
  updateRoomPreview: (roomId, message) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              last_message: {
                id: message.id,
                content: message.content,
                message_type: message.message_type,
                created_at: message.created_at,
                sender_id: message.sender_id,
              },
              last_message_at: message.created_at,
              unread_count:
                state.activeRoomId === roomId
                  ? 0
                  : (r.unread_count || 0) + 1,
            }
          : r
      ),
    })),
  markRoomRead: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, unread_count: 0 } : r
      ),
    })),
  reset: () =>
    set({
      rooms: [],
      activeRoomId: null,
      messages: [],
      isLoading: false,
      hasMore: true,
    }),
}));
