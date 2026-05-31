"use client";

import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { FriendButton } from "@/components/friends/friend-button";

interface UserResultCardProps {
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_online: boolean;
    followers_count: number;
  };
}

export function UserResultCard({ user }: UserResultCardProps) {
  return (
    <div className="glass-card group flex items-center gap-3 p-4 transition-all duration-200 hover:bg-surface-hover">
      {/* Avatar */}
      <Link href={`/profile/${user.username}`} className="relative shrink-0">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border">
            {getInitials(user.display_name)}
          </div>
        )}
        {user.is_online && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
        )}
      </Link>

      {/* Info */}
      <Link href={`/profile/${user.username}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">
            {user.display_name}
          </p>
        </div>
        <p className="text-xs text-text-muted">@{user.username}</p>
        {user.bio && (
          <p className="mt-1 line-clamp-1 text-xs text-text-secondary">
            {user.bio}
          </p>
        )}
      </Link>

      {/* Friend + Followers */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <FriendButton
          targetUserId={user.id}
          initialStatus="none"
          size="sm"
        />
        <p className="text-[10px] text-text-muted">
          {user.followers_count}{" "}
          {user.followers_count === 1 ? "follower" : "followers"}
        </p>
      </div>
    </div>
  );
}
