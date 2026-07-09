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
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useConversations } from "@/hooks/use-conversations";
import { signOut } from "@/actions/auth";
import { getPendingRequests } from "@/actions/friendships";
import { cn, getInitials } from "@/lib/utils";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";

const navItems = [
  { href: "/feed", icon: Home, label: "Home", badgeKey: "feed" as const },
  { href: "/search", icon: Search, label: "Search", badgeKey: null },
  { href: "/discover", icon: Sparkles, label: "Explore", badgeKey: null },
  { href: "/friends", icon: Users, label: "Circle", badgeKey: "friends" as const },
  { href: "/chat", icon: MessageCircle, label: "Messages", badgeKey: "chat" as const },
  { href: "/notifications", icon: Bell, label: "Activity", badgeKey: "notifications" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Real-time unread counts automatically synced via hooks
  const { unreadCount: notifUnread } = useNotifications();
  const { totalUnread: chatUnread } = useConversations();
  const [friendsUnread, setFriendsUnread] = useState(0);

  // Fetch pending friend requests
  useEffect(() => {
    async function fetchFriendsCount() {
      try {
        const pending = await getPendingRequests();
        setFriendsUnread(pending?.length || 0);
      } catch (err) {
        console.error(err);
      }
    }
    if (user?.id) {
      fetchFriendsCount();
    }
  }, [user?.id]);

  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    if (notifUnread > 0) {
      setShouldShake(true);
      const t = setTimeout(() => setShouldShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [notifUnread]);

  const bellVariants = {
    shake: {
      rotate: [0, -15, 12, -10, 8, -4, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut" as const
      }
    },
    default: { rotate: 0 }
  };

  const getBadgeCount = (key: "chat" | "notifications" | "friends" | "feed" | null) => {
    if (key === "notifications") return notifUnread;
    if (key === "chat") return chatUnread;
    if (key === "friends") return friendsUnread;
    return 0;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[240px] flex-col border-r border-white/[0.06] bg-background-secondary lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/[0.06] mb-4">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <span className="text-sm font-bold text-white">H</span>
          </div>
          <span className="gradient-text text-xl font-bold tracking-tight">
            HUDdang
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const badgeCount = getBadgeCount(item.badgeKey);
          const isActivity = item.badgeKey === "notifications";
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                isActive
                  ? "text-white border-l-[3px] border-purple-500 pl-[13px] bg-white/[0.05]"
                  : "text-text-secondary hover:text-white hover:bg-white/[0.03] border-l-[3px] border-transparent"
              )}
            >
              <div className="relative">
                {isActivity ? (
                  <motion.div
                    animate={shouldShake ? "shake" : "default"}
                    variants={bellVariants}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                      )}
                    />
                  </motion.div>
                ) : (
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                    )}
                  />
                )}
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
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.06] pt-4 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface">
          <Link
            href={user ? `/profile/${user.username}` : "/feed"}
            className="flex flex-1 items-center gap-3"
          >
            <UserAvatar
              src={user?.avatar_url}
              name={user?.display_name || "User"}
              size="sm"
              isOnline={true}
            />
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
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-error cursor-pointer"
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
