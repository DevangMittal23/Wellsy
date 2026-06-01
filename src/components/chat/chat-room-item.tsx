import Link from "next/link";
import { formatRelativeTime, getInitials, truncate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  const displayName = room.other_user?.display_name || room.name || "Chat";
  const username = room.other_user?.username;
  const avatarUrl = room.other_user?.avatar_url;
  const isOnline = room.other_user?.is_online || false;
  const unread = room.unread_count || 0;
  const lastMsg = room.last_message;

  const isOwnLastMsg = lastMsg && user && lastMsg.sender_id === user.id;

  let previewText = "No messages yet";
  if (lastMsg) {
    const prefix = isOwnLastMsg ? "You: " : "";
    if (lastMsg.message_type === "image") {
      previewText = `${prefix}📷 Photo`;
    } else if (lastMsg.message_type === "file") {
      previewText = `${prefix}📎 Attachment`;
    } else {
      previewText = `${prefix}${truncate(lastMsg.content || "", 45)}`;
    }
  }

  return (
    <Link
      href={`/chat/${room.id}`}
      className={`glass-card relative flex items-center gap-4 p-4.5 transition-all duration-300 hover:scale-[1.015] hover:bg-surface-hover/80 hover:border-accent/30 hover:shadow-glow group active:scale-[0.99] ${
        unread > 0 ? "border-l-0" : ""
      }`}
    >
      {/* Premium Unread Left Bar Indicator (Discord Style) */}
      {unread > 0 && (
        <div className="absolute left-0 top-1/4 h-1/2 w-1.5 rounded-r-full bg-accent shadow-[0_0_12px_var(--color-accent)] animate-pulse" />
      )}

      {/* Avatar Wrapper with pulsing online status */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-13 w-13 rounded-full object-cover ring-2 ring-border transition-all duration-300 group-hover:ring-accent/40"
          />
        ) : (
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-accent-subtle text-base font-bold text-accent ring-2 ring-border transition-all duration-300 group-hover:ring-accent/40">
            {getInitials(displayName)}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-3 border-background bg-success" />
          </span>
        )}
      </div>

      {/* Main Details Section */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <p
              className={`truncate text-sm font-semibold transition-colors group-hover:text-text-primary ${
                unread > 0 ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              {displayName}
            </p>
            {username && (
              <span className="truncate text-xs text-text-muted hidden sm:inline">
                @{username}
              </span>
            )}
          </div>
          {lastMsg && (
            <span className="shrink-0 text-[11px] font-medium text-text-muted">
              {formatRelativeTime(lastMsg.created_at)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs transition-colors ${
              unread > 0
                ? "font-semibold text-text-secondary"
                : "text-text-muted group-hover:text-text-secondary/70"
            }`}
          >
            {previewText}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white shadow-lg shadow-accent/40 animate-pulse-glow">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
