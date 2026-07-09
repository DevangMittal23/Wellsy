"use client";

import Link from "next/link";
import { formatConversationTime, getInitials, truncate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Conversation } from "@/types";

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { user: currentUser } = useAuth();
  const { isOnline } = usePresence();

  // Find the other user for DMs
  const otherParticipant = conversation.type === "dm"
    ? conversation.participants?.find((p) => p.user_id !== currentUser?.id)
    : null;
  const otherUser = otherParticipant?.user;

  const displayName = conversation.type === "group"
    ? conversation.name || "Group Chat"
    : otherUser?.display_name || "HUDdang User";

  const username = conversation.type === "dm" ? otherUser?.username : null;
  
  const avatarUrl = conversation.type === "group"
    ? conversation.avatar_url
    : otherUser?.avatar_url;

  const isUserOnline = conversation.type === "dm" && otherUser
    ? isOnline(otherUser.id)
    : false;

  const unread = conversation.unread_count || 0;
  const lastMsg = conversation.last_message;
  const isOwnLastMsg = lastMsg && currentUser && lastMsg.sender_id === currentUser.id;

  let previewText = "No messages yet";
  if (lastMsg) {
    if (lastMsg.is_deleted) {
      previewText = lastMsg.deleted_for === "everyone" ? "This message was deleted" : "Message deleted";
    } else {
      const prefix = isOwnLastMsg ? "You: " : "";
      if (lastMsg.type === "image") {
        previewText = `${prefix}📷 Photo`;
      } else if (lastMsg.type === "video") {
        previewText = `${prefix}🎥 Video`;
      } else if (lastMsg.type === "audio") {
        previewText = `${prefix}🎵 Voice note`;
      } else if (lastMsg.type === "gif") {
        previewText = `${prefix}🎬 GIF`;
      } else if (lastMsg.type === "file") {
        previewText = `${prefix}📎 Attachment`;
      } else {
        previewText = `${prefix}${truncate(lastMsg.content || "", 45)}`;
      }
    }
  }

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={`glass-card relative flex items-center gap-4 p-4.5 transition-all duration-300 hover:scale-[1.015] hover:bg-surface-hover/80 hover:border-accent/30 hover:shadow-glow group active:scale-[0.99] ${
        unread > 0 ? "border-l-0" : ""
      }`}
    >
      {/* Left bar unread indicator */}
      {unread > 0 && (
        <div className="absolute left-0 top-1/4 h-1/2 w-1.5 rounded-r-full bg-accent shadow-[0_0_12px_var(--color-accent)] animate-pulse" />
      )}

      {/* Avatar Wrapper */}
      <div className="relative shrink-0">
        <UserAvatar
          src={avatarUrl}
          name={displayName}
          size="md"
          isOnline={isUserOnline}
        />
      </div>

      {/* Details */}
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
          {conversation.last_message_at && (
            <span className="shrink-0 text-[10px] font-medium text-text-muted">
              {formatConversationTime(conversation.last_message_at)}
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
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white shadow-lg shadow-accent/40 animate-pulse">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
