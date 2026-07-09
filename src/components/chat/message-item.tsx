"use client";

import { useState } from "react";
import { Smile, Reply, Edit3, Trash, MoreHorizontal, Play, Pause } from "lucide-react";
import { formatMessageTime } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { reactToMessage, deleteMessage } from "@/actions/messages";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const sender = message.sender;

  const handleReact = async (emoji: string) => {
    try {
      await reactToMessage(message.id, emoji);
      setShowOptions(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage(message.id, "everyone");
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const handleAudioPlay = (url: string) => {
    if (isAudioPlaying && audioEl) {
      audioEl.pause();
      setIsAudioPlaying(false);
      return;
    }

    const audio = audioEl || new Audio(url);
    if (!audioEl) setAudioEl(audio);

    audio.play();
    setIsAudioPlaying(true);
    audio.onended = () => {
      setIsAudioPlaying(false);
    };
  };

  if (message.is_deleted) {
    return (
      <div
        className={cn(
          "flex w-full items-end gap-2.5 my-0.5",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {!isOwn && (
          <div className="w-8 shrink-0">
            {showAvatar && (
              <UserAvatar
                src={sender?.avatar_url}
                name={sender?.display_name || "User"}
                size="xs"
              />
            )}
          </div>
        )}
        <div className="rounded-2xl border border-border/40 bg-surface/20 px-4 py-2.5 text-xs italic text-text-muted">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full items-end gap-2.5 my-0.5 group/msg relative",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Sender Avatar (Only for received messages) */}
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showAvatar ? (
            <UserAvatar
              src={sender?.avatar_url}
              name={sender?.display_name || "User"}
              size="xs"
            />
          ) : null}
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {/* Reply Preview */}
        {message.reply_to && (
          <div className="mb-1 rounded-t-xl bg-surface/50 border border-border/40 px-3 py-1.5 text-[10px] text-text-muted max-w-full truncate">
            <span className="font-semibold text-accent mr-1">
              {message.reply_to.sender_id === message.sender_id ? "Replying to self" : "Replying"}
            </span>
            {message.reply_to.content}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-shadow duration-300 border",
            isOwn
              ? "bg-accent border-accent/40 text-white rounded-br-none"
              : "bg-surface border-border text-text-primary rounded-bl-none"
          )}
        >
          {/* Media Rendering */}
          {message.type === "image" && message.media_url && (
            <div className="mb-1.5 overflow-hidden rounded-lg bg-black/10">
              <img
                src={message.media_url}
                alt="Uploaded media"
                className="max-h-60 object-contain w-full"
                loading="lazy"
              />
            </div>
          )}

          {message.type === "video" && message.media_url && (
            <div className="mb-1.5 overflow-hidden rounded-lg bg-black/10">
              <video src={message.media_url} controls className="max-h-60 w-full" />
            </div>
          )}

          {message.type === "gif" && message.gif_url && (
            <div className="mb-1.5 overflow-hidden rounded-lg bg-black/10">
              <img
                src={message.gif_url}
                alt="GIF"
                className="max-h-48 object-contain w-full"
              />
            </div>
          )}

          {message.type === "audio" && message.media_url && (
            <div className="flex items-center gap-3 py-1 pr-2">
              <button
                onClick={() => handleAudioPlay(message.media_url!)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer",
                  isOwn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-accent/15 hover:bg-accent/25 text-accent"
                )}
              >
                {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Voice note</span>
                <span className="text-[11px] opacity-70">
                  {message.media_metadata?.duration
                    ? `${Math.floor(message.media_metadata.duration)}s`
                    : "0:00"}
                </span>
              </div>
            </div>
          )}

          {message.type === "file" && message.media_url && (
            <div className="flex items-center gap-2.5 py-1.5">
              <span className="text-xl">📎</span>
              <a
                href={message.media_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline font-semibold truncate hover:opacity-80"
              >
                {message.media_metadata?.filename || "Download Attachment"}
              </a>
            </div>
          )}

          {/* Text Content */}
          {message.content && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>}

          {/* Time & Edit Status */}
          <div
            className={cn(
              "text-[9px] text-right mt-1 opacity-70 flex justify-end items-center gap-1",
              isOwn ? "text-white/80" : "text-text-muted"
            )}
          >
            {message.is_edited && <span>edited</span>}
            <span>{formatMessageTime(message.created_at)}</span>
          </div>
        </div>

        {/* Reactions Render */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((react) => (
              <span
                key={react.id}
                onClick={() => handleReact(react.emoji)}
                className="flex items-center gap-1 rounded-full bg-surface-hover/80 px-2 py-0.5 text-[10px] border border-border/40 cursor-pointer hover:bg-surface-hover transition-colors"
                title={`Reacted by @${react.user?.username}`}
              >
                {react.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover action menu */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center bg-surface-secondary/90 backdrop-blur-sm border border-border/50 rounded-xl px-2 py-1 shadow-md gap-1 z-10",
          isOwn ? "right-full mr-2" : "left-full ml-2"
        )}
      >
        {/* Basic Reactions shortcuts */}
        {["👍", "❤️", "😂", "😮"].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="hover:scale-125 transition-transform text-xs cursor-pointer"
          >
            {emoji}
          </button>
        ))}

        <div className="h-4 w-px bg-border/50 mx-1" />

        {isOwn && (
          <button
            onClick={handleDelete}
            className="rounded p-1 hover:bg-surface-hover text-error cursor-pointer"
            title="Delete Message"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
