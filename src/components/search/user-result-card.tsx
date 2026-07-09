"use client";

import { UserAvatar } from "@/components/shared/user-avatar";
import Link from "next/link";

interface UserResultCardProps {
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

export function UserResultCard({ user }: UserResultCardProps) {
  return (
    <div className="glass-card group flex items-center gap-3 p-4 transition-all duration-200 hover:bg-surface-hover">
      {/* Avatar */}
      <Link href={`/profile/${user.username}`} className="relative shrink-0">
        <UserAvatar src={user.avatar_url} name={user.display_name} size="sm" />
      </Link>

      {/* Info */}
      <Link href={`/profile/${user.username}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
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

      {/* Action */}
      <Link
        href={`/profile/${user.username}`}
        className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-all duration-200 hover:bg-surface-hover active:scale-95 cursor-pointer"
      >
        View Profile
      </Link>
    </div>
  );
}
