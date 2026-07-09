"use client";

import { useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/use-notifications";
import { markAllRead as markAllReadAction } from "@/actions/notifications";
import { useNotificationStore } from "@/stores/notification-store";
import { NotificationItem } from "./notification-item";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CheckCheck, Bell } from "lucide-react";
import type { Notification } from "@/types";

export function NotificationList() {
  const { notifications, unreadCount, isLoading } = useNotifications();
  const { markAllRead } = useNotificationStore();
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllReadAction();
      markAllRead();
    });
  };

  const hasUnread = unreadCount > 0;

  return (
    <div>
      {/* Mark all read button */}
      {hasUnread && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent-subtle cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <NotificationItem notification={notification} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* States */}
      {isLoading && notifications.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="py-12 text-center glass-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted/20">
            <Bell className="h-8 w-8 text-accent" />
          </div>
          <p className="text-lg font-medium text-text-secondary">
            No notifications yet
          </p>
          <p className="mt-1 text-sm text-text-muted">
            When someone interacts with you, it'll show up here
          </p>
        </div>
      )}
    </div>
  );
}
