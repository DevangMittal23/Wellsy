import { create } from "zustand";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (notificationId: string) => void;
  markAllRead: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id))
        return state;
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: notification.is_read
          ? state.unreadCount
          : state.unreadCount + 1,
      };
    }),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  markAsRead: (notificationId) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      const unreadCount = updated.filter((n) => !n.is_read).length;
      return { notifications: updated, unreadCount };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
      })),
      unreadCount: 0,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    }),
}));
