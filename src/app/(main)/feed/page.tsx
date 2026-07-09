import type { Metadata } from "next";
import { getFeedPosts } from "@/actions/posts";
import { FeedList } from "@/components/feed/feed-list";
import type { Post } from "@/types";

export const metadata: Metadata = {
  title: "Feed",
  description: "See what your community is sharing on HUDdang.",
};

export default async function FeedPage() {
  const { posts, hasMore } = await getFeedPosts();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Feed</h1>
        <p className="text-sm text-text-secondary">
          See what's happening in your world
        </p>
      </div>

      <FeedList
        initialPosts={posts as Post[]}
        initialHasMore={hasMore}
      />
    </div>
  );
}
