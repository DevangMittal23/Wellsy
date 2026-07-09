"use client";

import { useState, useRef } from "react";
import { Send, Loader2, MessageSquare, X } from "lucide-react";
import { createComment } from "@/actions/comments";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CommentItem } from "./comment-item";
import { useAuth } from "@/hooks/use-auth";
import type { Comment } from "@/types";
import { toast } from "sonner";

interface PostCommentsProps {
  postId: string;
  comments: Comment[];
  isLoading: boolean;
  onCommentAdded: (comment: Comment) => void;
}

export function PostComments({
  postId,
  comments,
  isLoading,
  onCommentAdded,
}: PostCommentsProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const rootComments = comments.filter((c) => c.parent_comment_id === null);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const parentId = replyingTo ? replyingTo.id : null;
      const res = await createComment(postId, commentText.trim(), parentId);
      if (res && res.comment) {
        onCommentAdded(res.comment as Comment);
        setCommentText("");
        setReplyingTo(null);
        toast.success("Comment posted!");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
    commentInputRef.current?.focus();
  };

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Input section */}
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
                replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."
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

      {/* List section */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : rootComments.length > 0 ? (
          rootComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReplyClick={handleReplyClick}
            />
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
  );
}
