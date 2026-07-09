"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { CHANNEL_PREFIX, TYPING_DEBOUNCE_MS, TYPING_TIMEOUT_MS } from "@/lib/constants";

export function useTyping(conversationId: string) {
  const supabase = createClient();
  const { user } = useAuthStore();
  const [typingUsers, setTypingUsers] = useState<
    { user_id: string; display_name: string }[]
  >([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(
      `${CHANNEL_PREFIX.TYPING}:${conversationId}`
    );

    channel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { user_id, display_name, is_typing } = payload.payload;
        if (user_id === user.id) return;

        if (is_typing) {
          setTypingUsers((prev) => {
            if (prev.some((u) => u.user_id === user_id)) return prev;
            return [...prev, { user_id, display_name }];
          });

          // Clear previous timeout for this user
          const existingTimeout = timeoutsRef.current.get(user_id);
          if (existingTimeout) clearTimeout(existingTimeout);

          // Set new timeout to remove user
          const timeout = setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((u) => u.user_id !== user_id)
            );
            timeoutsRef.current.delete(user_id);
          }, TYPING_TIMEOUT_MS);

          timeoutsRef.current.set(user_id, timeout);
        } else {
          setTypingUsers((prev) =>
            prev.filter((u) => u.user_id !== user_id)
          );
          const existingTimeout = timeoutsRef.current.get(user_id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            timeoutsRef.current.delete(user_id);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, [conversationId, supabase, user]);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !user) return;

      // Debounce: don't spam typing events
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: user.id,
          display_name: user.display_name,
          is_typing: isTyping,
        },
      });

      if (isTyping) {
        typingTimerRef.current = setTimeout(() => {
          channelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: {
              user_id: user.id,
              display_name: user.display_name,
              is_typing: false,
            },
          });
        }, TYPING_TIMEOUT_MS);
      }
    },
    [user]
  );

  return { typingUsers, broadcastTyping };
}
