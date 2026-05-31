"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  LinkIcon,
  Calendar,
  Edit3,
  UserPlus,
  UserCheck,
  MessageCircle,
} from "lucide-react";
import { followUser, unfollowUser } from "@/actions/profile-actions";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { FriendButton } from "@/components/friends/friend-button";
import type { Profile } from "@/types/user";
import type { FriendshipStatus } from "@/actions/friend-actions";
import Link from "next/link";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  friendshipStatus: FriendshipStatus;
  friendRequestId?: string;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing: initialIsFollowing,
  friendshipStatus,
  friendRequestId,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleFollowToggle = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);

    startTransition(async () => {
      if (newFollowing) {
        await followUser(profile.id);
      } else {
        await unfollowUser(profile.id);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden rounded-2xl sm:h-52">
        {profile.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, hsl(263 70% 30%), hsl(290 65% 25%), hsl(240 30% 15%))",
            }}
          />
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
      </div>

      {/* Profile info section */}
      <div className="relative px-1">
        {/* Avatar */}
        <div className="relative -mt-16 ml-4 sm:-mt-20">
          <div className="relative inline-block">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-28 w-28 rounded-full border-4 border-background object-cover shadow-xl sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-background bg-accent-muted text-2xl font-bold text-accent shadow-xl sm:h-32 sm:w-32">
                {getInitials(profile.display_name)}
              </div>
            )}
            {profile.is_online && (
              <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-3 border-background bg-success" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="absolute right-0 top-2 flex items-center gap-2 sm:top-4">
          {isOwnProfile ? (
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-surface-hover active:scale-95"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Link>
          ) : (
            <>
              {/* Friend Button */}
              <FriendButton
                targetUserId={profile.id}
                initialStatus={friendshipStatus}
                requestId={friendRequestId}
              />

              {/* Follow Button */}
              <button
                onClick={handleFollowToggle}
                disabled={isPending}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                  isFollowing
                    ? "border border-border bg-surface text-text-primary hover:bg-surface-hover hover:border-error/50 hover:text-error"
                    : "bg-accent text-white hover:bg-accent-hover"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </button>

              {/* Message Button */}
              <Link
                href={`/chat?user=${profile.username}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-all duration-200 hover:bg-surface-hover active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Name & Bio */}
        <div className="mt-4 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {profile.display_name}
            </h1>
            <p className="text-sm text-text-muted">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-[15px] leading-relaxed text-text-secondary">
              {profile.bio}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatRelativeTime(profile.created_at)}
            </span>
          </div>

          {/* Skills & Interests */}
          {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent"
                >
                  {skill}
                </span>
              ))}
              {profile.interests?.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-text-secondary"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-5 pt-1">
            <div className="group cursor-pointer">
              <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {profile.posts_count}
              </span>
              <span className="ml-1 text-sm text-text-muted">Posts</span>
            </div>
            <div className="group cursor-pointer">
              <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {profile.followers_count}
              </span>
              <span className="ml-1 text-sm text-text-muted">Followers</span>
            </div>
            <div className="group cursor-pointer">
              <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {profile.following_count}
              </span>
              <span className="ml-1 text-sm text-text-muted">Following</span>
            </div>
            <div className="group cursor-pointer">
              <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                {profile.friends_count}
              </span>
              <span className="ml-1 text-sm text-text-muted">Friends</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
