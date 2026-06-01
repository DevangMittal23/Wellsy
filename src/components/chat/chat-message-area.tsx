"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const otherUser = roomInfo.other_user;

  // Use the robust chat stream pagination and typing hook
  const {
    messages,
    isLoading,
    hasMore,
    typingUsers,
    loadMore,
    sendMessage,
    handleTypingActivity,
  } = useChat(roomId, roomInfo.current_user_id);

  // Initialize and mark room read on mount
  useEffect(() => {
    markRoomAsRead(roomId);
  }, [roomId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // Handle reverse infinite scrolling triggers
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // When hitting the top, fetch older messages
    if (target.scrollTop === 0 && !isLoading && hasMore) {
      // Capture height before fetching to prevent jumping scroll
      const originalHeight = target.scrollHeight;
      
      loadMore().then(() => {
        // Adjust scroll position after messages prepended
        setTimeout(() => {
          if (target) {
            target.scrollTop = target.scrollHeight - originalHeight;
          }
        }, 50);
      });
    }
  };

  const displayMessages = messages.length > 0 ? messages : initialMessages;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background-secondary/80 backdrop-blur-lg px-4 py-3">
        <Link
          href="/chat"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {otherUser && (
          <Link
            href={`/profile/${otherUser.username}`}
            className="flex items-center gap-3 flex-1 min-w-0 group"
          >
            <div className="relative shrink-0">
              {otherUser.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.display_name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-border group-hover:ring-accent/50"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border group-hover:ring-accent/50">
                  {getInitials(otherUser.display_name)}
                </div>
              )}
              {otherUser.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background-secondary bg-success" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
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

      {/* Messages view list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin"
      >
        {/* Loading Spinner for pagination */}
        {isLoading && hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        )}

        {displayMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-xl ring-8 ring-accent/5">
                👋
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

        {/* Real-time typing indicators */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[10px] text-text-muted px-3 py-1.5 bg-surface-secondary border border-border/30 rounded-full max-w-fit ml-12 mt-1 shadow-sm shrink-0"
          >
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={sendMessage} onTyping={handleTypingActivity} />
    </div>
  );
}
