"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  removeFriend,
  type FriendshipStatus,
} from "@/actions/friend-actions";
import { cn } from "@/lib/utils";

interface FriendButtonProps {
  targetUserId: string;
  initialStatus: FriendshipStatus;
  requestId?: string;
  size?: "sm" | "md";
}

export function FriendButton({
  targetUserId,
  initialStatus,
  requestId,
  size = "md",
}: FriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleSendRequest = () => {
    setStatus("request_sent");
    startTransition(async () => {
      const result = await sendFriendRequest(targetUserId);
      if (result.error) setStatus("none");
    });
  };

  const handleCancelRequest = () => {
    setStatus("none");
    startTransition(async () => {
      await cancelFriendRequest(targetUserId);
    });
  };

  const handleAcceptRequest = () => {
    if (!requestId) return;
    setStatus("friends");
    startTransition(async () => {
      const result = await acceptFriendRequest(requestId);
      if (result.error) setStatus("request_received");
    });
  };

  const handleRemoveFriend = () => {
    setStatus("none");
    startTransition(async () => {
      await removeFriend(targetUserId);
    });
  };

  const isSmall = size === "sm";

  if (status === "friends") {
    return (
      <motion.button
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={handleRemoveFriend}
        disabled={isPending}
        className={cn(
          "group flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/10 font-medium text-success transition-all duration-200 hover:border-error/50 hover:bg-error/10 hover:text-error active:scale-95 disabled:opacity-50",
          isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
        )}
      >
        {isPending ? (
          <Loader2 className={cn("animate-spin", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
        ) : (
          <>
            <UserCheck className={cn("group-hover:hidden", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <UserX className={cn("hidden group-hover:block", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
          </>
        )}
        <span className="group-hover:hidden">Friends</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </motion.button>
    );
  }

  if (status === "request_sent") {
    return (
      <motion.button
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={handleCancelRequest}
        disabled={isPending}
        className={cn(
          "group flex items-center gap-1.5 rounded-xl border border-border bg-surface font-medium text-text-secondary transition-all duration-200 hover:border-error/50 hover:text-error active:scale-95 disabled:opacity-50",
          isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
        )}
      >
        {isPending ? (
          <Loader2 className={cn("animate-spin", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
        ) : (
          <Clock className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
        )}
        <span className="group-hover:hidden">Pending</span>
        <span className="hidden group-hover:inline">Cancel</span>
      </motion.button>
    );
  }

  if (status === "request_received") {
    return (
      <div className="flex items-center gap-1.5">
        <motion.button
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          onClick={handleAcceptRequest}
          disabled={isPending}
          className={cn(
            "flex items-center gap-1 rounded-xl bg-accent font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:opacity-50",
            isSmall ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          )}
        >
          {isPending ? (
            <Loader2 className={cn("animate-spin", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
          ) : (
            <Check className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
          )}
          Accept
        </motion.button>
        <button
          onClick={() => {
            setStatus("none");
            if (requestId) {
              startTransition(async () => {
                const { rejectFriendRequest } = await import("@/actions/friend-actions");
                await rejectFriendRequest(requestId);
              });
            }
          }}
          disabled={isPending}
          className={cn(
            "flex items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-all duration-200 hover:border-error/50 hover:text-error active:scale-95",
            isSmall ? "h-6 w-6" : "h-8 w-8"
          )}
        >
          <X className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
        </button>
      </div>
    );
  }

  // status === "none"
  return (
    <motion.button
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      onClick={handleSendRequest}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-xl bg-accent font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-95 disabled:opacity-50",
        isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
      )}
    >
      {isPending ? (
        <Loader2 className={cn("animate-spin", isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
      ) : (
        <UserPlus className={cn(isSmall ? "h-3 w-3" : "h-3.5 w-3.5")} />
      )}
      Add Friend
    </motion.button>
  );
}
