import type { Metadata } from "next";
import { getSuggestedPeople, getPendingFriendRequests } from "@/actions/friend-actions";
import { PeopleGrid } from "@/components/friends/people-grid";
import { FriendRequestCard } from "@/components/friends/friend-request-card";
import { Users, UserPlus } from "lucide-react";

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Discover People
        </h1>
        <p className="text-sm text-text-secondary">
          Find friends and grow your network
        </p>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">
              Friend Requests
            </h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request as { id: string; sender_id: string; created_at: string; sender?: { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; is_online: boolean } }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggested People */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">
            People you may know
          </h2>
        </div>
        <PeopleGrid
          people={suggested as { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; is_online: boolean; followers_count: number }[]}
        />
      </div>
    </div>
  );
}
