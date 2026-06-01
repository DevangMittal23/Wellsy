"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/stores/notification-store";
import {
  getNotifications,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
} from "@/actions/notification-actions";
import type { Notification } from "@/types/notification";

export function useNotifications(userId: string | undefined) {
  const {
    notifications,
    setNotifications,
    appendNotifications,
    addNotification,
    unreadCount,
    setUnreadCount,
    incrementUnread,
    markRead,
    markAllRead,
    isLoading,
    setLoading,
    hasMore,
    setHasMore,
  } = useNotificationStore();

  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications as any[]);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, setNotifications, setLoading, setHasMore]);

  // Load older notifications (pagination)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || notifications.length === 0) return;
    setLoading(true);
    try {
      const oldestNotif = notifications[notifications.length - 1];
      const res = await getNotifications(oldestNotif.created_at);
      if (res && res.notifications && res.notifications.length > 0) {
        appendNotifications(res.notifications as any[]);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading older notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [isLoading, hasMore, notifications, appendNotifications, setLoading, setHasMore]);

  // Real-time listener for in-app toasts
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const supabase = createClient();

    const channel = supabase
      .channel(`user-realtime-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotif = payload.new as Notification;

          // Fetch actor details
          if (newNotif.actor_id) {
            const { data: actor } = await supabase
              .from("profiles")
              .select("id, username, display_name, avatar_url, is_online")
              .eq("id", newNotif.actor_id)
              .single();
            newNotif.actor = actor || undefined;
          }

          // Prepend to list & increment count
          addNotification(newNotif);
          incrementUnread();

          // Set active toast for visual popup
          setActiveToast(newNotif);

          // Clear toast after 4 seconds
          setTimeout(() => {
            setActiveToast((prev) => (prev?.id === newNotif.id ? null : prev));
          }, 4000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification, incrementUnread, fetchNotifications]);

  // Mark a single notification read
  const handleMarkRead = async (notificationId: string) => {
    markRead(notificationId);
    await apiMarkRead(notificationId);
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    markAllRead();
    await apiMarkAllRead();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    activeToast,
    loadMore,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
    clearToast: () => setActiveToast(null),
    refresh: fetchNotifications,
  };
}
