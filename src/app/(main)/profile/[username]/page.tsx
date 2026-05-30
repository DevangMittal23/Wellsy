import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfile, checkFollowing } from "@/actions/profile-actions";
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
  const isFollowing = user ? await checkFollowing(profile.id) : false;
  const { posts } = await getUserPosts(profile.id);

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile as Profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
      />
      <ProfileTabs
        posts={posts as Post[]}
        userId={profile.id}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
