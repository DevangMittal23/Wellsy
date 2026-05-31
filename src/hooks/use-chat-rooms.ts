"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";
import type { Message } from "@/types/chat";

/**
 * Global hook that listens for new messages across all rooms
 * to update room previews and unread counts.
 */
export function useChatRooms(userId: string | undefined) {
  const { updateRoomPreview, activeRoomId } = useChatStore();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("global-chat-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Only process if not sent by current user
          if (newMessage.sender_id === userId) return;

          // Update room preview
          updateRoomPreview(newMessage.room_id, newMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, updateRoomPreview, activeRoomId]);
}
