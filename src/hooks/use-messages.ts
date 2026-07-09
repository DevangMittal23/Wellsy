"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";
import { getMessages, sendMessage as sendMessageAction } from "@/actions/messages";
import type { Message } from "@/types";
import { CHANNEL_PREFIX } from "@/lib/constants";

export function useMessages(conversationId: string) {
  const supabase = createClient();
  const {
    messages,
    isLoading,
    hasMore,
    setMessages,
    prependMessages,
    addMessage,
    setLoading,
    setHasMore,
    updateConversationPreview,
  } = useChatStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      const result = await getMessages(conversationId);
      setMessages(result.messages);
      setHasMore(result.hasMore);
      setLoading(false);
    };

    loadMessages();
  }, [conversationId, setMessages, setLoading, setHasMore]);

  // Subscribe to real-time message inserts
  useEffect(() => {
    const channel = supabase
      .channel(`${CHANNEL_PREFIX.MESSAGES}:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const newMessage = payload.new as Message;
          // Fetch full message with sender info
          const { data } = await supabase
            .from("messages")
            .select("*, sender:users!messages_sender_id_fkey(*)")
            .eq("id", newMessage.id)
            .single();

          if (data) {
            addMessage(data as Message);
            updateConversationPreview(conversationId, data as Message);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const updated = payload.new as Message;
          useChatStore.getState().updateMessage(updated.id, updated);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, addMessage, updateConversationPreview]);

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setLoading(true);
    const result = await getMessages(conversationId, oldestMessage.created_at);
    prependMessages(result.messages);
    setHasMore(result.hasMore);
    setLoading(false);
  }, [conversationId, hasMore, isLoading, messages, prependMessages, setLoading, setHasMore]);

  // Send message
  const sendMessage = useCallback(
    async (data: {
      content?: string;
      type?: string;
      media_url?: string | null;
      media_metadata?: Record<string, unknown> | null;
      gif_url?: string | null;
      reply_to_id?: string | null;
    }) => {
      const res = await sendMessageAction(conversationId, data);
      if (res && res.message) {
        addMessage(res.message);
        updateConversationPreview(conversationId, res.message);
      }
      return res;
    },
    [conversationId, addMessage, updateConversationPreview]
  );

  return {
    messages,
    isLoading,
    hasMore,
    loadMore,
    sendMessage,
  };
}
