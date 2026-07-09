"use client";

import { useEffect, useState } from "react";
import { Smile } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dynamic from "next/dynamic";

// Dynamically import the picker to avoid server-side rendering issues
const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-[350px] items-center justify-center bg-surface">
      <span className="text-xs text-text-muted">Loading emojis...</span>
    </div>
  ),
});

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-accent transition-colors cursor-pointer focus:outline-none"
          title="Pick Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 border-0 shadow-xl bg-transparent">
        <Picker
          theme={"dark" as any}
          onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
          lazyLoadEmojis={true}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
