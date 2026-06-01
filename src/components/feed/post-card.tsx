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
import { formatRelativeTime, cn, getInitials } from "@/lib/utils";
import {
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  deletePost,
  createComment,
  getPostComments,
} from "@/actions/post-actions";
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
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.id === post.user_id;
  const profile = post.profiles;
  const rootComments = comments.filter((c) => c.parent_id === null);

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

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: `WELLSY Post by @${profile?.username || "user"}`,
      text: post.content || "Check out this post on WELLSY!",
      url: shareUrl,
    };

    // Use Web Share API if supported by the browser/OS
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return; // user cancelled native share modal
        }
        console.error("Web Share failed, falling back to clipboard:", err);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  }, [post.id, post.content, profile?.username]);

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
    const formData = new FormData();
    formData.append("content", commentText.trim());
    if (replyingTo) {
      formData.append("parent_id", replyingTo.id);
    }

    try {
      const res = await createComment(post.id, formData);
      if (res && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentText("");
        setCommentsCount((prev) => prev + 1);
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find the ultimate root parent for any comment
  const getRootId = useCallback((commentId: string, list: any[]): string | null => {
    const comment = list.find((c) => c.id === commentId);
    if (!comment) return null;
    if (comment.parent_id === null) return comment.id;
    return getRootId(comment.parent_id, list);
  }, []);

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
      <div className="flex items-center gap-1 px-3 py-3 border-b border-border/20">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isPending}
          className={cn(
            "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
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
          onClick={toggleComments}
          className={cn(
            "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
            showComments
              ? "text-accent bg-accent/10 font-medium"
              : "text-text-muted hover:text-info hover:bg-info/10"
          )}
          aria-label="Comment on post"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {commentsCount > 0 && (
            <span className="text-xs font-medium">{commentsCount}</span>
          )}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className={cn(
            "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
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
          onClick={handleShare}
          className={cn(
            "group ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
            copied
              ? "text-success bg-success/10"
              : "text-text-muted hover:text-accent hover:bg-accent/10"
          )}
          aria-label="Share post"
        >
          {copied ? (
            <>
              <Check className="h-[18px] w-[18px] text-success" />
              <span className="text-[10.5px] font-semibold animate-fade-in text-success">Copied!</span>
            </>
          ) : (
            <Share2 className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {/* Comments Section Drawer Expand */}
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
              {/* Comment input form */}
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
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="h-8.5 w-8.5 rounded-full object-cover ring-1 ring-border shrink-0"
                    />
                  ) : (
                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent ring-1 ring-border shrink-0">
                      {user ? getInitials(user.display_name) : "?"}
                    </div>
                  )}
                  <div className="relative flex-1">
                    <input
                      ref={commentInputRef}
                      type="text"
                      placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
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

              {/* Comments view list */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  </div>
                ) : rootComments.length > 0 ? (
                  rootComments.map((c) => (
                    <div key={c.id} className="space-y-3">
                      {/* Root Comment Row */}
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        {c.profiles?.avatar_url ? (
                          <img
                            src={c.profiles.avatar_url}
                            alt={c.profiles.display_name}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-border shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent ring-1 ring-border shrink-0">
                            {getInitials(c.profiles?.display_name || "User")}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="rounded-2xl bg-surface/40 px-3.5 py-2.5 border border-border/20">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-1.5 min-w-0">
                                <span className="text-xs font-semibold text-text-primary truncate">
                                  {c.profiles?.display_name}
                                </span>
                                <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                                  @{c.profiles?.username}
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
                          
                          {/* Actions Bar */}
                          <div className="flex items-center gap-3 mt-1 px-1.5">
                            <button
                              onClick={() => {
                                setReplyingTo({
                                  id: c.id,
                                  username: c.profiles?.username || c.profiles?.display_name || "user"
                                });
                                commentInputRef.current?.focus();
                              }}
                              className="text-[10px] font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </motion.div>

                      {/* Nested Replies */}
                      {(() => {
                        const rootReplies = comments.filter(
                          (reply) => reply.parent_id !== null && getRootId(reply.id, comments) === c.id
                        );
                        if (rootReplies.length === 0) return null;
                        return (
                          <div className="pl-6 mt-2.5 space-y-3 border-l-2 border-border/10 ml-4">
                            {rootReplies.map((reply) => {
                              const parentComment = comments.find((pc) => pc.id === reply.parent_id);
                              const parentUsername = parentComment?.profiles?.username || parentComment?.profiles?.display_name;

                              return (
                                <motion.div
                                  key={reply.id}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex gap-2.5 animate-fade-in"
                                >
                                  {reply.profiles?.avatar_url ? (
                                    <img
                                      src={reply.profiles.avatar_url}
                                      alt={reply.profiles.display_name}
                                      className="h-6.5 w-6.5 rounded-full object-cover ring-1 ring-border shrink-0"
                                    />
                                  ) : (
                                    <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-accent-muted text-[10px] font-bold text-accent ring-1 ring-border shrink-0">
                                      {getInitials(reply.profiles?.display_name || "User")}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="rounded-2xl bg-surface/20 px-3 py-2 border border-border/15">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-baseline gap-1.5 min-w-0">
                                          <span className="text-[11px] font-semibold text-text-primary truncate">
                                            {reply.profiles?.display_name}
                                          </span>
                                          <span className="text-[9px] text-text-muted truncate hidden sm:inline">
                                            @{reply.profiles?.username}
                                          </span>
                                        </div>
                                        <span className="text-[8px] text-text-muted shrink-0">
                                          {formatRelativeTime(reply.created_at)}
                                        </span>
                                      </div>
                                      {parentUsername && (
                                        <span className="text-[9.5px] text-accent font-medium mt-0.5 block">
                                          Replying to @{parentUsername}
                                        </span>
                                      )}
                                      <p className="mt-0.5 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                    </div>
                                    
                                    {/* Action Bar for Reply */}
                                    <div className="flex items-center gap-3 mt-1 px-1.5">
                                      <button
                                        onClick={() => {
                                          setReplyingTo({
                                            id: reply.id,
                                            username: reply.profiles?.username || reply.profiles?.display_name || "user"
                                          });
                                          commentInputRef.current?.focus();
                                        }}
                                        className="text-[10px] font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border/40 text-text-muted">
                      <MessageSquare className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs text-text-muted">No comments yet. Say something!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
