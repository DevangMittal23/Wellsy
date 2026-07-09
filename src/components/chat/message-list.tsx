"use client";

import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageItem } from "./message-item";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  typingUsers: { user_id: string; display_name: string }[];
  currentUserId?: string;
}

export function MessageList({
  messages,
  isLoading,
  hasMore,
  loadMore,
  typingUsers,
  currentUserId,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Scroll to bottom on initial load / new messages
  useEffect(() => {
    const isNearBottom = containerRef.current
      ? containerRef.current.scrollHeight - containerRef.current.scrollTop <=
        containerRef.current.clientHeight + 150
      : true;

    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages.length, typingUsers.length, scrollToBottom]);

  // Adjust scroll when loading older messages (reverse infinite scrolling)
  useEffect(() => {
    if (!isLoading && containerRef.current && prevScrollHeightRef.current > 0) {
      const delta = containerRef.current.scrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = delta;
      prevScrollHeightRef.current = 0;
    }
  }, [isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 10 && !isLoading && hasMore) {
      prevScrollHeightRef.current = target.scrollHeight;
      loadMore();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin flex flex-col"
    >
      {/* Load More Indicator */}
      {hasMore && (
        <div className="flex justify-center py-2 shrink-0">
          {isLoading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-accent" />
          ) : (
            <span className="text-[10px] text-text-muted">Scroll up to load older messages</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 flex flex-col justify-end space-y-1.5">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          
          // Show avatar only if previous message was from a different user or >2m ago
          const prevMessage = messages[index - 1];
          const showAvatar =
            !prevMessage ||
            prevMessage.sender_id !== message.sender_id ||
            new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() >
              120000;

          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
            />
          );
        })}
      </div>

      {/* Typing indicators */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="flex items-center gap-2 text-[10px] text-text-muted px-3.5 py-2 bg-surface border border-border/30 rounded-full max-w-fit ml-12 mt-1 shadow-sm shrink-0"
          >
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>
              {typingUsers.map((u) => u.display_name).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
