"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markAsRead as markAsReadAction } from "@/actions/notifications";
import { useNotificationStore } from "@/stores/notification-store";
import { formatRelativeTime } from "@/lib/utils";
import { Heart, MessageCircle, UserPlus, AtSign, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";
import { UserAvatar } from "@/components/shared/user-avatar";

interface NotificationItemProps {
  notification: Notification;
}

const notificationConfig: Record<
  string,
  {
    icon: typeof Heart;
    color: string;
    bgColor: string;
    getText: (actorName: string) => string;
  }
> = {
  post_like: {
    icon: Heart,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    getText: (name) => `${name} liked your post`,
  },
  post_comment: {
    icon: MessageCircle,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    getText: (name) => `${name} commented on your post`,
  },
  friend_request: {
    icon: UserPlus,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    getText: (name) => `${name} sent you a friend request`,
  },
  friend_accept: {
    icon: UserPlus,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    getText: (name) => `${name} accepted your friend request`,
  },
  message: {
    icon: MessageCircle,
    color: "text-accent",
    bgColor: "bg-accent-subtle",
    getText: (name) => `${name} sent you a message`,
  },
  mention: {
    icon: AtSign,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    getText: (name) => `${name} mentioned you`,
  },
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
  const [, startTransition] = useTransition();

  const config = notificationConfig[notification.type] || notificationConfig.post_like;
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

  return (
    <Link
      href={link}
      onClick={handleClick}
      className={cn(
        "glass-card group flex items-start gap-3 p-4 transition-all duration-200 hover:bg-surface-hover",
        !notification.is_read && "border-l-2 border-l-accent"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bgColor
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
            {notification.body && (
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {notification.body}
              </p>
            )}
            <p className="mt-1 text-xs text-text-muted">
              {formatRelativeTime(notification.created_at)}
            </p>
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
