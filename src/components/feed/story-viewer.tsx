"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { viewStory } from "@/actions/stories";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatRelativeTime } from "@/lib/utils";
import type { Story } from "@/types";

interface StoryViewerProps {
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  stories: Story[];
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export function StoryViewer({ author, stories, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const activeStory = stories[index];

  const handleNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [index]);

  // View active story trigger
  useEffect(() => {
    if (activeStory) {
      viewStory(activeStory.id).catch(console.error);
    }
  }, [activeStory]);

  // Automated progress bar ticker
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION_MS) {
        clearInterval(interval);
        handleNext();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [index, handleNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none">
      {/* Outer bounds clickable area for desktop navigation */}
      <div className="absolute inset-0 flex">
        <div className="w-1/4 h-full cursor-pointer" onClick={handlePrev} />
        <div className="w-2/4 h-full" />
        <div className="w-1/4 h-full cursor-pointer" onClick={handleNext} />
      </div>

      <div className="relative z-10 flex h-full w-full max-w-md flex-col justify-between p-4">
        {/* Header section with progress indicators */}
        <div className="w-full space-y-3">
          {/* Progress Indicators */}
          <div className="flex gap-1.5 w-full">
            {stories.map((story, i) => (
              <div
                key={story.id}
                className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
              >
                <div
                  className="bg-white h-full transition-all duration-75"
                  style={{
                    width:
                      i === index
                        ? `${progress}%`
                        : i < index
                        ? "100%"
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Profile Header */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={author.avatar_url}
                name={author.display_name}
                size="sm"
              />
              <div>
                <p className="text-sm font-semibold">{author.display_name}</p>
                <p className="text-xs text-white/60">
                  {formatRelativeTime(activeStory.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Media display */}
        <div className="flex-1 flex items-center justify-center relative my-4 rounded-xl overflow-hidden bg-black">
          {activeStory.media_type === "video" ? (
            <video
              src={activeStory.media_url}
              autoPlay
              muted
              className="max-h-full max-w-full object-contain"
              onEnded={handleNext}
            />
          ) : (
            <img
              src={activeStory.media_url}
              alt="Story"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Caption */}
        {activeStory.caption && (
          <div className="w-full text-center text-white bg-black/40 backdrop-blur-sm rounded-xl py-3 px-4 mb-2">
            <p className="text-sm">{activeStory.caption}</p>
          </div>
        )}

        {/* Navigation Buttons for convenience */}
        <div className="flex justify-between items-center px-4 py-2">
          <button
            onClick={handlePrev}
            disabled={index === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
