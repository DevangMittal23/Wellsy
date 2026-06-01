"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";
import { useAuth } from "@/hooks/use-auth";
import { getRoomMessages, sendMessage as apiSendMessage } from "@/actions/chat-actions";
import type { Message } from "@/types/chat";

export function useChat(roomId: string, userId: string | undefined) {
  const { user: currentUser } = useAuth();
  const {
    messages,
    setMessages,
    prependMessages,
    addMessage,
    isLoading,
    setLoading,
    hasMore,
    setHasMore,
    setActiveRoom,
    markRoomRead,
  } = useChatStore();

  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>(messages);

  // Sync messages ref to avoid stale closure in real-time callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await getRoomMessages(roomId);
      if (res && res.messages) {
        setMessages(res.messages);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, setMessages, setLoading, setHasMore]);

  // Load older messages for reverse infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || messages.length === 0) return;
    setLoading(true);
    try {
      const oldestMessage = messages[0];
      const res = await getRoomMessages(roomId, oldestMessage.created_at);
      if (res && res.messages && res.messages.length > 0) {
        prependMessages(res.messages);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading older messages:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, isLoading, hasMore, messages, prependMessages, setLoading, setHasMore]);

  // Handle real-time messaging and typing indicators broadcast
  useEffect(() => {
    if (!roomId || !userId) return;

    // Immediately set active room and mark it read on mount
    setActiveRoom(roomId);
    markRoomRead(roomId);

    // Clear previous messages to avoid flash of stale content
    setMessages([]);
    fetchMessages();

    const supabase = createClient();

    // Set up unified Supabase Channel for messages and typing broadcasts
    const channel = supabase
      .channel(`room-chat-stream-${roomId}`)
      // 1. Listen for new insert database changes
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
          // Avoid duplicate inserts
          if (messagesRef.current.some((m) => m.id === newMessage.id)) return;

          // Check if this is a real-time echo of our own optimistic message
          const currentMsgs = useChatStore.getState().messages;
          const optimisticMatch = currentMsgs.find(
            (m) =>
              m.sender_id === newMessage.sender_id &&
              m.content === newMessage.content &&
              m.id.startsWith("temp-")
          );

          if (optimisticMatch) {
            // Reconcile and replace the optimistic message's ID with the database UUID
            setMessages(
              currentMsgs.map((m) =>
                m.id === optimisticMatch.id
                  ? { ...newMessage, profiles: currentUser || undefined }
                  : m
              )
            );
            return;
          }

          // Fetch sender profile details
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
      // 2. Listen to custom realtime broadcasts for typing indicators
      .on("broadcast", { event: "typing" }, (payload) => {
        const { senderId, isTyping: userIsTyping, username } = payload.payload;
        if (senderId === userId) return;

        setTypingUsers((prev) => {
          if (userIsTyping) {
            return prev.includes(username) ? prev : [...prev, username];
          } else {
            return prev.filter((u) => u !== username);
          }
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      // Reset active room on unmount
      setActiveRoom(null);
    };
  }, [roomId, userId, addMessage, fetchMessages, setActiveRoom, markRoomRead]);

  // Send message action
  const sendMessage = async (content: string) => {
    if (!content.trim()) return { error: "Message cannot be empty" };

    const formData = new FormData();
    formData.append("content", content);

    // Stop typing indicator on message send
    sendTypingIndicator(false);

    // Create optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: any = {
      id: optimisticId,
      room_id: roomId,
      sender_id: userId || "",
      content,
      message_type: "text",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_read: false,
      profiles: currentUser || undefined,
      isOptimistic: true,
    };

    // Add to UI immediately
    addMessage(optimisticMessage);

    try {
      const res = await apiSendMessage(roomId, formData);
      if (res?.error) {
        // Remove optimistic message on error
        const currentMsgs = useChatStore.getState().messages;
        setMessages(currentMsgs.filter((m) => m.id !== optimisticId));
        return { error: res.error };
      }
      if (res?.message) {
        // Replace the optimistic message with the actual message from database
        const currentMsgs = useChatStore.getState().messages;
        setMessages(
          currentMsgs.map((m) =>
            m.id === optimisticId ? res.message : m
          )
        );
      }
      return { success: true };
    } catch (err) {
      console.error("Error sending message:", err);
      const currentMsgs = useChatStore.getState().messages;
      setMessages(currentMsgs.filter((m) => m.id !== optimisticId));
      return { error: "Failed to send message" };
    }
  };

  // Broadcast typing indicator status
  const sendTypingIndicator = (typing: boolean) => {
    if (!channelRef.current || !userId) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        senderId: userId,
        isTyping: typing,
        username: currentUser?.display_name || currentUser?.username || userId.substring(0, 8),
      },
    });
  };

  // Throttle typing activity trigger
  const handleTypingActivity = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  return {
    messages,
    isLoading,
    hasMore,
    typingUsers,
    loadMore,
    sendMessage,
    handleTypingActivity,
  };
}
