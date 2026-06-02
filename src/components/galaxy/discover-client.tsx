"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, List, Globe2 } from "lucide-react";
import { PeopleGrid } from "@/components/friends/people-grid";
import { FriendRequestCard } from "@/components/friends/friend-request-card";

// Dynamically import Galaxy Canvas (SSR disabled — Three.js requires browser)
const GalaxyCanvas = dynamic(
  () =>
    import("@/components/galaxy/galaxy-canvas").then((mod) => mod.GalaxyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[65vh] items-center justify-center rounded-2xl border border-border/40 bg-surface/30">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="h-8 w-8 animate-pulse text-accent" />
          <p className="text-sm text-text-muted">Loading Galaxy...</p>
        </div>
      </div>
    ),
  }
);

interface DiscoverClientProps {
  suggested: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_online: boolean;
    followers_count: number;
  }[];
  pendingRequests: {
    id: string;
    sender_id: string;
    created_at: string;
    sender?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      is_online: boolean;
    };
  }[];
}

type ViewMode = "list" | "galaxy";

export function DiscoverClient({
  suggested,
  pendingRequests,
}: DiscoverClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div>
      {/* Header with toggle */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Discover People
          </h1>
          <p className="text-sm text-text-secondary">
            Find friends and grow your network
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              viewMode === "list"
                ? "bg-accent text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("galaxy")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              viewMode === "galaxy"
                ? "bg-accent text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            Galaxy
          </button>
        </div>
      </div>

      {/* Pending Friend Requests — always visible */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">
              Friend Requests
            </h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <FriendRequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Content: List or Galaxy */}
      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">
                People you may know
              </h2>
            </div>
            <PeopleGrid people={suggested} />
          </motion.div>
        ) : (
          <motion.div
            key="galaxy-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <GalaxyCanvas people={suggested} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
