"use client";

import { useEffect, useCallback, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { PostCard } from "./post-card";
import { PostCreate } from "./post-create";
import { useFeedStore } from "@/stores/feed-store";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getFeedPosts } from "@/actions/post-actions";
import { Loader2 } from "lucide-react";
import type { Post } from "@/types/post";

interface FeedListProps {
  initialPosts: Post[];
  initialHasMore: boolean;
}

export function FeedList({ initialPosts, initialHasMore }: FeedListProps) {
  const {
    posts,
    isLoading,
    hasMore,
    setPosts,
    appendPosts,
    setLoading,
    setHasMore,
  } = useFeedStore();
  const [isPending, startTransition] = useTransition();

  // Initialize with server-fetched posts
  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialHasMore);
  }, [initialPosts, initialHasMore, setPosts, setHasMore]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore || isPending) return;

    setLoading(true);
    const lastPost = posts[posts.length - 1];
    const cursor = lastPost?.created_at;

    startTransition(async () => {
      const result = await getFeedPosts(cursor);
      appendPosts(result.posts as Post[]);
      setHasMore(result.hasMore);
      setLoading(false);
    });
  }, [isLoading, hasMore, isPending, posts, appendPosts, setHasMore, setLoading]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoading || isPending,
  });

  return (
    <div>
      {/* Create Post */}
      <PostCreate />

      {/* Posts */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <PostCard key={post.id} post={post as Post} />
          ))}
        </AnimatePresence>
      </div>

      {/* Loading sentinel */}
      <div ref={sentinelRef} className="py-8 text-center">
        {(isLoading || isPending) && (
          <div className="flex items-center justify-center gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more posts...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-sm text-text-muted">
            You&apos;ve reached the end ✨
          </p>
        )}
        {!hasMore && posts.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-text-secondary">
              No posts yet
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Be the first to share something!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
