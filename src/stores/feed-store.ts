import { create } from "zustand";
import type { Post } from "@/types";

interface FeedState {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  cursor: string | null;
  setPosts: (posts: Post[]) => void;
  appendPosts: (posts: Post[]) => void;
  prependPost: (post: Post) => void;
  removePost: (postId: string) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCursor: (cursor: string | null) => void;
  toggleLike: (postId: string, liked: boolean) => void;
  toggleSave: (postId: string, saved: boolean) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  cursor: null,
  setPosts: (posts) => set({ posts }),
  appendPosts: (newPosts) =>
    set((state) => ({
      posts: [...state.posts, ...newPosts],
    })),
  prependPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    })),
  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, ...updates } : p
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setCursor: (cursor) => set({ cursor }),
  toggleLike: (postId, liked) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: liked,
              likes_count: liked ? p.likes_count + 1 : p.likes_count - 1,
            }
          : p
      ),
    })),
  toggleSave: (postId, saved) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_bookmarked: saved,
            }
          : p
      ),
    })),
  reset: () =>
    set({ posts: [], isLoading: false, hasMore: true, cursor: null }),
}));
