"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <div className={cn("relative cursor-pointer", className)}>
      <Bell className="h-6 w-6 text-text-secondary hover:text-text-primary transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white shadow-md animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
}
