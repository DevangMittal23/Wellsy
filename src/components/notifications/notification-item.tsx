"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markAsRead as markAsReadAction } from "@/actions/notifications";
import { acceptFriendRequest, rejectFriendRequest } from "@/actions/friendships";
import { useNotificationStore } from "@/stores/notification-store";
import { formatRelativeTime } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  MessageSquare,
  PhoneMissed,
  CornerDownRight,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "sonner";

interface NotificationItemProps {
  notification: Notification;
}

const notificationIconConfig: Record<
  string,
  {
    icon: any;
    color: string;
    bg: string;
    getText: (actorName: string) => string;
  }
> = {
  post_like: {
    icon: Heart,
    color: "text-red-400",
    bg: "bg-red-400/10",
    getText: (name) => `${name} liked your post`,
  },
  post_comment: {
    icon: MessageCircle,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    getText: (name) => `${name} commented on your post`,
  },
  comment_reply: {
    icon: CornerDownRight,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    getText: (name) => `${name} replied to your comment`,
  },
  friend_request: {
    icon: UserPlus,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    getText: (name) => `${name} sent you a friend request`,
  },
  friend_accept: {
    icon: UserCheck,
    color: "text-green-400",
    bg: "bg-green-400/10",
    getText: (name) => `${name} accepted your friend request`,
  },
  message: {
    icon: MessageSquare,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    getText: (name) => `${name} sent you a message`,
  },
  call_missed: {
    icon: PhoneMissed,
    color: "text-red-400",
    bg: "bg-red-400/10",
    getText: (name) => `${name} called you`,
  },
  mention: {
    icon: AtSign,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    getText: (name) => `${name} mentioned you`,
  },
};

const getNotificationSubtext = (notification: Notification): string => {
  switch (notification.type) {
    case 'post_like':
      return 'Tap to see the post';
    case 'post_comment': {
      const commentMatch = notification.body?.match(/commented: "(.+)"/);
      return commentMatch ? `"${commentMatch[1]}"` : 'Tap to see the comment';
    }
    case 'comment_reply':
      return 'Replied to your comment';
    case 'friend_request':
      return 'Wants to connect with you';
    case 'friend_accept':
      return 'You are now connected';
    case 'message':
      return 'Sent you a message';
    case 'call_missed':
      return 'You missed a call';
    default:
      return formatRelativeTime(notification.created_at);
  }
};

function getNotificationLink(notification: Notification): string {
  if (notification.type === "friend_request" || notification.type === "friend_accept") {
    return "/friends";
  }
  if (notification.type === "post_like" || notification.type === "post_comment") {
    return "/feed";
  }
  if (notification.type === "message") {
    return "/chat";
  }
  return "/notifications";
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead } = useNotificationStore();
  const [isActionPending, startActionTransition] = useTransition();
  const [, startTransition] = useTransition();

  const config = notificationIconConfig[notification.type] || notificationIconConfig.post_like;
  const actorName = notification.actor?.display_name || "Someone";
  const Icon = config.icon;
  const link = getNotificationLink(notification);

  const handleClick = () => {
    if (!notification.is_read) {
      startTransition(async () => {
        await markAsReadAction(notification.id);
        markAsRead(notification.id);
      });
    }
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const entityId = notification.entity_id;
    if (!entityId) return;
    startActionTransition(async () => {
      try {
        const res = await acceptFriendRequest(entityId);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Friend request accepted!");
          await markAsReadAction(notification.id);
          markAsRead(notification.id);
        }
      } catch (err) {
        toast.error("Failed to accept request");
      }
    });
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const entityId = notification.entity_id;
    if (!entityId) return;
    startActionTransition(async () => {
      try {
        const res = await rejectFriendRequest(entityId);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Friend request declined.");
          await markAsReadAction(notification.id);
          markAsRead(notification.id);
        }
      } catch (err) {
        toast.error("Failed to reject request");
      }
    });
  };

  return (
    <Link
      href={link}
      onClick={handleClick}
      className={cn(
        "glass-card group flex items-start gap-3 p-4 transition-all duration-200 hover:bg-surface-hover",
        notification.is_read
          ? "bg-transparent border-transparent"
          : "bg-white/[0.04] border-l-2 border-l-purple-500"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bg
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {notification.actor && (
            <div className="shrink-0">
              <UserAvatar
                src={notification.actor.avatar_url}
                name={notification.actor.display_name}
                size="xs"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm leading-snug",
                notification.is_read
                  ? "text-text-secondary"
                  : "text-text-primary font-medium"
              )}
            >
              {config.getText(actorName)}
            </p>
            
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {getNotificationSubtext(notification)}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              {formatRelativeTime(notification.created_at)}
            </p>

            {/* Friend Request Actions Inline */}
            {notification.type === "friend_request" && !notification.is_read && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAccept}
                  disabled={isActionPending}
                  className="px-3 py-1 text-xs bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActionPending}
                  className="px-3 py-1 text-xs bg-white/[0.06] text-text-secondary rounded-full hover:bg-white/[0.1] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent animate-pulse" />
      )}
    </Link>
  );
}
