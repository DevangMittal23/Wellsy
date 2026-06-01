"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface ChatMessageProps {
  message: {
    id: string;
    content: string | null;
    message_type: string;
    created_at: string;
    sender_id: string;
    profiles?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
  isOwn: boolean;
  showAvatar: boolean;
}

export function ChatMessage({ message, isOwn, showAvatar }: ChatMessageProps) {
  const senderName = message.profiles?.display_name || "Unknown";
  const isOptimistic = (message as any).isOptimistic;

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isOwn && (
          <>
            {message.profiles?.avatar_url ? (
              <img
                src={message.profiles.avatar_url}
                alt={senderName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                {getInitials(senderName)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "group max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-300",
          isOwn
            ? "rounded-tr-md bg-accent text-white"
            : "rounded-tl-md bg-surface border border-border-subtle text-text-primary",
          isOptimistic && "opacity-60 animate-pulse bg-accent/85"
        )}
      >
        {message.message_type === "text" && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
        )}
        {message.message_type === "image" && message.content && (
          <img
            src={message.content}
            alt="Shared image"
            className="max-w-full rounded-lg"
          />
        )}
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isOwn ? "text-white/60" : "text-text-muted"
          )}
        >
          {isOptimistic ? "Sending..." : formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
