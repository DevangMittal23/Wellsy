"use client";

import { useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { formatRelativeTime, cn, getInitials } from "@/lib/utils";
import { likePost, unlikePost, savePost, unsavePost, deletePost } from "@/actions/post-actions";
import { useFeedStore } from "@/stores/feed-store";
import { useAuth } from "@/hooks/use-auth";
import type { Post } from "@/types/post";
import Link from "next/link";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toggleLike, toggleSave, removePost } = useFeedStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwner = user?.id === post.user_id;
  const profile = post.profiles;

  const handleLike = useCallback(() => {
    const newLiked = !post.has_liked;
    toggleLike(post.id, newLiked);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 400);

    startTransition(async () => {
      if (newLiked) {
        await likePost(post.id);
      } else {
        await unlikePost(post.id);
      }
    });
  }, [post.id, post.has_liked, toggleLike]);

  const handleSave = useCallback(() => {
    const newSaved = !post.has_saved;
    toggleSave(post.id, newSaved);

    startTransition(async () => {
      if (newSaved) {
        await savePost(post.id);
      } else {
        await unsavePost(post.id);
      }
    });
  }, [post.id, post.has_saved, toggleSave]);

  const handleDelete = useCallback(() => {
    removePost(post.id);
    setShowMenu(false);
    startTransition(async () => {
      await deletePost(post.id);
    });
  }, [post.id, removePost]);

  // Double-tap like
  const handleDoubleTap = useCallback(() => {
    if (!post.has_liked) {
      handleLike();
    }
  }, [post.has_liked, handleLike]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card overflow-hidden transition-shadow duration-300 hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <Link
          href={`/profile/${profile?.username}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border transition-all duration-200 group-hover:ring-accent/50"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border transition-all duration-200 group-hover:ring-accent/50">
                {profile ? getInitials(profile.display_name) : "?"}
              </div>
            )}
            {profile?.is_online && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {profile?.display_name}
            </p>
            <p className="text-xs text-text-muted">
              @{profile?.username} · {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
              aria-label="Post options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface-hover shadow-xl"
                >
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error-muted transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div
          className="px-5 pt-3"
          onDoubleClick={handleDoubleTap}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-primary">
            {post.content.split(/(#\w+|@\w+)/g).map((part, i) => {
              if (part.startsWith("#")) {
                return (
                  <Link
                    key={i}
                    href={`/search?q=${part.slice(1)}&type=hashtag`}
                    className="text-accent hover:underline"
                  >
                    {part}
                  </Link>
                );
              }
              if (part.startsWith("@")) {
                return (
                  <Link
                    key={i}
                    href={`/profile/${part.slice(1)}`}
                    className="text-accent hover:underline"
                  >
                    {part}
                  </Link>
                );
              }
              return part;
            })}
          </p>
        </div>
      )}

      {/* Media */}
      {post.post_media && post.post_media.length > 0 && (
        <div className="mt-3 px-5">
          <div
            className={cn(
              "overflow-hidden rounded-xl",
              post.post_media.length > 1 && "grid grid-cols-2 gap-1"
            )}
          >
            {post.post_media
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((media) => (
                <div
                  key={media.id}
                  className="relative overflow-hidden bg-surface"
                >
                  {media.media_type === "video" ? (
                    <video
                      src={media.url}
                      controls
                      className="w-full rounded-xl"
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt="Post media"
                      className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                      style={{
                        maxHeight: "400px",
                      }}
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Interactions */}
      <div className="flex items-center gap-1 px-3 py-3">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isPending}
          className={cn(
            "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
            post.has_liked
              ? "text-rose-400"
              : "text-text-muted hover:text-rose-400 hover:bg-rose-400/10"
          )}
          aria-label={post.has_liked ? "Unlike post" : "Like post"}
        >
          <Heart
            className={cn(
              "h-[18px] w-[18px] transition-all duration-200",
              post.has_liked && "fill-current",
              isLikeAnimating && "animate-[heart-burst_0.4s_ease-out]"
            )}
          />
          {post.likes_count > 0 && (
            <span className="text-xs font-medium">{post.likes_count}</span>
          )}
        </button>

        {/* Comment */}
        <button
          className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-info hover:bg-info/10"
          aria-label="Comment on post"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {post.comments_count > 0 && (
            <span className="text-xs font-medium">{post.comments_count}</span>
          )}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className={cn(
            "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
            post.has_saved
              ? "text-amber-400"
              : "text-text-muted hover:text-amber-400 hover:bg-amber-400/10"
          )}
          aria-label={post.has_saved ? "Unsave post" : "Save post"}
        >
          <Bookmark
            className={cn(
              "h-[18px] w-[18px] transition-all duration-200",
              post.has_saved && "fill-current"
            )}
          />
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/post/${post.id}`
            );
          }}
          className="group ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-accent hover:bg-accent/10"
          aria-label="Share post"
        >
          <Share2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    </motion.article>
  );
}
