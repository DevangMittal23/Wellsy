"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { acceptFriendRequest, rejectFriendRequest } from "@/actions/friend-actions";
import { getInitials, formatRelativeTime } from "@/lib/utils";

interface FriendRequest {
  id: string;
  sender_id: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_online: boolean;
  };
}

interface FriendRequestCardProps {
  request: FriendRequest;
  onAction?: () => void;
}

export function FriendRequestCard({ request, onAction }: FriendRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const sender = request.sender;

  if (!sender) return null;

  const handleAccept = () => {
    startTransition(async () => {
      await acceptFriendRequest(request.id);
      onAction?.();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectFriendRequest(request.id);
      onAction?.();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover"
    >
      {/* Avatar */}
      <Link href={`/profile/${sender.username}`} className="relative shrink-0">
        {sender.avatar_url ? (
          <img
            src={sender.avatar_url}
            alt={sender.display_name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent ring-2 ring-border">
            {getInitials(sender.display_name)}
          </div>
        )}
        {sender.is_online && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
        )}
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${sender.username}`} className="group">
          <p className="truncate text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
            {sender.display_name}
          </p>
          <p className="text-xs text-text-muted">@{sender.username}</p>
        </Link>
        {sender.bio && (
          <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">
            {sender.bio}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-text-muted">
          {formatRelativeTime(request.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Accept
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-all duration-200 hover:border-error/50 hover:text-error active:scale-95 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
