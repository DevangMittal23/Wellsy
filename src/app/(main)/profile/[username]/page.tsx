import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile, checkFollowing } from "@/actions/profile-actions";
import { checkFriendshipStatus } from "@/actions/friend-actions";
import { getUserPosts } from "@/actions/post-actions";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import type { Post } from "@/types/post";
import type { Profile } from "@/types/user";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return { title: "User not found" };
  }

  return {
    title: `${profile.display_name} (@${profile.username})`,
    description: profile.bio || `Check out ${profile.display_name}'s profile on WELLSY.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;
  const [isFollowing, friendshipStatus] = await Promise.all([
    user ? checkFollowing(profile.id) : false,
    user && !isOwnProfile ? checkFriendshipStatus(profile.id) : ("none" as const),
  ]);

  // If they sent us a friend request, get the request ID for the accept button
  let friendRequestId: string | undefined;
  if (friendshipStatus === "request_received" && user) {
    const { data: request } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("sender_id", profile.id)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    friendRequestId = request?.id;
  }

  const { posts } = await getUserPosts(profile.id);

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile as Profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        friendshipStatus={friendshipStatus}
        friendRequestId={friendRequestId}
      />
      <ProfileTabs
        posts={posts as Post[]}
        userId={profile.id}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
