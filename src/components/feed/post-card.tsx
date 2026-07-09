"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Trash2,
  Check,
  Send,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  deletePost,
} from "@/actions/posts";
import { createComment, getPostComments } from "@/actions/comments";
import { useAuth } from "@/hooks/use-auth";
import type { Post, Comment } from "@/types";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<Post>) => void;
}

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.id === post.author_id;
  const author = post.author;
  const rootComments = comments.filter((c) => c.parent_comment_id === null);

  const handleLike = useCallback(() => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    const newLiked = !post.is_liked;
    const currentLikesCount = post.likes_count;
    
    // Optimistic update
    if (onUpdate) {
      onUpdate({
        is_liked: newLiked,
        likes_count: newLiked ? currentLikesCount + 1 : Math.max(0, currentLikesCount - 1),
      });
    }

    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 400);

    startTransition(async () => {
      if (newLiked) {
        await likePost(post.id);
      } else {
        await unlikePost(post.id);
      }
    });
  }, [post.id, post.is_liked, post.likes_count, onUpdate, user]);

  const handleSave = useCallback(() => {
    if (!user) {
      toast.error("Please sign in to bookmark posts");
      return;
    }
    const newSaved = !post.is_bookmarked;
    
    // Optimistic update
    if (onUpdate) {
      onUpdate({ is_bookmarked: newSaved });
    }

    startTransition(async () => {
      if (newSaved) {
        await bookmarkPost(post.id);
        toast.success("Post bookmarked!");
      } else {
        await unbookmarkPost(post.id);
        toast.success("Bookmark removed");
      }
    });
  }, [post.id, post.is_bookmarked, onUpdate, user]);

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const res = await deletePost(post.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Post deleted successfully");
        if (onDelete) onDelete();
      }
    });
    setShowMenu(false);
  }, [post.id, onDelete]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: `HUDdang Post by @${author?.username || "user"}`,
      text: post.content || "Check out this post on HUDdang!",
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Web Share failed:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  }, [post.id, post.content, author?.username]);

  const toggleComments = useCallback(async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);

    if (!nextShow) {
      setReplyingTo(null);
    }

    if (nextShow && comments.length === 0) {
      setLoadingComments(true);
      try {
        const list = await getPostComments(post.id);
        setComments(list);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  }, [showComments, comments.length, post.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const parentId = replyingTo ? replyingTo.id : null;
      const res = await createComment(post.id, commentText.trim(), parentId);
      if (res && res.comment) {
        if (parentId) {
          // Append as reply to the correct parent comment
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), res.comment as Comment] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, res.comment as Comment]);
        }
        setCommentText("");
        setReplyingTo(null);
        if (onUpdate) {
          onUpdate({ comments_count: post.comments_count + 1 });
        }
        toast.success("Comment posted!");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoubleTap = useCallback(() => {
    if (!post.is_liked) {
      handleLike();
    }
  }, [post.is_liked, handleLike]);

  return (
    <div className="glass-card group/card flex flex-col overflow-hidden border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <Link
          href={`/profile/${author?.username || "user"}`}
          className="flex items-center gap-3 group"
        >
          <UserAvatar
            src={author?.avatar_url}
            name={author?.display_name || "User"}
            size="sm"
            isOnline={true}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {author?.display_name || "HUDdang User"}
            </p>
            <p className="text-xs text-text-muted">
              @{author?.username || "user"} · {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-text-muted transition-all hover:bg-surface-hover hover:text-text-secondary cursor-pointer opacity-0 group-hover/card:opacity-100 duration-200"
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
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error-muted transition-colors cursor-pointer"
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
        <div className="px-5 pt-3" onDoubleClick={handleDoubleTap}>
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
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="mt-3 px-5">
          {post.media_urls.length === 1 ? (
            <div 
              className="relative w-full overflow-hidden rounded-xl bg-surface border border-white/[0.06]"
              style={{ aspectRatio: "16/9", maxHeight: "480px" }}
            >
              {post.media_types?.[0] === "video" ? (
                <video
                  src={post.media_urls[0]}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                <img
                  src={post.media_urls[0]}
                  alt="Post media"
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
                  loading="lazy"
                  onClick={() => window.open(post.media_urls[0], "_blank")}
                />
              )}
            </div>
          ) : (
            <div className={cn(
              "grid gap-1 rounded-xl overflow-hidden h-[360px] bg-surface border border-white/[0.06]",
              post.media_urls.length === 2 ? "grid-cols-2" : "grid-cols-2"
            )}>
              {post.media_urls.slice(0, 4).map((url, index) => {
                const mediaType = post.media_types?.[index] || "image";
                const isThirdAndFirst = post.media_urls.length === 3 && index === 0;
                return (
                  <div key={url} className={cn("relative overflow-hidden bg-black/10 w-full h-full", isThirdAndFirst && "row-span-2")}>
                    {mediaType === "video" ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Post media item"
                        className="w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                        onClick={() => window.open(url, "_blank")}
                      />
                    )}
                    {index === 3 && post.media_urls.length > 4 && (
                      <div 
                        onClick={() => window.open(url, "_blank")}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white text-2xl font-bold">+{post.media_urls.length - 4}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Link Preview (OpenGraph) */}
      {post.link_preview && (
        <div className="mt-3 px-5">
          <a
            href={post.link_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-border bg-surface/30 hover:bg-surface/50 transition-colors"
          >
            {post.link_preview.image && (
              <img
                src={post.link_preview.image}
                alt={post.link_preview.title || "Preview"}
                className="h-40 sm:h-auto sm:w-40 object-cover shrink-0"
              />
            )}
            <div className="p-4 flex flex-col justify-center min-w-0">
              <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                {post.link_preview.domain}
              </span>
              <h4 className="text-sm font-semibold mt-1 text-text-primary truncate">
                {post.link_preview.title}
              </h4>
              <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                {post.link_preview.description}
              </p>
            </div>
          </a>
        </div>
      )}

      {/* Interactions */}
      <div className="flex items-center gap-6 px-5 py-3 border-b border-border/20">
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleLike}
          disabled={isPending}
          className="flex items-center gap-1.5 text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
          aria-label={post.is_liked ? "Unlike post" : "Like post"}
        >
          <motion.div
            animate={post.is_liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ type: "keyframes", duration: 0.3, ease: "easeInOut" }}
          >
            <Heart
              className={cn(
                "h-[18px] w-[18px]",
                post.is_liked ? "text-rose-500 fill-rose-500" : "text-text-muted"
              )}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            {post.likes_count > 0 && (
              <motion.span
                key={post.likes_count}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-xs font-medium tabular-nums"
              >
                {post.likes_count}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <button
          onClick={toggleComments}
          className={cn(
            "flex items-center gap-1.5 text-text-muted hover:text-info transition-colors cursor-pointer",
            showComments && "text-accent font-medium"
          )}
          aria-label="Comment on post"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {post.comments_count > 0 && (
            <span className="text-xs font-medium">{post.comments_count}</span>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 text-text-muted hover:text-amber-500 transition-colors cursor-pointer"
          aria-label={post.is_bookmarked ? "Unsave post" : "Save post"}
        >
          <Bookmark
            className={cn(
              "h-[18px] w-[18px] transition-all duration-200",
              post.is_bookmarked ? "text-amber-500 fill-amber-500" : "text-text-muted"
            )}
          />
        </button>

        <button
          onClick={handleShare}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
            copied
              ? "text-success bg-success/10 font-semibold"
              : "text-text-muted hover:text-accent"
          )}
          aria-label="Share post"
        >
          {copied ? (
            <>
              <Check className="h-[18px] w-[18px] text-success" />
              <span className="text-[10.5px] font-semibold text-success animate-fade-in">
                Copied!
              </span>
            </>
          ) : (
            <Share2 className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {/* Comments Drawer Expansion */}
      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden bg-surface/15"
          >
            <div className="px-5 py-4 space-y-4">
              {/* Comment submission form */}
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-accent/15 border border-accent/35 rounded-xl px-3 py-1.5 text-xs text-accent">
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium animate-pulse">Replying to</span>
                      <span className="font-semibold">@{replyingTo.username}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-text-muted hover:text-accent transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <UserAvatar
                    src={user?.avatar_url}
                    name={user?.display_name || "User"}
                    size="xs"
                    isOnline={true}
                  />
                  <div className="relative flex-1">
                    <input
                      ref={commentInputRef}
                      type="text"
                      placeholder={
                        replyingTo
                          ? `Reply to @${replyingTo.username}...`
                          : "Write a comment..."
                      }
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full rounded-xl border border-border/50 bg-surface/50 py-2.5 pl-4 pr-10 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-accent/60 focus:bg-surface focus:shadow-glow"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmitting}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-accent disabled:text-text-muted transition-colors cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  </div>
                ) : rootComments.length > 0 ? (
                  rootComments.map((c) => (
                    <div key={c.id} className="space-y-3 border-b border-border/10 pb-3 last:border-0 last:pb-0">
                      {/* Root Comment Row */}
                      <div className="flex gap-3">
                        <UserAvatar
                          src={c.author?.avatar_url}
                          name={c.author?.display_name || "User"}
                          size="xs"
                        />
                        <div className="flex-1">
                          <div className="rounded-2xl bg-surface/40 px-3.5 py-2.5 border border-border/20">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-1.5 min-w-0">
                                <span className="text-xs font-semibold text-text-primary truncate">
                                  {c.author?.display_name}
                                </span>
                                <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                                  @{c.author?.username}
                                </span>
                              </div>
                              <span className="text-[9px] text-text-muted shrink-0">
                                {formatRelativeTime(c.created_at)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                              {c.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 mt-1 px-1.5">
                            <button
                              onClick={() => {
                                setReplyingTo({
                                  id: c.id,
                                  username: c.author?.username || "user",
                                });
                                commentInputRef.current?.focus();
                              }}
                              className="text-[10px] font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="pl-6 space-y-3 border-l border-border/10 ml-4">
                          {c.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2.5">
                              <UserAvatar
                                src={reply.author?.avatar_url}
                                name={reply.author?.display_name || "User"}
                                size="xs"
                              />
                              <div className="flex-1">
                                <div className="rounded-2xl bg-surface/20 px-3 py-2 border border-border/15">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-baseline gap-1.5 min-w-0">
                                      <span className="text-[11px] font-semibold text-text-primary truncate">
                                        {reply.author?.display_name}
                                      </span>
                                      <span className="text-[9px] text-text-muted truncate hidden sm:inline">
                                        @{reply.author?.username}
                                      </span>
                                    </div>
                                    <span className="text-[8px] text-text-muted shrink-0">
                                      {formatRelativeTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border/40 text-text-muted">
                      <MessageSquare className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs text-text-muted">
                      No comments yet. Say something!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
