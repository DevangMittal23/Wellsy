"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getActiveStories } from "@/actions/stories";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { StoryCircle } from "./story-circle";
import type { Story } from "@/types";

export function StoriesBar() {
  const { user } = useAuth();
  const { openModal } = useUIStore();
  const [groupedStories, setGroupedStories] = useState<
    { author: { id: string; username: string; display_name: string; avatar_url: string | null }; stories: Story[] }[]
  >([]);

  useEffect(() => {
    async function loadStories() {
      try {
        const active = await getActiveStories();
        setGroupedStories(active);
      } catch (err) {
        console.error(err);
      }
    }
    if (user?.id) {
      loadStories();
    }
  }, [user?.id]);

  const handleCreateStoryClick = () => {
    openModal("create-post", { type: "story" }); // Using create-post modal with story flag
  };

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-2.5 px-1 scrollbar-none">
      {/* Create Story Button */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <button
          onClick={handleCreateStoryClick}
          className="relative group focus:outline-none cursor-pointer"
        >
          <UserAvatar
            src={user?.avatar_url}
            name={user?.display_name || "User"}
            size="md"
          />
          <div className="absolute bottom-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent border-2 border-background-secondary text-white group-hover:scale-105 transition-transform">
            <Plus className="h-3 w-3 stroke-[3]" />
          </div>
        </button>
        <span className="text-[10px] font-semibold text-text-secondary">My Story</span>
      </div>

      {/* Grouped Stories */}
      {groupedStories.map((group) => (
        <StoryCircle
          key={group.author.id}
          author={group.author}
          stories={group.stories}
          onStoriesUpdated={() => {
            // Reload stories when view changes
            getActiveStories().then(setGroupedStories);
          }}
        />
      ))}
    </div>
  );
}
