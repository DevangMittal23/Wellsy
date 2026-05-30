"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/feed/post-card";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";

const tabs = [
  { id: "posts", label: "Posts" },
  { id: "likes", label: "Likes" },
  { id: "saved", label: "Saved" },
  { id: "media", label: "Media" },
];

interface ProfileTabsProps {
  posts: Post[];
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileTabs({ posts, isOwnProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("posts");

  // Filter tabs for non-owners (hide saved)
  const visibleTabs = isOwnProfile
    ? tabs
    : tabs.filter((t) => t.id !== "saved");

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "media") {
      return post.post_media && post.post_media.length > 0;
    }
    return true;
  });

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4 pt-4"
      >
        {activeTab === "posts" && (
          <>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-text-muted">No posts yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === "likes" && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">Liked posts will appear here</p>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">Saved posts will appear here</p>
          </div>
        )}

        {activeTab === "media" && (
          <>
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl">
                {filteredPosts.flatMap((post) =>
                  (post.post_media || []).map((media) => (
                    <div
                      key={media.id}
                      className="relative aspect-square overflow-hidden bg-surface"
                    >
                      <img
                        src={media.url}
                        alt="Media"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-text-muted">No media yet</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
