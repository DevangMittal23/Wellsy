"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/feed/post-card";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";
import { getBookmarkedPosts } from "@/actions/posts";
import { Loader2, Bookmark, EyeOff } from "lucide-react";

const tabs = [
  { id: "posts", label: "Posts" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "media", label: "Media" },
];

interface ProfileTabsProps {
  posts: Post[];
  userId: string;
  isOwnProfile: boolean;
}

export function ProfileTabs({ posts, userId, isOwnProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loadingBookmarked, setLoadingBookmarked] = useState(false);

  // Filter out Bookmarked tab for other users
  const visibleTabs = isOwnProfile
    ? tabs
    : tabs.filter((t) => t.id !== "bookmarked");

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "media") {
      return post.media_urls && post.media_urls.length > 0;
    }
    return true;
  });

  // Fetch bookmarked posts on tab switch
  useEffect(() => {
    async function fetchBookmarks() {
      setLoadingBookmarked(true);
      try {
        const res = await getBookmarkedPosts();
        if (res && res.posts) {
          setBookmarkedPosts(res.posts as Post[]);
        }
      } catch (err) {
        console.error("Failed to load bookmarks:", err);
      } finally {
        setLoadingBookmarked(false);
      }
    }

    if (activeTab === "bookmarked" && isOwnProfile) {
      fetchBookmarks();
    }
  }, [activeTab, isOwnProfile]);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer",
              activeTab === tab.id
                ? "text-text-primary font-semibold"
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
              <div className="glass-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface border border-border/50 text-text-muted">
                  <EyeOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-text-secondary">No posts yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === "bookmarked" && isOwnProfile && (
          <>
            {loadingBookmarked ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : bookmarkedPosts.length > 0 ? (
              bookmarkedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="glass-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface border border-border/50 text-amber-400">
                  <Bookmark className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-text-secondary">No bookmarked posts yet</p>
                <p className="mt-1 text-xs text-text-muted">
                  Posts you bookmark from the feed will be visible only to you here.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "media" && (
          <>
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                {filteredPosts.flatMap((post) =>
                  (post.media_urls || []).map((url) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden bg-surface rounded-xl border border-border/40"
                    >
                      <img
                        src={url}
                        alt="Media"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="glass-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface border border-border/50 text-text-muted">
                  <EyeOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-text-secondary">No media posts yet</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
