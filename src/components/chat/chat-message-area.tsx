"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { markRoomAsRead } from "@/actions/chat-actions";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { getInitials } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface ChatMessageAreaProps {
  roomId: string;
  initialMessages: Message[];
  roomInfo: {
    id: string;
    other_user?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      is_online: boolean;
    } | null;
    current_user_id: string;
  };
}

export function ChatMessageArea({
  roomId,
  initialMessages,
  roomInfo,
}: ChatMessageAreaProps) {
  const { messages, setMessages, setActiveRoom } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherUser = roomInfo.other_user;

  // Subscribe to realtime messages
  useRealtimeMessages(roomId);

  // Initialize messages from server
  useEffect(() => {
    setMessages(initialMessages);
    setActiveRoom(roomId);

    // Mark as read on mount
    markRoomAsRead(roomId);

    return () => {
      setActiveRoom(null);
    };
  }, [initialMessages, roomId, setMessages, setActiveRoom]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const displayMessages = messages.length > 0 ? messages : initialMessages;

  return (
    <div className="flex h-[calc(100dvh-80px)] lg:h-[calc(100dvh-48px)] flex-col -mx-4 -mt-4 lg:-mt-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background-secondary/80 backdrop-blur-lg px-4 py-3">
        <Link
          href="/chat"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          href="/chat"
          className="hidden rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary lg:block"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {otherUser && (
          <Link
            href={`/profile/${otherUser.username}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="relative shrink-0">
              {otherUser.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.display_name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border">
                  {getInitials(otherUser.display_name)}
                </div>
              )}
              {otherUser.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background-secondary bg-success" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {otherUser.display_name}
              </p>
              <p className="text-xs text-text-muted">
                {otherUser.is_online ? (
                  <span className="text-success">Online</span>
                ) : (
                  `@${otherUser.username}`
                )}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {displayMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-sm text-text-secondary">
                Say hi to {otherUser?.display_name || "your friend"}!
              </p>
            </motion.div>
          </div>
        ) : (
          displayMessages.map((msg, idx) => {
            const isOwn = msg.sender_id === roomInfo.current_user_id;
            const prevMsg = displayMessages[idx - 1];
            const showAvatar =
              !prevMsg || prevMsg.sender_id !== msg.sender_id;

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showAvatar={showAvatar}
              />
            );
          })
        )}
      </div>

      {/* Input */}
      <ChatInput roomId={roomId} />
    </div>
  );
}
