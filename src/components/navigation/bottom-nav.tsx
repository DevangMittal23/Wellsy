"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, PlusSquare, Bell, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useConversations } from "@/hooks/use-conversations";
import { getPendingRequests } from "@/actions/friendships";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed", badgeKey: null },
  { href: "/friends", icon: Users, label: "Friends", badgeKey: "friends" as const },
  { href: "/feed?create=true", icon: PlusSquare, label: "Create", isCreate: true, badgeKey: null },
  { href: "/notifications", icon: Bell, label: "Alerts", badgeKey: "notifications" as const },
  { href: "/profile", icon: User, label: "Profile", isDynamic: true, badgeKey: null },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Real-time unread counts automatically synced via hooks
  const { unreadCount: notifUnread } = useNotifications();
  const { totalUnread: chatUnread } = useConversations();
  const [friendsUnread, setFriendsUnread] = useState(0);

  // Fetch pending requests count on mount
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

  const getBadgeCount = (key: "chat" | "notifications" | "friends" | null) => {
    if (key === "notifications") return notifUnread;
    if (key === "chat") return chatUnread;
    if (key === "friends") return friendsUnread;
    return 0;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl lg:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const href = item.isDynamic && user
            ? `/profile/${user.username}`
            : item.href;
          const isActive = item.isDynamic
            ? pathname.startsWith("/profile")
            : pathname.startsWith(item.href.split("?")[0]) && !item.isCreate;
          const badgeCount = getBadgeCount(item.badgeKey);

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors",
                item.isCreate
                  ? "text-accent"
                  : isActive
                  ? "text-text-primary"
                  : "text-text-muted"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && !item.isCreate && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-accent"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              {item.isCreate ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 transition-colors active:bg-accent/25">
                  <item.icon className="h-5 w-5" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {badgeCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white shadow-lg shadow-accent/30">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
