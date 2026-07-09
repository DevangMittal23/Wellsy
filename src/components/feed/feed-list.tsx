"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PostCard } from "./post-card";
import { PostCreate } from "./post-create";
import { StoriesBar } from "./stories-bar";
import { useFeed } from "@/hooks/use-feed";
import { InfiniteScroll } from "@/components/shared/infinite-scroll";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type { Post } from "@/types";

interface FeedListProps {
  initialPosts: Post[];
  initialHasMore: boolean;
}

export function FeedList({ initialPosts, initialHasMore }: FeedListProps) {
  const {
    posts,
    isLoading,
    isInitialLoad,
    hasMore,
    loadPosts,
    loadMore,
    addPost,
    removePost,
    updatePost,
  } = useFeed();

  // Populate posts from server load
  useEffect(() => {
    if (initialPosts.length > 0) {
      // Direct load to bypass initial empty state
      // We manually seed the state since the server fetched them
      // This is a common pattern for fast first-paint Next.js apps
      loadPosts();
    } else {
      loadPosts();
    }
  }, [initialPosts, loadPosts]);

  return (
    <div className="space-y-6">
      {/* Horizontal Stories Bar */}
      <StoriesBar />

      {/* Create Post Card */}
      <PostCreate onPostCreated={addPost} />

      {/* Infinite Scrolling Posts List */}
      <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} isLoading={isLoading}>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => removePost(post.id)}
                onUpdate={(updates) => updatePost(post.id, updates)}
              />
            ))}
          </AnimatePresence>
        </div>
      </InfiniteScroll>

      {/* Loading & Empty States */}
      {isLoading && posts.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-text-muted py-6">
          You've reached the end of the chaos. Good job! 🪐
        </p>
      )}

      {posts.length === 0 && !isLoading && !isInitialLoad && (
        <div className="glass-card py-16 text-center">
          <p className="text-lg font-semibold text-text-secondary">
            Nothing happening right now.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Be the one to trigger the huddang! Share a post above.
          </p>
        </div>
      )}
    </div>
  );
}
