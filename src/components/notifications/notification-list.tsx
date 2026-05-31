"use client";

import { useEffect, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/stores/notification-store";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/actions/notification-actions";
import { NotificationItem } from "./notification-item";
import { Loader2, CheckCheck, Bell } from "lucide-react";
import type { Notification } from "@/types/notification";

interface NotificationListProps {
  initialNotifications: Notification[];
  initialHasMore: boolean;
}

export function NotificationList({
  initialNotifications,
  initialHasMore,
}: NotificationListProps) {
  const {
    notifications,
    isLoading,
    hasMore,
    setNotifications,
    appendNotifications,
    setLoading,
    setHasMore,
    markAllRead,
  } = useNotificationStore();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setNotifications(initialNotifications);
    setHasMore(initialHasMore);
  }, [initialNotifications, initialHasMore, setNotifications, setHasMore]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore || isPending) return;

    setLoading(true);
    const lastNotif = notifications[notifications.length - 1];
    const cursor = lastNotif?.created_at;

    startTransition(async () => {
      const result = await getNotifications(cursor);
      appendNotifications(result.notifications as Notification[]);
      setHasMore(result.hasMore);
      setLoading(false);
    });
  }, [
    isLoading,
    hasMore,
    isPending,
    notifications,
    appendNotifications,
    setHasMore,
    setLoading,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoading || isPending,
  });

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      markAllRead();
    });
  };

  const displayNotifications =
    notifications.length > 0 ? notifications : initialNotifications;
  const hasUnread = displayNotifications.some((n) => !n.is_read);

  return (
    <div>
      {/* Mark all read button */}
      {hasUnread && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-subtle"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <NotificationItem notification={notification as Notification} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading sentinel */}
      <div ref={sentinelRef} className="py-8 text-center">
        {(isLoading || isPending) && (
          <div className="flex items-center justify-center gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {!hasMore && displayNotifications.length > 0 && (
          <p className="text-sm text-text-muted">
            You&apos;re all caught up ✨
          </p>
        )}
        {!hasMore && displayNotifications.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle">
              <Bell className="h-8 w-8 text-accent" />
            </div>
            <p className="text-lg font-medium text-text-secondary">
              No notifications yet
            </p>
            <p className="mt-1 text-sm text-text-muted">
              When someone interacts with you, it&apos;ll show up here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
