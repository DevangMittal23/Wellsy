"use client";

import { useState } from "react";
import { Smile, Reply, Edit3, Trash, MoreHorizontal, Play, Pause } from "lucide-react";
import { formatMessageTime } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/user-avatar";
import { reactToMessage, deleteMessage } from "@/actions/messages";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const isEmojiOnly = (text: string) => {
  if (!text) return false;
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  const cleaned = text.trim();
  if (cleaned.length === 0 || cleaned.length > 8) return false;
  return emojiRegex.test(text);
};

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

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

  const hasText = !!message.content;
  const hasMedia = !!(message.media_url || message.gif_url);
  const emojiOnly = isEmojiOnly(message.content || "") && !hasMedia;

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
            "relative transition-all duration-300",
            emojiOnly
              ? "py-1.5 bg-transparent border-transparent shadow-none"
              : cn(
                  "rounded-2xl shadow-sm border",
                  hasMedia && !hasText ? "p-0 overflow-hidden" : "px-4 py-2.5",
                  isOwn
                    ? "bg-accent border-accent/40 text-white"
                    : "bg-surface border-border text-text-primary"
                )
          )}
          style={!emojiOnly ? {
            borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px"
          } : undefined}
        >
          {/* Media Rendering */}
          {message.type === "image" && message.media_url && (
            <>
              <div 
                className="max-w-[280px] sm:max-w-[220px] md:max-w-[280px] max-h-[320px] rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setShowLightbox(true)}
              >
                <img
                  src={message.media_url}
                  alt="Shared image"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '320px', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
              <AnimatePresence>
                {showLightbox && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowLightbox(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
                  >
                    <motion.img
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      src={message.media_url}
                      alt="Enlarged shared image"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {message.type === "video" && message.media_url && (
            <div className="max-w-[280px] sm:max-w-[220px] md:max-w-[280px] rounded-xl overflow-hidden">
              <video 
                src={message.media_url}
                controls
                className="w-full h-auto"
                style={{ maxHeight: '240px', objectFit: 'cover' }}
              />
            </div>
          )}

          {message.type === "gif" && message.gif_url && (
            <div className="max-w-[280px] sm:max-w-[220px] md:max-w-[280px] rounded-xl overflow-hidden">
              <img src={message.gif_url} alt="GIF" className="w-full h-auto" />
            </div>
          )}

          {message.type === "audio" && message.media_url && (
            <div className={cn(
              "flex items-center gap-3 w-[220px] h-12 px-3 rounded-full border",
              isOwn
                ? "bg-white/20 border-white/30"
                : "bg-purple-500/20 border-purple-500/30"
            )}>
              <button
                type="button"
                onClick={() => handleAudioPlay(message.media_url!)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors",
                  isOwn ? "bg-white text-purple-600 hover:bg-white/90" : "bg-purple-500 text-white hover:bg-purple-600"
                )}
              >
                {isAudioPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
              </button>
              {/* Static waveform SVG bars */}
              <div className="flex items-end gap-[2.5px] flex-1 h-5 mb-0.5">
                {[4, 12, 8, 16, 6, 14, 10, 18, 8, 12, 10, 16, 6, 14, 8, 18, 12, 6, 10, 4].map((h, i) => (
                  <div
                    key={i} 
                    className={cn(
                      "w-[2px] rounded-full",
                      isOwn
                        ? (isAudioPlaying ? "bg-white" : "bg-white/50")
                        : (isAudioPlaying ? "bg-purple-400" : "bg-purple-400/50")
                    )}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
              <span className={cn("text-xs flex-shrink-0 select-none", isOwn ? "text-white/80" : "text-text-secondary")}>
                {message.media_metadata?.duration
                  ? `${Math.floor(Number(message.media_metadata.duration) / 60)}:${String(Math.floor(Number(message.media_metadata.duration) % 60)).padStart(2, '0')}`
                  : "0:00"}
              </span>
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
          {message.content && !hasMedia && (
            emojiOnly ? (
              <p className="text-4xl leading-none select-none">{message.content}</p>
            ) : (
              <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )
          )}
          {message.content && hasMedia && (
            <p className="leading-relaxed whitespace-pre-wrap mt-1.5">{message.content}</p>
          )}

          {/* Time & Edit Status */}
          <div
            className={cn(
              "text-[9px] text-right mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity flex justify-end items-center gap-1",
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
