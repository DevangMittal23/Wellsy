"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markNotificationRead } from "@/actions/notification-actions";
import { useNotificationStore } from "@/stores/notification-store";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { Heart, MessageCircle, UserPlus, AtSign, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

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
  like: {
    icon: Heart,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    getText: (name) => `${name} liked your post`,
  },
  comment: {
    icon: MessageCircle,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    getText: (name) => `${name} commented on your post`,
  },
  follow: {
    icon: UserPlus,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    getText: (name) => `${name} started following you`,
  },
  mention: {
    icon: AtSign,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    getText: (name) => `${name} mentioned you`,
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
  share: {
    icon: Share2,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    getText: (name) => `${name} shared your post`,
  },
};

function getNotificationLink(notification: Notification): string {
  if (notification.type === "follow" && notification.actor?.username) {
    return `/profile/${notification.actor.username}`;
  }
  if (
    (notification.type === "like" || notification.type === "comment") &&
    notification.entity_id
  ) {
    return "/feed";
  }
  if (notification.type === "message") {
    return "/chat";
  }
  return "/notifications";
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markRead } = useNotificationStore();
  const [, startTransition] = useTransition();

  const config = notificationConfig[notification.type] || notificationConfig.like;
  const actorName =
    notification.actor?.display_name || notification.content || "Someone";
  const Icon = config.icon;
  const link = getNotificationLink(notification);

  const handleClick = () => {
    if (!notification.is_read) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
        markRead(notification.id);
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
          {/* Actor avatar */}
          {notification.actor && (
            <div className="shrink-0">
              {notification.actor.avatar_url ? (
                <img
                  src={notification.actor.avatar_url}
                  alt={notification.actor.display_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                  {getInitials(notification.actor.display_name)}
                </div>
              )}
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
            {notification.content && notification.type !== "follow" && (
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {notification.content}
              </p>
            )}
            <p className="mt-1 text-xs text-text-muted">
              {formatRelativeTime(notification.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Unread dot */}
      {!notification.is_read && (
        <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent animate-pulse" />
      )}
    </Link>
  );
}
