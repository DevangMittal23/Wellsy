"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { StoryViewer } from "./story-viewer";
import type { Story } from "@/types";
import { cn } from "@/lib/utils";

interface StoryCircleProps {
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  stories: Story[];
  onStoriesUpdated: () => void;
}

export function StoryCircle({
  author,
  stories,
  onStoriesUpdated,
}: StoryCircleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if there are any unread stories
  const hasUnread = stories.some((s) => !s.is_viewed);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <button
          onClick={handleClick}
          className="relative rounded-full p-[2.5px] focus:outline-none cursor-pointer"
          style={{
            background: hasUnread
              ? "linear-gradient(to top right, var(--color-accent), hsl(340 82% 52%))"
              : "hsl(240 4% 16%)",
          }}
        >
          <div className="rounded-full bg-background-secondary p-[2px]">
            <UserAvatar
              src={author.avatar_url}
              name={author.display_name}
              size="md"
              className="ring-0"
            />
          </div>
        </button>
        <span className="text-[10px] font-semibold text-text-secondary max-w-[64px] truncate">
          {author.display_name.split(" ")[0]}
        </span>
      </div>

      {isOpen && (
        <StoryViewer
          author={author}
          stories={stories}
          onClose={() => {
            setIsOpen(false);
            onStoriesUpdated();
          }}
        />
      )}
    </>
  );
}
