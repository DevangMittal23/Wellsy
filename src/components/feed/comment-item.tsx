"use client";

import { motion } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Comment } from "@/types";

interface CommentItemProps {
  comment: Comment;
  onReplyClick: (commentId: string, username: string) => void;
}

export function CommentItem({ comment, onReplyClick }: CommentItemProps) {
  const author = comment.author;

  return (
    <div className="space-y-3">
      {/* Main Comment Row */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <UserAvatar
          src={author?.avatar_url}
          name={author?.display_name || "User"}
          size="xs"
        />
        <div className="flex-1">
          <div className="rounded-2xl bg-surface/40 px-3.5 py-2.5 border border-border/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-text-primary truncate">
                  {author?.display_name}
                </span>
                <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                  @{author?.username}
                </span>
              </div>
              <span className="text-[9px] text-text-muted shrink-0">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* Reply Action */}
          <div className="flex items-center gap-3 mt-1 px-1.5">
            <button
              onClick={() => onReplyClick(comment.id, author?.username || "user")}
              className="text-[10px] font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
            >
              Reply
            </button>
          </div>
        </div>
      </motion.div>

      {/* Nested Replies Rendering */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 space-y-3 border-l border-border/10 ml-4">
          {comment.replies.map((reply) => {
            const replyAuthor = reply.author;
            return (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <UserAvatar
                  src={replyAuthor?.avatar_url}
                  name={replyAuthor?.display_name || "User"}
                  size="xs"
                />
                <div className="flex-1">
                  <div className="rounded-2xl bg-surface/20 px-3 py-2 border border-border/15">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-[11px] font-semibold text-text-primary truncate">
                          {replyAuthor?.display_name}
                        </span>
                        <span className="text-[9px] text-text-muted truncate hidden sm:inline">
                          @{replyAuthor?.username}
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
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
