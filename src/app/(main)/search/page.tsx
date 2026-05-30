import type { Metadata } from "next";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for users, posts, and hashtags on WELLSY.",
};

export default function SearchPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Search</h1>
        <p className="text-sm text-text-secondary">
          Find people, posts, and topics
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          placeholder="Search WELLSY..."
          className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
        />
      </div>

      {/* Trending section placeholder */}
      <div className="mt-8 glass-card p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Trending
        </h2>
        <div className="space-y-3">
          {["#wellsy", "#introduction", "#tech", "#design", "#creative"].map(
            (tag) => (
              <div
                key={tag}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface"
              >
                <span className="text-sm font-medium text-accent">{tag}</span>
                <span className="text-xs text-text-muted">Trending</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
