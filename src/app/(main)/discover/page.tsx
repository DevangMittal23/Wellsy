import type { Metadata } from "next";
import { getSuggestedPeople, getPendingFriendRequests } from "@/actions/friend-actions";
import { DiscoverClient } from "@/components/galaxy/discover-client";

export const metadata: Metadata = {
  title: "Discover People",
  description: "Find and connect with people on WELLSY.",
};

export default async function DiscoverPage() {
  const [suggested, pendingRequests] = await Promise.all([
    getSuggestedPeople(),
    getPendingFriendRequests(),
  ]);

  return (
    <DiscoverClient
      suggested={suggested as { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; is_online: boolean; followers_count: number }[]}
      pendingRequests={pendingRequests as { id: string; sender_id: string; created_at: string; sender?: { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; is_online: boolean } }[]}
    />
  );
}
