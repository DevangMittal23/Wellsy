import type { Metadata } from "next";
import { getSuggestedUsers } from "@/actions/friendships";
import { getTopSignalUsers } from "@/actions/signal-score";
import { PeopleGrid } from "@/components/friends/people-grid";
import { Users, TrendingUp, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/feed/post-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SignalBadge } from "@/components/shared/signal-badge";
import type { Post } from "@/types";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore",
  description: "What's hot. Who's here on HUDdang.",
};

export default async function DiscoverPage() {
  const [suggested, topSignalUsers] = await Promise.all([
    getSuggestedUsers(),
    getTopSignalUsers(5),
  ]);
  
  const supabase = await createClient();
  const { data: trending } = await supabase
    .from("posts")
    .select("*, author:users(*)")
    .eq("visibility", "public")
    .order("likes_count", { ascending: false })
    .limit(6);

  const trendingPosts = (trending || []) as Post[];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Explore
        </h1>
        <p className="text-sm text-text-secondary">
          What&apos;s hot. Who&apos;s here.
        </p>
      </div>

      {/* Blazing Right Now — Top Signal Score users */}
      {topSignalUsers.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-text-primary font-display">
              Blazing Right Now
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {topSignalUsers.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group"
              >
                <UserAvatar
                  src={user.avatar_url}
                  name={user.display_name}
                  size="lg"
                  pulseType={user.pulse_type}
                />
                <p className="text-xs text-center truncate w-full text-text-secondary group-hover:text-text-primary transition-colors">
                  {user.display_name}
                </p>
                <SignalBadge
                  userId={user.id}
                  variant="compact"
                  staticScore={user.signal_score}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Posts Section */}
      <div>
        <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary font-display">
            Trending on HUDdang
          </h2>
        </div>
        
        {trendingPosts.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center py-12 rounded-2xl">
            <p className="text-sm text-text-secondary">No trending posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Suggested People Section */}
      <div>
        <div className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-2">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary font-display">
            People you may know
          </h2>
        </div>
        <PeopleGrid people={suggested} />
      </div>
    </div>
  );
}

