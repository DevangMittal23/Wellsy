"use client";

import { useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { searchUsers, searchPosts, searchHashtags } from "@/actions/search";
import { UserResultCard } from "./user-result-card";
import { PostResultCard } from "./post-result-card";
import { Search, Loader2, Hash, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type SearchTab = "users" | "posts" | "hashtags";

interface SearchResultsProps {
  trendingHashtags: Array<{ id: string; name: string; usage_count: number }>;
}

export function SearchResults({ trendingHashtags }: SearchResultsProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("users");
  const [results, setResults] = useState<{
    users: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      is_online: boolean;
      followers_count: number;
    }>;
    posts: Array<{
      id: string;
      content: string | null;
      post_type: string;
      likes_count: number;
      comments_count: number;
      created_at: string;
      profiles: {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
      } | null;
    }>;
    hashtags: Array<{ id: string; name: string; usage_count: number }>;
  }>({ users: [], posts: [], hashtags: [] });
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const doSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({ users: [], posts: [], hashtags: [] });
        setHasSearched(false);
        return;
      }

      setHasSearched(true);
      startTransition(async () => {
        const [usersResult, postsResult, hashtagsResult] = await Promise.all([
          searchUsers(searchQuery),
          searchPosts(searchQuery),
          searchHashtags(searchQuery),
        ]);

        setResults({
          users: usersResult.results as unknown as typeof results.users,
          posts: postsResult.results as unknown as typeof results.posts,
          hashtags: hashtagsResult as unknown as typeof results.hashtags,
        });
      });
    },
    []
  );

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  const tabs: { key: SearchTab; label: string; icon: typeof Users; count: number }[] = [
    { key: "users", label: "Users", icon: Users, count: results.users.length },
    { key: "posts", label: "Posts", icon: FileText, count: results.posts.length },
    { key: "hashtags", label: "Tags", icon: Hash, count: results.hashtags.length },
  ];

  const isSearching = query.trim().length > 0;

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search HUDdang..."
          autoFocus
          className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 hover:border-border-focus/40 focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus/50"
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />
        )}
      </div>

      {/* Results or Trending */}
      {isSearching ? (
        <div className="mt-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-surface p-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200",
                  activeTab === tab.key
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="search-tab-active"
                    className="absolute inset-0 rounded-lg bg-surface-hover"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {hasSearched && (
                  <span className="text-[10px] text-text-muted">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "users" && (
                <div className="space-y-2">
                  {results.users.length > 0 ? (
                    results.users.map((user) => (
                      <UserResultCard key={user.id} user={user} />
                    ))
                  ) : hasSearched && !isPending ? (
                    <EmptyState text="No users found" />
                  ) : null}
                </div>
              )}

              {activeTab === "posts" && (
                <div className="space-y-2">
                  {results.posts.length > 0 ? (
                    results.posts.map((post) => (
                      <PostResultCard
                        key={post.id}
                        post={post}
                        searchQuery={debouncedQuery}
                      />
                    ))
                  ) : hasSearched && !isPending ? (
                    <EmptyState text="No posts found" />
                  ) : null}
                </div>
              )}

              {activeTab === "hashtags" && (
                <div className="space-y-2">
                  {results.hashtags.length > 0 ? (
                    results.hashtags.map((tag) => (
                      <div
                        key={tag.id}
                        className="glass-card flex items-center justify-between p-4 transition-colors hover:bg-surface-hover"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle">
                            <Hash className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              #{tag.name}
                            </p>
                            <p className="text-xs text-text-muted">
                              {tag.usage_count}{" "}
                              {tag.usage_count === 1 ? "post" : "posts"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : hasSearched && !isPending ? (
                    <EmptyState text="No hashtags found" />
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Trending section */
        <div className="mt-8 glass-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Trending
          </h2>
          {trendingHashtags.length > 0 ? (
            <div className="space-y-1">
              {trendingHashtags.map((tag, index) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setQuery(`#${tag.name}`);
                    setActiveTab("hashtags");
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted w-5">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-accent">
                      #{tag.name}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {tag.usage_count} posts
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No trending topics yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <Search className="mx-auto mb-3 h-8 w-8 text-text-muted" />
      <p className="text-sm text-text-muted">{text}</p>
    </div>
  );
}
