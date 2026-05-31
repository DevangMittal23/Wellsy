"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  PlusSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationStore } from "@/stores/notification-store";
import { useChatStore } from "@/stores/chat-store";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { signOut } from "@/actions/auth-actions";
import { getUnreadNotificationCount } from "@/actions/notification-actions";
import { getTotalUnreadMessages } from "@/actions/chat-actions";
import { cn, getInitials } from "@/lib/utils";
import { useEffect } from "react";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed", badgeKey: null },
  { href: "/search", icon: Search, label: "Search", badgeKey: null },
  { href: "/discover", icon: Users, label: "Discover", badgeKey: null },
  { href: "/chat", icon: MessageCircle, label: "Chat", badgeKey: "chat" as const },
  { href: "/notifications", icon: Bell, label: "Notifications", badgeKey: "notifications" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount: notifUnread, setUnreadCount: setNotifUnread } = useNotificationStore();
  const { totalUnread: chatUnread, setTotalUnread: setChatUnread } = useChatStore();

  // Subscribe to realtime updates
  useRealtimeNotifications(user?.id);
  useChatRooms(user?.id);

  // Fetch initial unread counts
  useEffect(() => {
    async function fetchCounts() {
      const [notifCount, chatCount] = await Promise.all([
        getUnreadNotificationCount(),
        getTotalUnreadMessages(),
      ]);
      setNotifUnread(notifCount);
      setChatUnread(chatCount);
    }
    if (user?.id) {
      fetchCounts();
    }
  }, [user?.id, setNotifUnread, setChatUnread]);

  const getBadgeCount = (key: "chat" | "notifications" | null) => {
    if (key === "notifications") return notifUnread;
    if (key === "chat") return chatUnread;
    return 0;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[260px] flex-col border-r border-border bg-background-secondary lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <span className="gradient-text text-xl font-bold tracking-tight">
            WELLSY
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const badgeCount = getBadgeCount(item.badgeKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-surface"
                  style={{ zIndex: -1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                  )}
                />
                {badgeCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white shadow-lg shadow-accent/30">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}

        {/* Create Post */}
        <Link
          href="/feed?create=true"
          className="mt-4 flex items-center gap-3 rounded-xl bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent transition-all duration-200 hover:bg-accent/20"
        >
          <PlusSquare className="h-5 w-5 shrink-0" />
          Create Post
        </Link>
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface">
          <Link
            href={user ? `/profile/${user.username}` : "/feed"}
            className="flex flex-1 items-center gap-3"
          >
            <div className="relative">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent ring-2 ring-border">
                  {user ? getInitials(user.display_name) : "?"}
                </div>
              )}
              {user?.is_online && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background-secondary bg-success" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-text-primary">
                {user?.display_name || "Loading..."}
              </p>
              <p className="truncate text-xs text-text-muted">
                @{user?.username || "..."}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-error"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
