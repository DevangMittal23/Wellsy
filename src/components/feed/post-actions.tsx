"use client";

import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostActionsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onCommentToggle: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export function PostActions({
  isLiked,
  isBookmarked,
  likesCount,
  commentsCount,
  onLike,
  onCommentToggle,
  onBookmark,
  onShare,
}: PostActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const handleLikeClick = () => {
    setIsLikeAnimating(true);
    onLike();
    setTimeout(() => setIsLikeAnimating(false), 400);
  };

  const handleShareClick = async () => {
    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 px-3 py-3 border-b border-border/20">
      {/* Like */}
      <button
        onClick={handleLikeClick}
        className={cn(
          "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
          isLiked
            ? "text-rose-400"
            : "text-text-muted hover:text-rose-400 hover:bg-rose-400/10"
        )}
      >
        <Heart
          className={cn(
            "h-[18px] w-[18px] transition-all duration-200",
            isLiked && "fill-rose-400",
            isLikeAnimating && "animate-[heart-burst_0.4s_ease-out]"
          )}
        />
        {likesCount > 0 && (
          <span className="text-xs font-medium">{likesCount}</span>
        )}
      </button>

      {/* Comment */}
      <button
        onClick={onCommentToggle}
        className={cn(
          "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
          "text-text-muted hover:text-info hover:bg-info/10"
        )}
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        {commentsCount > 0 && (
          <span className="text-xs font-medium">{commentsCount}</span>
        )}
      </button>

      {/* Save */}
      <button
        onClick={onBookmark}
        className={cn(
          "group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
          isBookmarked
            ? "text-amber-400"
            : "text-text-muted hover:text-amber-400 hover:bg-amber-400/10"
        )}
      >
        <Bookmark
          className={cn(
            "h-[18px] w-[18px] transition-all duration-200",
            isBookmarked && "fill-amber-400"
          )}
        />
      </button>

      {/* Share */}
      <button
        onClick={handleShareClick}
        className={cn(
          "group ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
          copied
            ? "text-success bg-success/10"
            : "text-text-muted hover:text-accent hover:bg-accent/10"
        )}
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
  );
}
