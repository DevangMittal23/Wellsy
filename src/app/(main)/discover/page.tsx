import type { Metadata } from "next";
import { getSuggestedUsers } from "@/actions/friendships";
import { PeopleGrid } from "@/components/friends/people-grid";
import { Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/feed/post-card";
import type { Post } from "@/types";

export const metadata: Metadata = {
  title: "Explore",
  description: "What's hot. Who's here on HUDdang.",
};

export default async function DiscoverPage() {
  const suggested = await getSuggestedUsers();
  
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
          What's hot. Who's here.
        </p>
      </div>

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
