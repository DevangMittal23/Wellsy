"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/stores/notification-store";
import type { Notification } from "@/types/notification";

/**
 * Global hook that listens for new notifications via Supabase Realtime.
 * Updates the notification store's unread count.
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const { addNotification, incrementUnread } = useNotificationStore();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;

          // Fetch actor profile
          if (newNotification.actor_id) {
            const { data: actor } = await supabase
              .from("profiles")
              .select("id, username, display_name, avatar_url, is_online")
              .eq("id", newNotification.actor_id)
              .single();

            newNotification.actor = actor || undefined;
          }

          addNotification(newNotification);
          incrementUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification, incrementUnread]);
}
