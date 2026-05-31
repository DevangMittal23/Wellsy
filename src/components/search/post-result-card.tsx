"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface PostResultCardProps {
  post: {
    id: string;
    content: string | null;
    post_type: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  };
  searchQuery: string;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="rounded bg-accent/20 px-0.5 text-accent"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function PostResultCard({ post, searchQuery }: PostResultCardProps) {
  const author = post.profiles;

  return (
    <Link
      href="/feed"
      className="glass-card group block p-4 transition-all duration-200 hover:bg-surface-hover"
    >
      {/* Author */}
      {author && (
        <div className="mb-2 flex items-center gap-2">
          {author.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.display_name}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-muted text-[10px] font-semibold text-accent">
              {getInitials(author.display_name)}
            </div>
          )}
          <span className="text-xs font-medium text-text-secondary">
            {author.display_name}
          </span>
          <span className="text-xs text-text-muted">
            · {formatRelativeTime(post.created_at)}
          </span>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <p className="line-clamp-3 text-sm text-text-primary leading-relaxed">
          {highlightMatch(post.content, searchQuery)}
        </p>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Heart className="h-3.5 w-3.5" />
          {post.likes_count}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <MessageCircle className="h-3.5 w-3.5" />
          {post.comments_count}
        </span>
      </div>
    </Link>
  );
}
