import type { Metadata } from "next";
import { getTrendingHashtags } from "@/actions/search-actions";
import { SearchResults } from "@/components/search/search-results";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for users, posts, and hashtags on WELLSY.",
};

export default async function SearchPage() {
  const trendingHashtags = await getTrendingHashtags();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Search</h1>
        <p className="text-sm text-text-secondary">
          Find people, posts, and topics
        </p>
      </div>

      <SearchResults trendingHashtags={trendingHashtags} />
    </div>
  );
}
