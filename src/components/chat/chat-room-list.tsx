"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { ChatRoomItem } from "./chat-room-item";
import { MessageCircle, Search, MessageSquareCode, Users2, Dot } from "lucide-react";

interface ChatRoomListProps {
  initialRooms: Array<{
    id: string;
    name: string | null;
    is_group: boolean;
    last_message_at: string;
    other_user?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      is_online: boolean;
    } | null;
    last_message?: {
      id: string;
      content: string | null;
      message_type: string;
      created_at: string;
      sender_id: string;
    } | null;
    unread_count?: number;
  }>;
}

type TabType = "all" | "unread" | "online";

export function ChatRoomList({ initialRooms }: ChatRoomListProps) {
  const { rooms, setRooms } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms, setRooms]);

  const displayRooms = rooms.length > 0 ? rooms : initialRooms;

  // Search and Filter rooms
  const filteredRooms = useMemo(() => {
    return displayRooms.filter((room) => {
      // 1. Search Query Match
      const displayName = room.other_user?.display_name || room.name || "Chat";
      const username = room.other_user?.username || "";
      const matchesSearch =
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Tab Category Match
      if (activeTab === "unread") {
        return (room.unread_count || 0) > 0;
      }
      if (activeTab === "online") {
        return room.other_user?.is_online === true;
      }

      return true;
    });
  }, [displayRooms, searchQuery, activeTab]);

  const onlineCount = useMemo(() => {
    return displayRooms.filter((r) => r.other_user?.is_online === true).length;
  }, [displayRooms]);

  const unreadCount = useMemo(() => {
    return displayRooms.filter((r) => (r.unread_count || 0) > 0).length;
  }, [displayRooms]);

  return (
    <div className="space-y-5">
      {/* Search and Navigation Tabs header */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-muted">
            <Search className="h-4.5 w-4.5 transition-colors group-focus-within:text-accent" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface/50 py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-300 focus:border-accent focus:bg-surface focus:shadow-glow"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "unread", "online"] as const).map((tab) => {
            const isActive = activeTab === tab;
            let badge = null;

            if (tab === "unread" && unreadCount > 0) {
              badge = unreadCount;
            } else if (tab === "online" && onlineCount > 0) {
              badge = onlineCount;
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-accent/15 text-accent shadow-sm"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                {tab === "all" && "All Messages"}
                {tab === "unread" && "Unread"}
                {tab === "online" && "Active Now"}

                {badge !== null && (
                  <span
                    className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                      isActive ? "bg-accent text-white" : "bg-surface-hover text-text-secondary"
                    }`}
                  >
                    {badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="chat-active-tab-indicator"
                    className="absolute inset-0 -z-10 rounded-xl border border-accent/30"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChatRoomItem room={room} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface mb-4 border border-border/50">
                {activeTab === "online" ? (
                  <Users2 className="h-7 w-7 text-text-secondary" />
                ) : activeTab === "unread" ? (
                  <MessageSquareCode className="h-7 w-7 text-text-secondary" />
                ) : (
                  <MessageCircle className="h-7 w-7 text-text-secondary" />
                )}
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                {activeTab === "online"
                  ? "Nobody is active right now"
                  : activeTab === "unread"
                  ? "No unread messages"
                  : "No conversations found"}
              </h3>
              <p className="mt-1 max-w-xs text-xs text-text-muted">
                {searchQuery
                  ? "Try checking your spelling or search for another name."
                  : activeTab === "online"
                  ? "When your friends are active online, they will show up here."
                  : "Start a conversation by visiting a friend's profile and clicking Message!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
