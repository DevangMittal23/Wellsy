"use client";

import Link from "next/link";
import { formatRelativeTime, getInitials, truncate } from "@/lib/utils";

interface ChatRoomItemProps {
  room: {
    id: string;
    name: string | null;
    is_group: boolean;
    last_message_at: string;
    other_user?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      is_online: boolean;
    } | null;
    last_message?: {
      id: string;
      content: string | null;
      message_type: string;
      created_at: string;
      sender_id: string;
    } | null;
    unread_count?: number;
  };
}

export function ChatRoomItem({ room }: ChatRoomItemProps) {
  const displayName = room.other_user?.display_name || room.name || "Chat";
  const avatarUrl = room.other_user?.avatar_url;
  const isOnline = room.other_user?.is_online || false;
  const unread = room.unread_count || 0;
  const lastMsg = room.last_message;

  let previewText = "No messages yet";
  if (lastMsg) {
    if (lastMsg.message_type === "image") {
      previewText = "📷 Photo";
    } else if (lastMsg.message_type === "file") {
      previewText = "📎 Attachment";
    } else {
      previewText = truncate(lastMsg.content || "", 50);
    }
  }

  return (
    <Link
      href={`/chat/${room.id}`}
      className="glass-card group flex items-center gap-3 p-3.5 transition-all duration-200 hover:bg-surface-hover"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border">
            {getInitials(displayName)}
          </div>
        )}
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-success" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-sm font-medium ${
              unread > 0 ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            {displayName}
          </p>
          {lastMsg && (
            <span className="shrink-0 text-xs text-text-muted">
              {formatRelativeTime(lastMsg.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              unread > 0
                ? "font-medium text-text-secondary"
                : "text-text-muted"
            }`}
          >
            {previewText}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
