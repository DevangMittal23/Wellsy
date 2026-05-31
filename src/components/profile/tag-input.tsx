"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxLength?: number;
  label: string;
  className?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add a tag...",
  maxTags = 10,
  maxLength = 30,
  label,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length > maxLength) return;
    if (tags.length >= maxTags) return;
    if (tags.includes(trimmed)) return;

    onChange([...tags, trimmed]);
    setInput("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-text-secondary">
        {label}
        <span className="ml-1 text-xs text-text-muted">
          ({tags.length}/{maxTags})
        </span>
      </label>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-[46px] flex-wrap gap-1.5 rounded-lg border bg-surface px-3 py-2 transition-all duration-200 cursor-text",
          isFocused
            ? "border-border-focus ring-1 ring-border-focus/50"
            : "border-border hover:border-border-focus/40"
        )}
      >
        <AnimatePresence mode="popLayout">
          {tags.map((tag, index) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-1 text-xs font-medium text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-accent-muted"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (input.trim()) addTag(input);
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="min-w-[80px] flex-1 bg-transparent py-0.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        )}
      </div>
      <p className="mt-1 text-[11px] text-text-muted">
        Press Enter or comma to add
      </p>
    </div>
  );
}
