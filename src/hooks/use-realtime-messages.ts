"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types/chat";

export function useRealtimeMessages(roomId: string) {
  const { addMessage } = useChatStore();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`room-messages-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single();

          addMessage({
            ...newMessage,
            profiles: profile || undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, addMessage]);
}
