"use client";

import { useState, useCallback } from "react";
import { getFeedPosts } from "@/actions/posts";
import type { Post } from "@/types";

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadPosts = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    const result = await getFeedPosts(cursor);
    if (cursor) {
      setPosts((prev) => [...prev, ...result.posts]);
    } else {
      setPosts(result.posts);
    }
    setHasMore(result.hasMore);
    setIsLoading(false);
    setIsInitialLoad(false);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    const lastPost = posts[posts.length - 1];
    if (lastPost) {
      loadPosts(lastPost.created_at);
    }
  }, [hasMore, isLoading, posts, loadPosts]);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
    );
  }, []);

  return {
    posts,
    isLoading,
    isInitialLoad,
    hasMore,
    loadPosts,
    loadMore,
    addPost,
    removePost,
    updatePost,
  };
}
