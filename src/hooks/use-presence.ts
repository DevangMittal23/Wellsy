"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { CHANNEL_PREFIX, ONLINE_THRESHOLD_MINUTES } from "@/lib/constants";

let globalChannel: any = null;
let subscribersCount = 0;
const listeners = new Set<(online: Set<string>) => void>();
let onlineUsersCached = new Set<string>();

export function usePresence() {
  const supabase = createClient();
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(onlineUsersCached);

  useEffect(() => {
    if (!user) return;

    const listener = (online: Set<string>) => {
      setOnlineUsers(online);
    };
    listeners.add(listener);

    if (subscribersCount === 0) {
      const channel = supabase.channel(CHANNEL_PREFIX.PRESENCE);
      globalChannel = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const online = new Set<string>();
          Object.values(state).forEach((presences: any) => {
            presences.forEach((p: Record<string, string>) => {
              if (p.user_id) online.add(p.user_id);
            });
          });
          onlineUsersCached = online;
          listeners.forEach((l) => l(online));
        })
        .subscribe(async (status: any) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    } else {
      // Immediately notify new subscriber of current online users
      listener(onlineUsersCached);
    }

    subscribersCount++;

    return () => {
      listeners.delete(listener);
      subscribersCount--;

      if (subscribersCount === 0 && globalChannel) {
        supabase.removeChannel(globalChannel);
        globalChannel = null;
        onlineUsersCached = new Set();
      }
    };
  }, [supabase, user]);

  const isOnline = (userId: string): boolean => onlineUsers.has(userId);

  return { onlineUsers, isOnline };
}
