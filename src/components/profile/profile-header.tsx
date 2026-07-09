"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { Edit3, MessageCircle, UserPlus, UserCheck, UserMinus, Clock } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { useFriendStatus } from "@/hooks/use-friend-status";
import { sendFriendRequest, removeFriend, acceptFriendRequest } from "@/actions/friendships";
import type { User } from "@/types";
import Link from "next/link";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SignalBadge } from "@/components/shared/signal-badge";
import { SignalScoreChart } from "@/components/profile/signal-score-chart";

interface ProfileHeaderProps {
  profile: User;
  isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const { status, friendshipId, isRequester, isLoading, refresh } = useFriendStatus(profile.id);
  const [isPending, startTransition] = useTransition();

  const handleFriendAction = () => {
    startTransition(async () => {
      try {
        if (!status) {
          // Send request
          const res = await sendFriendRequest(profile.id);
          if (res.error) toast.error(res.error);
          else toast.success("Friend request sent!");
        } else if (status === "pending" && !isRequester && friendshipId) {
          // Accept request
          const res = await acceptFriendRequest(friendshipId);
          if (res.error) toast.error(res.error);
          else toast.success("Friend request accepted!");
        } else if (status === "accepted" && friendshipId) {
          // Remove friend
          const res = await removeFriend(friendshipId);
          if (res.error) toast.error(res.error);
          else toast.success("Friend removed");
        }
        refresh();
      } catch (err) {
        toast.error("Failed to perform action");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Cover Image Placeholder */}
      <div className="relative h-40 overflow-hidden rounded-2xl sm:h-52">
        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(263 70% 30%), hsl(290 65% 25%), hsl(240 30% 15%))",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Info bar */}
      <div className="relative px-1">
        {/* Avatar */}
        <div className="relative -mt-16 ml-4 sm:-mt-20">
          <div className="relative inline-block rounded-full border-4 border-background bg-background">
            <UserAvatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="xl"
              className="ring-0"
              pulseType={profile.pulse_type}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="absolute right-0 top-2 flex items-center gap-2 sm:top-4">
          {isOwnProfile ? (
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-surface-hover active:scale-95 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Link>
          ) : (
            <>
              {/* Friend Button */}
              {!isLoading && (
                <button
                  onClick={handleFriendAction}
                  disabled={isPending || (status === "pending" && isRequester)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer",
                    !status && "bg-accent text-white hover:bg-accent-hover",
                    status === "pending" &&
                      isRequester &&
                      "bg-surface border border-border text-text-secondary cursor-not-allowed",
                    status === "pending" &&
                      !isRequester &&
                      "bg-success text-white hover:bg-success/90",
                    status === "accepted" &&
                      "border border-border bg-surface text-text-primary hover:bg-surface-hover hover:text-error hover:border-error/30"
                  )}
                >
                  {!status && (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </>
                  )}
                  {status === "pending" && isRequester && (
                    <>
                      <Clock className="h-4 w-4" />
                      Request Sent
                    </>
                  )}
                  {status === "pending" && !isRequester && (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Accept Request
                    </>
                  )}
                  {status === "accepted" && (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Remove Friend
                    </>
                  )}
                </button>
              )}

              {/* Message Link */}
              <Link
                href={`/chat?user=${profile.username}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-all duration-200 hover:bg-surface-hover active:scale-95 cursor-pointer"
                title="Message"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Identity Details */}
        <div className="mt-4 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {profile.display_name}
            </h1>
            <p className="text-sm text-text-muted">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-[15px] leading-relaxed text-text-secondary max-w-xl">
              {profile.bio}
            </p>
          )}

          {/* Signal Score */}
          <div className="flex items-center gap-3 mt-2">
            <SignalBadge userId={profile.id} variant="full" />
          </div>
          <SignalScoreChart userId={profile.id} />
        </div>
      </div>
    </motion.div>
  );
}
