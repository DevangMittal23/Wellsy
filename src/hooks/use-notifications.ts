"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/stores/notification-store";
import { getNotifications, getUnreadCount } from "@/actions/notifications";
import type { Notification } from "@/types";

export function useNotifications() {
  const supabase = createClient();
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    addNotification,
    setUnreadCount,
    setLoading,
  } = useNotificationStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [notifResult, count] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifResult.notifications);
      setUnreadCount(count);
      setLoading(false);
    };

    load();

    // Subscribe to new notifications in real-time with a unique channel name
    const channel = supabase
      .channel(`notifications-realtime-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async (payload: any) => {
          const newNotification = payload.new as Notification;
          // Fetch full notification with actor info
          const { data } = await supabase
            .from("notifications")
            .select("*, actor:users!notifications_actor_id_fkey(*)")
            .eq("id", newNotification.id)
            .single();

          if (data) {
            addNotification(data as Notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setNotifications, addNotification, setUnreadCount, setLoading]);

  return { notifications, unreadCount, isLoading };
}
