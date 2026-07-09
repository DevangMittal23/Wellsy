"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";
import { getConversations } from "@/actions/conversations";

export function useConversations() {
  const supabase = createClient();
  const { conversations, totalUnread, setConversations } = useChatStore();

  useEffect(() => {
    const load = async () => {
      const result = await getConversations();
      setConversations(result);
    };

    load();

    // Subscribe to conversation updates (new messages changing last_message_at)
    const channel = supabase
      .channel(`conversations-updates-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          // Reload conversations when any conversation is updated
          load();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
        },
        () => {
          // Reload when added to a new conversation
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, setConversations]);

  return { conversations, totalUnread };
}
