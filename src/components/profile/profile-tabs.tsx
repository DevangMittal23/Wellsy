"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PostCard } from "@/components/feed/post-card";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";
import { getLikedPosts, getSavedPosts } from "@/actions/post-actions";
import { Loader2, Heart, Bookmark, EyeOff } from "lucide-react";

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

export function ProfileTabs({ posts, userId, isOwnProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

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

  // Fetch likes and saves dynamically on active tab changes
  useEffect(() => {
    async function fetchLikes() {
      setLoadingLikes(true);
      try {
        const res = await getLikedPosts(userId);
        if (res && res.posts) {
          setLikedPosts(res.posts as Post[]);
        }
      } catch (err) {
        console.error("Failed to load liked posts:", err);
      } finally {
        setLoadingLikes(false);
      }
    }

    async function fetchSaved() {
      setLoadingSaved(true);
      try {
        const res = await getSavedPosts();
        if (res && res.posts) {
          setSavedPosts(res.posts as Post[]);
        }
      } catch (err) {
        console.error("Failed to load saved posts:", err);
      } finally {
        setLoadingSaved(false);
      }
    }

    if (activeTab === "likes") {
      fetchLikes();
    } else if (activeTab === "saved" && isOwnProfile) {
      fetchSaved();
    }
  }, [activeTab, userId, isOwnProfile]);

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

        {activeTab === "likes" && (
          <>
            {loadingLikes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : likedPosts.length > 0 ? (
              likedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="glass-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface border border-border/50 text-rose-400">
                  <Heart className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-text-secondary">No liked posts yet</p>
                <p className="mt-1 text-xs text-text-muted">
                  {isOwnProfile ? "Posts you like on the feed will appear here." : "Liked posts will appear here."}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "saved" && isOwnProfile && (
          <>
            {loadingSaved ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : savedPosts.length > 0 ? (
              savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="glass-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface border border-border/50 text-amber-400">
                  <Bookmark className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-text-secondary">No saved posts yet</p>
                <p className="mt-1 text-xs text-text-muted">
                  Posts you save from your feed will be visible only to you here.
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
                  (post.post_media || []).map((media) => (
                    <div
                      key={media.id}
                      className="relative aspect-square overflow-hidden bg-surface rounded-xl border border-border/40"
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
